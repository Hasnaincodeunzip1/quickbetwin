import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Transaction, mockTransactions, formatCurrency } from '@/lib/mockData';
import { toast } from '@/hooks/use-toast';

interface WalletContextType {
  balance: number;
  transactions: Transaction[];
  deposit: (amount: number) => Promise<boolean>;
  withdraw: (amount: number, bankDetails: string) => Promise<boolean>;
  placeBet: (amount: number) => boolean;
  addWinnings: (amount: number) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(2500);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);

  const deposit = async (amount: number): Promise<boolean> => {
    // Mock deposit - in real app, this would integrate with Razorpay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setBalance(prev => prev + amount);
    
    const newTransaction: Transaction = {
      id: `t_${Date.now()}`,
      userId: 'user_1',
      type: 'deposit',
      amount,
      status: 'completed',
      createdAt: new Date().toISOString(),
      reference: `Razorpay #RP${Date.now()}`,
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    
    toast({
      title: "Deposit Successful!",
      description: `${formatCurrency(amount)} has been added to your wallet.`,
    });
    
    return true;
  };

  const withdraw = async (amount: number, bankDetails: string): Promise<boolean> => {
    if (amount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this withdrawal.",
        variant: "destructive",
      });
      return false;
    }
    
    // Mock withdrawal request
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newTransaction: Transaction = {
      id: `t_${Date.now()}`,
      userId: 'user_1',
      type: 'withdrawal',
      amount: -amount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      reference: `Bank: ${bankDetails}`,
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    
    toast({
      title: "Withdrawal Requested",
      description: `${formatCurrency(amount)} withdrawal is pending approval.`,
    });
    
    return true;
  };

  const placeBet = (amount: number): boolean => {
    if (amount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this bet.",
        variant: "destructive",
      });
      return false;
    }
    
    setBalance(prev => prev - amount);
    return true;
  };

  const addWinnings = (amount: number) => {
    setBalance(prev => prev + amount);
    
    const newTransaction: Transaction = {
      id: `t_${Date.now()}`,
      userId: 'user_1',
      type: 'win',
      amount,
      status: 'completed',
      createdAt: new Date().toISOString(),
      reference: `Game Winnings`,
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
  };

  return (
    <WalletContext.Provider
      value={{
        balance,
        transactions,
        deposit,
        withdraw,
        placeBet,
        addWinnings,
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
