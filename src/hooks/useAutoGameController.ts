import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const POLL_INTERVAL = 60000; // 60 seconds (reduced frequency)

export function useAutoGameController() {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    // Only run when user is authenticated
    if (!user) {
      return;
    }

    const triggerController = async () => {
      try {
        await supabase.functions.invoke('auto-game-controller', {
          method: 'POST',
        });
      } catch (err) {
        // Silently fail - don't spam console
      }
    };

    // Trigger once on first auth, then poll less frequently
    if (!hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      triggerController();
    }

    intervalRef.current = setInterval(triggerController, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user]);
}
