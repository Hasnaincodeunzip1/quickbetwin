import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { user } = useAuth();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRoundIdRef = useRef<string | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

      if (activeRound) {
        // Only update if round actually changed
        if (lastRoundIdRef.current !== activeRound.id) {
          lastRoundIdRef.current = activeRound.id;
          setIsTransitioning(false);
          setCurrentRound(activeRound as GameRound);
        } else {
          // Same round, just update status if needed
          setCurrentRound(prev => {
            if (!prev) return activeRound as GameRound;
            if (prev.status !== activeRound.status) {
              return activeRound as GameRound;
            }
            return prev;
          });
        }
      } else {
        // No active round - only set to null if we had a round before
        if (currentRound) {
          setIsTransitioning(true);
        }
      }
    } catch (error) {
      console.error('Error fetching current round:', error);
    }
  }, [gameType, durationMinutes, currentRound]);

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

  // Timer countdown - optimized to reduce re-renders
  useEffect(() => {
    if (!currentRound || currentRound.status === 'completed') {
      setTimeLeft(0);
      return;
    }

    const updateTime = () => {
      const endTime = new Date(currentRound.end_time).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      
      setTimeLeft(prev => {
        // Only update if value actually changed
        if (prev !== remaining) return remaining;
        return prev;
      });

      // When timer hits 0, set transitioning and fetch new round
      if (remaining === 0) {
        setIsTransitioning(true);
        // Delay setting currentRound to null to prevent flicker
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current);
        }
        transitionTimeoutRef.current = setTimeout(() => {
          fetchCurrentRound();
          fetchRecentResults();
        }, 500);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => {
      clearInterval(interval);
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [currentRound?.id, currentRound?.end_time, currentRound?.status, fetchCurrentRound, fetchRecentResults]);

  // Polling when transitioning (waiting for new round)
  useEffect(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // Poll when transitioning or no current round
    if ((isTransitioning || !currentRound) && !isLoading) {
      pollIntervalRef.current = setInterval(() => {
        fetchCurrentRound();
      }, 1500);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isTransitioning, currentRound, isLoading, fetchCurrentRound]);

  // Subscribe to real-time updates
  useEffect(() => {
    setIsLoading(true);
    lastRoundIdRef.current = null;
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
            if (round.duration === durationMinutes) {
              if (round.status === 'betting' || round.status === 'locked') {
                if (lastRoundIdRef.current !== round.id) {
                  lastRoundIdRef.current = round.id;
                  setIsTransitioning(false);
                }
                setCurrentRound(round);
              } else if (round.status === 'completed') {
                setIsTransitioning(true);
                fetchRecentResults();
                // Small delay before looking for new round
                setTimeout(() => fetchCurrentRound(), 300);
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

  // Memoized return values
  const isBettingOpen = useMemo(() => currentRound?.status === 'betting', [currentRound?.status]);
  const isLocked = useMemo(() => currentRound?.status === 'locked', [currentRound?.status]);

  return {
    currentRound,
    recentResults,
    isLoading,
    timeLeft,
    isTransitioning,
    isBettingOpen,
    isLocked,
    refetch: fetchCurrentRound,
  };
}
