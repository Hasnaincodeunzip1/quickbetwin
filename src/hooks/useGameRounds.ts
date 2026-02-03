import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const [timeLeft, setTimeLeft] = useState(0);
  const { user } = useAuth();

  // Fetch current active or locked round for specific duration
  const fetchCurrentRound = useCallback(async () => {
    try {
      // Get active round for this game type AND duration
      const { data: activeRound } = await supabase
        .from('game_rounds')
        .select('*')
        .eq('game_type', gameType)
        .eq('duration', durationMinutes)
        .in('status', ['betting', 'locked'])
        .order('round_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeRound) {
        setCurrentRound(activeRound as GameRound);
      } else {
        setCurrentRound(null);
      }
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

  // Timer countdown for current round
  useEffect(() => {
    if (!currentRound || currentRound.status === 'completed') {
      setTimeLeft(0);
      return;
    }

    const updateTime = () => {
      const endTime = new Date(currentRound.end_time).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [currentRound]);

  // Subscribe to real-time updates for specific duration
  useEffect(() => {
    setIsLoading(true);
    fetchCurrentRound();
    fetchRecentResults();

    const channel = supabase
      .channel(`game_rounds_${gameType}_${durationMinutes}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_rounds',
          filter: `game_type=eq.${gameType}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const round = payload.new as GameRound;
            // Only update if duration matches
            if (round.duration === durationMinutes) {
              if (round.status === 'betting' || round.status === 'locked') {
                setCurrentRound(round);
              } else if (round.status === 'completed') {
                setCurrentRound(null);
                fetchRecentResults();
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameType, durationMinutes, fetchCurrentRound, fetchRecentResults]);

  return {
    currentRound,
    recentResults,
    isLoading,
    timeLeft,
    isBettingOpen: currentRound?.status === 'betting',
    isLocked: currentRound?.status === 'locked',
    refetch: fetchCurrentRound,
  };
}
