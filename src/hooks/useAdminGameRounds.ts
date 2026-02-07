import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type GameType = 'color' | 'parity' | 'bigsmall' | 'dice' | 'number' | 'spin';
export type DurationMinutes = 1 | 3 | 5;

interface GameRound {
  id: string;
  game_type: string;
  round_number: number;
  status: string;
  result: string | null;
  start_time: string;
  end_time: string;
  duration: number;
  total_bets: number | null;
  total_amount: number | null;
  created_at: string;
}

interface BetStats {
  bet_choice: string;
  count: number;
  amount: number;
}

interface UseAdminGameRoundsOptions {
  gameType: GameType;
  durationMinutes: DurationMinutes;
}

export function useAdminGameRounds({ gameType, durationMinutes }: UseAdminGameRoundsOptions) {
  const [activeRound, setActiveRound] = useState<GameRound | null>(null);
  const [recentRounds, setRecentRounds] = useState<GameRound[]>([]);
  const [betStats, setBetStats] = useState<BetStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchActiveRound = useCallback(async () => {
    const { data, error } = await supabase
      .from('game_rounds')
      .select('*')
      .eq('game_type', gameType)
      .eq('duration', durationMinutes)
      .in('status', ['betting', 'locked'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching active round:', error);
      return;
    }

    setActiveRound(data);

    // Fetch bet stats for this round
    if (data) {
      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('bet_choice, amount')
        .eq('round_id', data.id);

      if (!betsError && bets) {
        // Aggregate bets by choice
        const statsMap: Record<string, { count: number; amount: number }> = {};
        bets.forEach((bet) => {
          if (!statsMap[bet.bet_choice]) {
            statsMap[bet.bet_choice] = { count: 0, amount: 0 };
          }
          statsMap[bet.bet_choice].count++;
          statsMap[bet.bet_choice].amount += Number(bet.amount);
        });

        const stats = Object.entries(statsMap).map(([choice, data]) => ({
          bet_choice: choice,
          count: data.count,
          amount: data.amount,
        }));
        setBetStats(stats);
      }
    } else {
      setBetStats([]);
    }
  }, [gameType, durationMinutes]);

  const fetchRecentRounds = useCallback(async () => {
    const { data, error } = await supabase
      .from('game_rounds')
      .select('*')
      .eq('game_type', gameType)
      .eq('duration', durationMinutes)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching recent rounds:', error);
      return;
    }

    setRecentRounds(data || []);
  }, [gameType, durationMinutes]);

  const createRound = async () => {
    setIsCreating(true);
    try {
      // Get the next round number for this game type (shared across durations)
      const { data: lastRound } = await supabase
        .from('game_rounds')
        .select('round_number')
        .eq('game_type', gameType)
        .order('round_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextRoundNumber = (lastRound?.round_number || 0) + 1;
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

      const { data, error } = await supabase
        .from('game_rounds')
        .insert({
          game_type: gameType,
          round_number: nextRoundNumber,
          duration: durationMinutes,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'betting',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating round:', error);
        toast.error('Failed to create round');
        return null;
      }

      toast.success(`Round #${nextRoundNumber} created (${durationMinutes} min)`);
      await fetchActiveRound();
      await fetchRecentRounds();
      return data;
    } finally {
      setIsCreating(false);
    }
  };

  const lockRound = async () => {
    if (!activeRound) return;

    const { error } = await supabase
      .from('game_rounds')
      .update({ status: 'locked' })
      .eq('id', activeRound.id);

    if (error) {
      console.error('Error locking round:', error);
      toast.error('Failed to lock round');
      return;
    }

    toast.success('Betting locked!');
    await fetchActiveRound();
  };

  const setResult = async (result: string) => {
    if (!activeRound) return;

    // Calculate total bets and amount
    const totalBets = betStats.reduce((sum, s) => sum + s.count, 0);
    const totalAmount = betStats.reduce((sum, s) => sum + s.amount, 0);

    const { error } = await supabase
      .from('game_rounds')
      .update({ 
        status: 'completed', 
        result,
        total_bets: totalBets,
        total_amount: totalAmount
      })
      .eq('id', activeRound.id);

    if (error) {
      console.error('Error setting result:', error);
      toast.error('Failed to set result');
      return;
    }

    // Process winning bets
    await processWinningBets(activeRound.id, result, gameType);

    toast.success(`Result set: ${result.toUpperCase()}`);
    setActiveRound(null);
    setBetStats([]);
    await fetchRecentRounds();
  };

  const cancelRound = async () => {
    if (!activeRound) return;

    // Refund all bets
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select('user_id, amount')
      .eq('round_id', activeRound.id);

    if (!betsError && bets) {
      for (const bet of bets) {
        // Refund to wallet
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', bet.user_id)
          .single();

        if (wallet) {
          await supabase
            .from('wallets')
            .update({ balance: Number(wallet.balance) + Number(bet.amount) })
            .eq('user_id', bet.user_id);
        }
      }
    }

    const { error } = await supabase
      .from('game_rounds')
      .update({ status: 'cancelled' })
      .eq('id', activeRound.id);

    if (error) {
      console.error('Error cancelling round:', error);
      toast.error('Failed to cancel round');
      return;
    }

    toast.success('Round cancelled, bets refunded');
    setActiveRound(null);
    setBetStats([]);
    await fetchRecentRounds();
  };

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchActiveRound(), fetchRecentRounds()]).finally(() => {
      setIsLoading(false);
    });

    // Subscribe to realtime updates
    const roundsChannel = supabase
      .channel(`admin-rounds-${gameType}-${durationMinutes}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_rounds',
          filter: `game_type=eq.${gameType}`
        },
        (payload) => {
          const round = payload.new as GameRound;
          // Only refresh if duration matches
          if (round && round.duration === durationMinutes) {
            fetchActiveRound();
            fetchRecentRounds();
          }
        }
      )
      .subscribe();

    const betsChannel = supabase
      .channel(`admin-bets-${gameType}-${durationMinutes}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bets'
        },
        () => {
          fetchActiveRound();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roundsChannel);
      supabase.removeChannel(betsChannel);
    };
  }, [gameType, durationMinutes, fetchActiveRound, fetchRecentRounds]);

  return {
    activeRound,
    recentRounds,
    betStats,
    isLoading,
    isCreating,
    createRound,
    lockRound,
    setResult,
    cancelRound,
    refreshData: () => Promise.all([fetchActiveRound(), fetchRecentRounds()])
  };
}

// Helper function to calculate payouts and update bets
async function processWinningBets(roundId: string, result: string, gameType: GameType) {
  const { data: bets, error } = await supabase
    .from('bets')
    .select('*')
    .eq('round_id', roundId);

  if (error || !bets) return;

  for (const bet of bets) {
    const won = checkWin(bet.bet_choice, result, gameType);
    const payout = won ? calculatePayout(bet.amount, bet.bet_choice, gameType) : 0;

    // Update bet record
    await supabase
      .from('bets')
      .update({ won, payout })
      .eq('id', bet.id);

    // If won, add payout to wallet
    if (won && payout > 0) {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', bet.user_id)
        .single();

      if (wallet) {
        await supabase
          .from('wallets')
          .update({ balance: Number(wallet.balance) + payout })
          .eq('user_id', bet.user_id);
      }
    }
  }
}

function checkWin(betChoice: string, result: string, gameType: GameType): boolean {
  switch (gameType) {
    case 'color':
      return betChoice === result;
    case 'parity':
      return betChoice === result;
    case 'bigsmall':
      return betChoice === result;
    case 'dice':
      return betChoice === result;
    case 'number':
      return betChoice === result;
    case 'spin':
      return betChoice === result;
    default:
      return betChoice === result;
  }
}

function calculatePayout(amount: number, betChoice: string, gameType: GameType): number {
  const baseAmount = Number(amount);
  
  switch (gameType) {
    case 'color':
      if (betChoice === 'violet') return baseAmount * 4.5;
      return baseAmount * 2;
    case 'parity':
      return baseAmount * 2;
    case 'bigsmall':
      return baseAmount * 2;
    case 'dice':
      if (['1', '2', '3', '4', '5', '6'].includes(betChoice)) return baseAmount * 6;
      return baseAmount * 2;
    case 'number':
      return baseAmount * 9;
    case 'spin':
      return baseAmount * 2;
    default:
      return baseAmount * 2;
  }
}
