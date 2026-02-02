import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserBet {
  id: string;
  user_id: string;
  round_id: string;
  bet_choice: string;
  amount: number;
  won: boolean | null;
  payout: number | null;
  created_at: string;
  game_type?: string;
  result?: string;
}

export function useUserBets() {
  const [bets, setBets] = useState<UserBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchBets = useCallback(async () => {
    if (!user) {
      setBets([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch user's bets with game round info - limit to recent 20 for performance
      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (betsError) {
        console.error('Error fetching bets:', betsError);
        return;
      }

      // Fetch game rounds for these bets to get game_type and result
      if (betsData && betsData.length > 0) {
        const roundIds = [...new Set(betsData.map(b => b.round_id))];
        const { data: roundsData } = await supabase
          .from('game_rounds')
          .select('id, game_type, result')
          .in('id', roundIds);

        const roundsMap = new Map(roundsData?.map(r => [r.id, r]) || []);

        const enrichedBets = betsData.map(bet => ({
          ...bet,
          game_type: roundsMap.get(bet.round_id)?.game_type,
          result: roundsMap.get(bet.round_id)?.result,
        }));

        setBets(enrichedBets);
      } else {
        setBets([]);
      }
    } catch (error) {
      console.error('Error fetching bets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBets();

    if (!user) return;

    // Subscribe to bet updates
    const channel = supabase
      .channel(`user-bets-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bets',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchBets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchBets]);

  // Calculate stats
  const stats = {
    totalBets: bets.length,
    wins: bets.filter(b => b.won === true).length,
    losses: bets.filter(b => b.won === false).length,
    pending: bets.filter(b => b.won === null).length,
    totalWagered: bets.reduce((sum, b) => sum + Number(b.amount), 0),
    totalWon: bets.filter(b => b.won).reduce((sum, b) => sum + Number(b.payout || 0), 0),
    netProfit: bets.reduce((sum, b) => {
      if (b.won === true) return sum + (Number(b.payout || 0) - Number(b.amount));
      if (b.won === false) return sum - Number(b.amount);
      return sum;
    }, 0),
  };

  return {
    bets,
    stats,
    isLoading,
    refetch: fetchBets,
  };
}
