import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  reference: string | null;
  bank_details: string | null;
  assigned_bank_account_id: string | null;
  assigned_upi_account_id: string | null;
}

interface BankAccountForDeposit {
  id: string;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string | null;
}

interface UPIAccountForDeposit {
  id: string;
  upi_id: string;
  holder_name: string;
  qr_code_url: string | null;
}

interface WalletContextType {
  balance: number;
  transactions: Transaction[];
  isLoading: boolean;
  depositBankAccount: BankAccountForDeposit | null;
  depositUPIAccount: UPIAccountForDeposit | null;
  deposit: (amount: number, method: 'bank' | 'upi') => Promise<boolean>;
  withdraw: (amount: number, bankDetails: string) => Promise<boolean>;
  refetchBalance: () => Promise<void>;
  refetchTransactions: () => Promise<void>;
  refetchDepositAccount: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [depositBankAccount, setDepositBankAccount] = useState<BankAccountForDeposit | null>(null);
  const [depositUPIAccount, setDepositUPIAccount] = useState<UPIAccountForDeposit | null>(null);
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

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching transactions:', error);
        return;
      }

      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, [user]);

  // Fetch deposit accounts via edge function (bypasses RLS for admin accounts)
  const fetchDepositAccount = useCallback(async () => {
    if (!user) {
      setDepositBankAccount(null);
      setDepositUPIAccount(null);
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        console.error('No auth token available');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-deposit-accounts`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('Error fetching deposit accounts:', response.statusText);
        return;
      }

      const data = await response.json();
      setDepositBankAccount(data.bankAccount);
      setDepositUPIAccount(data.upiAccount);
    } catch (error) {
      console.error('Error fetching deposit accounts:', error);
      setDepositBankAccount(null);
      setDepositUPIAccount(null);
    }
  }, [user]);

  // Subscribe to wallet and transaction changes
  useEffect(() => {
    if (!user) {
      setBalance(0);
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    fetchBalance();
    fetchTransactions();
    fetchDepositAccount();

    const walletChannel = supabase
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

    const transactionChannel = supabase
      .channel(`transactions_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletChannel);
      supabase.removeChannel(transactionChannel);
    };
  }, [user, fetchBalance, fetchTransactions, fetchDepositAccount]);

  const deposit = async (amount: number, method: 'bank' | 'upi' = 'bank'): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to make a deposit",
        variant: "destructive",
      });
      return false;
    }

    if (method === 'bank' && !depositBankAccount) {
      toast({
        title: "No Bank Account Available",
        description: "Please contact support for deposit instructions",
        variant: "destructive",
      });
      return false;
    }

    if (method === 'upi' && !depositUPIAccount) {
      toast({
        title: "No UPI Account Available",
        description: "Please contact support for deposit instructions",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Create transaction record with assigned account based on method
      const transactionData: {
        user_id: string;
        type: string;
        amount: number;
        status: string;
        reference: string;
        assigned_bank_account_id?: string;
        assigned_upi_account_id?: string;
      } = {
        user_id: user.id,
        type: 'deposit',
        amount: amount,
        status: 'pending',
        reference: `DEP${Date.now()}`,
      };

      if (method === 'bank' && depositBankAccount) {
        transactionData.assigned_bank_account_id = depositBankAccount.id;
      } else if (method === 'upi' && depositUPIAccount) {
        transactionData.assigned_upi_account_id = depositUPIAccount.id;
      }

      const { error: txError } = await supabase
        .from('transactions')
        .insert(transactionData);

      if (txError) throw txError;

      // Increment the transaction count on the respective account
      if (method === 'bank' && depositBankAccount) {
        await supabase.rpc('increment_bank_transactions', { account_id: depositBankAccount.id });
        toast({
          title: "Deposit Requested",
          description: `₹${amount} deposit is pending approval. Please transfer to ${depositBankAccount.bank_name} - ${depositBankAccount.account_number}`,
        });
      } else if (method === 'upi' && depositUPIAccount) {
        await supabase.rpc('increment_upi_transactions', { account_id: depositUPIAccount.id });
        toast({
          title: "Deposit Requested",
          description: `₹${amount} deposit is pending approval. Please transfer to UPI ID: ${depositUPIAccount.upi_id}`,
        });
      }

      // Refetch to get next deposit account
      fetchDepositAccount();
      
      return true;
    } catch (error) {
      console.error('Deposit error:', error);
      toast({
        title: "Deposit Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
      return false;
    }
  };

  const withdraw = async (amount: number, bankDetails: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to make a withdrawal",
        variant: "destructive",
      });
      return false;
    }

    if (amount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this withdrawal.",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'withdrawal',
          amount: amount,
          status: 'pending',
          bank_details: bankDetails,
          reference: `WD${Date.now()}`,
        });

      if (txError) throw txError;

      toast({
        title: "Withdrawal Requested",
        description: `₹${amount} withdrawal is pending approval.`,
      });

      return true;
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast({
        title: "Withdrawal Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
      return false;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        balance,
        transactions,
        isLoading,
        depositBankAccount,
        depositUPIAccount,
        deposit,
        withdraw,
        refetchBalance: fetchBalance,
        refetchTransactions: fetchTransactions,
        refetchDepositAccount: fetchDepositAccount,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
