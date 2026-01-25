import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useWalletBalance() {
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchBalance = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching wallet:', error);
        return;
      }

      setBalance(data?.balance || 0);
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Subscribe to wallet changes
  useEffect(() => {
    if (!user) return;

    fetchBalance();

    const channel = supabase
      .channel(`wallet_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setBalance((payload.new as { balance: number }).balance);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchBalance]);

  return {
    balance,
    isLoading,
    refetchBalance: fetchBalance,
  };
}
