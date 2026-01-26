import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TransactionWithUser {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  reference: string | null;
  bank_details: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export function useAdminTransactions() {
  const [transactions, setTransactions] = useState<TransactionWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingCount: 0,
    pendingAmount: 0,
    processedToday: 0,
  });

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .in('type', ['withdrawal', 'deposit'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching transactions:', error);
        return;
      }

      // Fetch user profiles for each transaction
      const transactionsWithUsers = await Promise.all(
        (data || []).map(async (tx) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', tx.user_id)
            .maybeSingle();

          return {
            ...tx,
            user_name: profile?.name || 'Unknown User',
          };
        })
      );

      setTransactions(transactionsWithUsers);

      // Calculate stats
      const pending = transactionsWithUsers.filter(t => t.status === 'pending');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const processedToday = transactionsWithUsers.filter(t => 
        t.status === 'completed' && 
        new Date(t.created_at) >= today
      ).length;

      setStats({
        pendingCount: pending.length,
        pendingAmount: pending.reduce((sum, t) => sum + Number(t.amount), 0),
        processedToday,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const approveTransaction = async (transactionId: string) => {
    const tx = transactions.find(t => t.id === transactionId);
    if (!tx) return false;

    try {
      // Update transaction status
      const { error: txError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transactionId);

      if (txError) throw txError;

      // For deposits, add to wallet balance
      if (tx.type === 'deposit') {
        const { data: wallet, error: walletError } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', tx.user_id)
          .single();

        if (walletError) throw walletError;

        const { error: updateError } = await supabase
          .from('wallets')
          .update({ balance: Number(wallet.balance) + Number(tx.amount) })
          .eq('user_id', tx.user_id);

        if (updateError) throw updateError;
      }
      // For withdrawals, balance was already deducted when request was made
      // (or you can deduct here if you prefer)

      toast.success(`${tx.type === 'deposit' ? 'Deposit' : 'Withdrawal'} approved`);
      await fetchTransactions();
      return true;
    } catch (error) {
      console.error('Error approving transaction:', error);
      toast.error('Failed to approve transaction');
      return false;
    }
  };

  const rejectTransaction = async (transactionId: string, reason?: string) => {
    const tx = transactions.find(t => t.id === transactionId);
    if (!tx) return false;

    try {
      // Update transaction status
      const { error: txError } = await supabase
        .from('transactions')
        .update({ status: 'rejected' })
        .eq('id', transactionId);

      if (txError) throw txError;

      // For rejected withdrawals, refund the amount back to wallet
      if (tx.type === 'withdrawal') {
        const { data: wallet, error: walletError } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', tx.user_id)
          .single();

        if (walletError) throw walletError;

        const { error: updateError } = await supabase
          .from('wallets')
          .update({ balance: Number(wallet.balance) + Number(tx.amount) })
          .eq('user_id', tx.user_id);

        if (updateError) throw updateError;
      }

      toast.success('Transaction rejected');
      await fetchTransactions();
      return true;
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      toast.error('Failed to reject transaction');
      return false;
    }
  };

  useEffect(() => {
    fetchTransactions();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('admin-transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTransactions]);

  return {
    transactions,
    isLoading,
    stats,
    approveTransaction,
    rejectTransaction,
    refetch: fetchTransactions,
  };
}
