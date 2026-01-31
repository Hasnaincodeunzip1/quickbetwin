import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BankAccount {
  id: string;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string | null;
  balance: number;
  total_deposits: number;
  total_transactions: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBankAccountData {
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code?: string;
  balance?: number;
}

export function useAdminBankAccounts() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBankAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_bank_accounts')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching bank accounts:', error);
        return;
      }

      setBankAccounts(data || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBankAccount = async (accountData: CreateBankAccountData) => {
    try {
      const { error } = await supabase
        .from('admin_bank_accounts')
        .insert(accountData);

      if (error) throw error;

      toast.success('Bank account added successfully');
      await fetchBankAccounts();
      return true;
    } catch (error) {
      console.error('Error creating bank account:', error);
      toast.error('Failed to add bank account');
      return false;
    }
  };

  const updateBankAccount = async (id: string, updates: Partial<BankAccount>) => {
    try {
      const { error } = await supabase
        .from('admin_bank_accounts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Bank account updated successfully');
      await fetchBankAccounts();
      return true;
    } catch (error) {
      console.error('Error updating bank account:', error);
      toast.error('Failed to update bank account');
      return false;
    }
  };

  const deleteBankAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_bank_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Bank account deleted successfully');
      await fetchBankAccounts();
      return true;
    } catch (error) {
      console.error('Error deleting bank account:', error);
      toast.error('Failed to delete bank account');
      return false;
    }
  };

  const toggleAccountStatus = async (id: string, isActive: boolean) => {
    return updateBankAccount(id, { is_active: isActive });
  };

  // Get account with least transactions (for deposits)
  const getAccountForDeposit = (): BankAccount | null => {
    const activeAccounts = bankAccounts.filter(acc => acc.is_active);
    if (activeAccounts.length === 0) return null;
    
    return activeAccounts.reduce((min, acc) => 
      acc.total_transactions < min.total_transactions ? acc : min
    );
  };

  // Get account with most deposits (for withdrawals)
  const getAccountForWithdrawal = (): BankAccount | null => {
    const activeAccounts = bankAccounts.filter(acc => acc.is_active && acc.balance > 0);
    if (activeAccounts.length === 0) return null;
    
    return activeAccounts.reduce((max, acc) => 
      acc.total_deposits > max.total_deposits ? acc : max
    );
  };

  useEffect(() => {
    fetchBankAccounts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('admin-bank-accounts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_bank_accounts'
        },
        () => {
          fetchBankAccounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBankAccounts]);

  return {
    bankAccounts,
    isLoading,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    toggleAccountStatus,
    getAccountForDeposit,
    getAccountForWithdrawal,
    refetch: fetchBankAccounts,
  };
}
