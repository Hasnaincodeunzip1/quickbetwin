import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type GameType = 'color' | 'parity' | 'bigsmall' | 'dice' | 'number' | 'spin';
export type RoundStatus = 'betting' | 'locked' | 'completed';

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
  durationMinutes: number;
}

export function useGameRounds({ gameType, durationMinutes }: UseGameRoundsOptions) {
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  const [recentResults, setRecentResults] = useState<GameRound[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Fetch or create current round
  const fetchCurrentRound = useCallback(async () => {
    try {
      // Get active round for this game type
      const now = new Date().toISOString();
      const { data: activeRound } = await supabase
        .from('game_rounds')
        .select('*')
        .eq('game_type', gameType)
        .eq('status', 'betting')
        .gte('end_time', now)
        .order('round_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeRound) {
        setCurrentRound(activeRound as GameRound);
      } else {
        // No active round found - round will be created by admin
        setCurrentRound(null);
      }
    } catch (error) {
      console.error('Error fetching current round:', error);
    }
  }, [gameType]);

  // Fetch recent completed rounds
  const fetchRecentResults = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('game_rounds')
        .select('*')
        .eq('game_type', gameType)
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
  }, [gameType]);

  // Subscribe to real-time updates
  useEffect(() => {
    fetchCurrentRound();
    fetchRecentResults();

    const channel = supabase
      .channel(`game_rounds_${gameType}`)
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
            if (round.status === 'betting') {
              setCurrentRound(round);
            } else if (round.status === 'completed') {
              setCurrentRound(null);
              fetchRecentResults();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameType, fetchCurrentRound, fetchRecentResults]);

  return {
    currentRound,
    recentResults,
    isLoading,
    refetch: fetchCurrentRound,
  };
}
