import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const POLL_INTERVAL = 30000; // 30 seconds

export function useAutoGameController() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const triggerController = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('auto-game-controller', {
          method: 'POST',
        });
        
        if (error) {
          console.error('Auto game controller error:', error);
        } else {
          console.log('Auto game controller result:', data);
        }
      } catch (err) {
        console.error('Failed to invoke auto game controller:', err);
      }
    };

    // Trigger immediately on mount
    triggerController();

    // Then poll every 30 seconds
    intervalRef.current = setInterval(triggerController, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}
