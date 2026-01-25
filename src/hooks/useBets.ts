import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Bet {
  id: string;
  user_id: string;
  round_id: string;
  bet_choice: string;
  amount: number;
  won: boolean | null;
  payout: number | null;
  created_at: string;
}

export function useBets() {
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [currentBet, setCurrentBet] = useState<Bet | null>(null);
  const { user } = useAuth();

  const placeBet = useCallback(async (
    roundId: string,
    betChoice: string,
    amount: number
  ): Promise<Bet | null> => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to place a bet",
        variant: "destructive",
      });
      return null;
    }

    setIsPlacingBet(true);

    try {
      // First check wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (walletError || !wallet) {
        throw new Error('Could not fetch wallet');
      }

      if (wallet.balance < amount) {
        toast({
          title: "Insufficient Balance",
          description: "You don't have enough balance for this bet",
          variant: "destructive",
        });
        return null;
      }

      // Check if already bet on this round
      const { data: existingBet } = await supabase
        .from('bets')
        .select('id')
        .eq('user_id', user.id)
        .eq('round_id', roundId)
        .maybeSingle();

      if (existingBet) {
        toast({
          title: "Already placed a bet",
          description: "You can only place one bet per round",
          variant: "destructive",
        });
        return null;
      }

      // Place the bet
      const { data: bet, error: betError } = await supabase
        .from('bets')
        .insert({
          user_id: user.id,
          round_id: roundId,
          bet_choice: betChoice,
          amount: amount,
        })
        .select()
        .single();

      if (betError) {
        throw betError;
      }

      setCurrentBet(bet as Bet);
      
      toast({
        title: "Bet Placed!",
        description: `₹${amount} on ${betChoice}`,
      });

      return bet as Bet;
    } catch (error) {
      console.error('Error placing bet:', error);
      toast({
        title: "Failed to place bet",
        description: "Please try again",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsPlacingBet(false);
    }
  }, [user]);

  const fetchBetForRound = useCallback(async (roundId: string): Promise<Bet | null> => {
    if (!user) return null;

    try {
      const { data } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', user.id)
        .eq('round_id', roundId)
        .maybeSingle();

      if (data) {
        setCurrentBet(data as Bet);
        return data as Bet;
      }
      
      setCurrentBet(null);
      return null;
    } catch (error) {
      console.error('Error fetching bet:', error);
      return null;
    }
  }, [user]);

  const clearCurrentBet = useCallback(() => {
    setCurrentBet(null);
  }, []);

  return {
    placeBet,
    fetchBetForRound,
    clearCurrentBet,
    currentBet,
    isPlacingBet,
  };
}
