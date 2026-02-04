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

  // Fetch recent completed rounds for specific duration
  const fetchRecentResults = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('game_rounds')
        .select('*')
        .eq('game_type', gameType)
        .eq('duration', durationMinutes)
        .eq('status', 'completed')
        .not('result', 'is', null)
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
  }, [gameType, durationMinutes, fetchCurrentRound, fetchRecentResults]);

  // Memoized return values
  const isBettingOpen = useMemo(() => currentRound?.status === 'betting', [currentRound?.status]);
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
