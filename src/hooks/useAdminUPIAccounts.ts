import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UPIAccount {
  id: string;
  upi_id: string;
  holder_name: string;
  qr_code_url: string | null;
  total_transactions: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUPIAccountData {
  upi_id: string;
  holder_name: string;
  qr_code_url?: string;
}

export function useAdminUPIAccounts() {
  const [upiAccounts, setUPIAccounts] = useState<UPIAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUPIAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_upi_accounts')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching UPI accounts:', error);
        return;
      }

      setUPIAccounts(data || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createUPIAccount = async (accountData: CreateUPIAccountData) => {
    try {
      const { error } = await supabase
        .from('admin_upi_accounts')
        .insert(accountData);

      if (error) throw error;

      toast.success('UPI account added successfully');
      await fetchUPIAccounts();
      return true;
    } catch (error) {
      console.error('Error creating UPI account:', error);
      toast.error('Failed to add UPI account');
      return false;
    }
  };

  const updateUPIAccount = async (id: string, updates: Partial<UPIAccount>) => {
    try {
      const { error } = await supabase
        .from('admin_upi_accounts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('UPI account updated successfully');
      await fetchUPIAccounts();
      return true;
    } catch (error) {
      console.error('Error updating UPI account:', error);
      toast.error('Failed to update UPI account');
      return false;
    }
  };

  const deleteUPIAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_upi_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('UPI account deleted successfully');
      await fetchUPIAccounts();
      return true;
    } catch (error) {
      console.error('Error deleting UPI account:', error);
      toast.error('Failed to delete UPI account');
      return false;
    }
  };

  const toggleAccountStatus = async (id: string, isActive: boolean) => {
    return updateUPIAccount(id, { is_active: isActive });
  };

  // Get UPI account with least transactions (for deposits)
  const getUPIForDeposit = (): UPIAccount | null => {
    const activeAccounts = upiAccounts.filter(acc => acc.is_active);
    if (activeAccounts.length === 0) return null;
    
    return activeAccounts.reduce((min, acc) => 
      acc.total_transactions < min.total_transactions ? acc : min
    );
  };

  useEffect(() => {
    fetchUPIAccounts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('admin-upi-accounts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_upi_accounts'
        },
        () => {
          fetchUPIAccounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUPIAccounts]);

  return {
    upiAccounts,
    isLoading,
    createUPIAccount,
    updateUPIAccount,
    deleteUPIAccount,
    toggleAccountStatus,
    getUPIForDeposit,
    refetch: fetchUPIAccounts,
  };
}
