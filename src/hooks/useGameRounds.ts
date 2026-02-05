import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type GameType = 'color' | 'parity' | 'bigsmall' | 'dice' | 'number' | 'spin';
export type RoundStatus = 'betting' | 'locked' | 'completed';
export type DurationMinutes = 1 | 3 | 5;

export interface GameRound {
  id: string;
  game_type: GameType;
  round_number: number;
  status: RoundStatus;
  start_time: string;
  end_time: string;
  duration: number;
  result: string | null;
  total_bets: number | null;
  total_amount: number | null;
}

interface UseGameRoundsOptions {
  gameType: GameType;
  durationMinutes: DurationMinutes;
}

// Helper to get start of today in ISO format
function getTodayStart(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
}

export function useGameRounds({ gameType, durationMinutes }: UseGameRoundsOptions) {
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  const [recentResults, setRecentResults] = useState<GameRound[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current active or locked round for specific duration
  const fetchCurrentRound = useCallback(async () => {
    try {
      const { data: activeRound } = await supabase
        .from('game_rounds')
        .select('*')
        .eq('game_type', gameType)
        .eq('duration', durationMinutes)
        .in('status', ['betting', 'locked'])
        .order('round_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      setCurrentRound(activeRound as GameRound | null);
    } catch (error) {
      console.error('Error fetching current round:', error);
    }
  }, [gameType, durationMinutes]);

  // Fetch recent completed rounds for specific duration (today only)
  const fetchRecentResults = useCallback(async () => {
    try {
      const todayStart = getTodayStart();
      
      const { data } = await supabase
        .from('game_rounds')
        .select('*')
        .eq('game_type', gameType)
        .eq('duration', durationMinutes)
        .eq('status', 'completed')
        .not('result', 'is', null)
        .gte('created_at', todayStart)
        .order('round_number', { ascending: false })
        .limit(10);

      if (data) {
        setRecentResults(data as GameRound[]);
      }
    } catch (error) {
      console.error('Error fetching recent results:', error);
    } finally {
      setIsLoading(false);
    }
  }, [gameType, durationMinutes]);

  // Fetch data on mount and when gameType/duration changes
  useEffect(() => {
    setIsLoading(true);
    fetchCurrentRound();
    fetchRecentResults();

    // Subscribe to realtime updates for game rounds
    const channel = supabase
      .channel(`game-rounds-${gameType}-${durationMinutes}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_rounds',
          filter: `game_type=eq.${gameType}`,
        },
        (payload) => {
          const round = payload.new as GameRound;
          // Only process if duration matches
          if (round && round.duration === durationMinutes) {
            if (round.status === 'betting' || round.status === 'locked') {
              setCurrentRound(round);
            } else if (round.status === 'completed' && round.result) {
              // Add to recent results and clear current round
              setRecentResults((prev) => {
                const exists = prev.some((r) => r.id === round.id);
                if (exists) {
                  return prev.map((r) => (r.id === round.id ? round : r));
                }
                return [round, ...prev].slice(0, 10);
              });
              // Clear current round if it was completed
              setCurrentRound((prev) => (prev?.id === round.id ? null : prev));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameType, durationMinutes, fetchCurrentRound, fetchRecentResults]);

  // Memoized return values
  const isBettingOpen = useMemo(() => {
    if (!currentRound || currentRound.status !== 'betting') return false;
    // Also check if end_time hasn't passed
    const endTime = new Date(currentRound.end_time).getTime();
    const now = Date.now();
    return now < endTime;
  }, [currentRound]);
  
  const isLocked = useMemo(() => currentRound?.status === 'locked', [currentRound?.status]);

  return {
    currentRound,
    recentResults,
    isLoading,
    isBettingOpen,
    isLocked,
    refetch: () => {
      fetchCurrentRound();
      fetchRecentResults();
    },
  };
}
