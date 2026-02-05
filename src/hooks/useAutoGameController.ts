import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const POLL_INTERVAL = 60000;

export function useAutoGameController() {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredRef = useRef(false);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    // Check if auto controller is enabled
    const checkEnabled = async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'auto_game_controller')
          .single();
        
        const enabled = (data?.value as { enabled?: boolean })?.enabled ?? true;
        setIsEnabled(enabled);
      } catch {
        // Default to enabled
      }
    };
    
    checkEnabled();
    
    // Subscribe to settings changes
    const channel = supabase
      .channel('auto-controller-setting')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_settings',
          filter: 'key=eq.auto_game_controller'
        },
        (payload) => {
          const newValue = (payload.new as { value?: { enabled?: boolean } })?.value;
          setIsEnabled(newValue?.enabled ?? true);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    // Only run when user is authenticated AND auto mode is enabled
    if (!user || !isEnabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const triggerController = async () => {
      try {
        await supabase.functions.invoke('auto-game-controller', {
          method: 'POST',
        });
      } catch {
        // Silently fail
      }
    };

    // Defer first trigger by 3 seconds to not block initial render
    const initialDelay = setTimeout(() => {
      if (!hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        triggerController();
      }
    }, 3000);

    intervalRef.current = setInterval(triggerController, POLL_INTERVAL);

    return () => {
      clearTimeout(initialDelay);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, isEnabled]);
}
