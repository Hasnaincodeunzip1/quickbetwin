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
  assigned_bank_account_id: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
  assigned_bank_name?: string;
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

          // Get assigned bank account name if exists
          let assignedBankName = null;
          if (tx.assigned_bank_account_id) {
            const { data: bankData } = await supabase
              .from('admin_bank_accounts')
              .select('bank_name')
              .eq('id', tx.assigned_bank_account_id)
              .maybeSingle();
            assignedBankName = bankData?.bank_name;
          }

          return {
            ...tx,
            user_name: profile?.name || 'Unknown User',
            assigned_bank_name: assignedBankName,
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

      // For deposits, add to wallet balance using RPC function
      if (tx.type === 'deposit') {
        const { error: walletError } = await supabase.rpc('add_wallet_balance', {
          p_user_id: tx.user_id,
          p_amount: Number(tx.amount)
        });

        if (walletError) throw walletError;

        // Update bank account stats if assigned
        if (tx.assigned_bank_account_id) {
          await supabase.rpc('increment_bank_deposits', { 
            account_id: tx.assigned_bank_account_id, 
            deposit_amount: Number(tx.amount) 
          });
        }
      }

      // For withdrawals, we need to debit from the bank with most deposits
      if (tx.type === 'withdrawal') {
        // Get the bank account with most deposits that has sufficient balance
        const { data: bankAccounts } = await supabase
          .from('admin_bank_accounts')
          .select('id, balance, total_deposits')
          .eq('is_active', true)
          .gte('balance', Number(tx.amount))
          .order('total_deposits', { ascending: false })
          .limit(1);

        if (bankAccounts && bankAccounts.length > 0) {
          const bankAccount = bankAccounts[0];
          await supabase.rpc('decrement_bank_balance', {
            account_id: bankAccount.id,
            withdrawal_amount: Number(tx.amount)
          });

          // Update the transaction with the assigned bank account
          await supabase
            .from('transactions')
            .update({ assigned_bank_account_id: bankAccount.id })
            .eq('id', transactionId);
        }
      }

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

      // For rejected withdrawals, refund the amount back to wallet using RPC function
      if (tx.type === 'withdrawal') {
        const { error: refundError } = await supabase.rpc('refund_wallet_balance', {
          p_user_id: tx.user_id,
          p_amount: Number(tx.amount)
        });

        if (refundError) throw refundError;
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
