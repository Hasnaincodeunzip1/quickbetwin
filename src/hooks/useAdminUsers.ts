import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdminUser {
  id: string;
  name: string | null;
  phone: string | null;
  email?: string;
  balance: number;
  referralCode: string;
  referredBy: string | null;
  createdAt: string;
  status: 'active' | 'blocked';
  totalDeposits: number;
  totalWithdrawals: number;
  totalBets: number;
}

export function useAdminUsers() {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<AdminUser[]> => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, phone, referral_code, referred_by, created_at, status");

      if (profilesError) throw profilesError;

      // Fetch wallets
      const { data: wallets } = await supabase
        .from("wallets")
        .select("user_id, balance");

      const walletMap = new Map(wallets?.map(w => [w.user_id, Number(w.balance)]) || []);

      // Fetch transactions grouped by user
      const { data: transactions } = await supabase
        .from("transactions")
        .select("user_id, type, amount, status");

      const transactionStats = new Map<string, { deposits: number; withdrawals: number }>();
      transactions?.forEach(tx => {
        if (tx.status !== 'completed') return;
        const stats = transactionStats.get(tx.user_id) || { deposits: 0, withdrawals: 0 };
        if (tx.type === 'deposit') {
          stats.deposits += Number(tx.amount);
        } else if (tx.type === 'withdrawal') {
          stats.withdrawals += Number(tx.amount);
        }
        transactionStats.set(tx.user_id, stats);
      });

      // Fetch bets grouped by user
      const { data: bets } = await supabase
        .from("bets")
        .select("user_id");

      const betCounts = new Map<string, number>();
      bets?.forEach(bet => {
        betCounts.set(bet.user_id, (betCounts.get(bet.user_id) || 0) + 1);
      });

      return profiles?.map(profile => ({
        id: profile.id,
        name: profile.name,
        phone: profile.phone,
        referralCode: profile.referral_code,
        referredBy: profile.referred_by,
        createdAt: profile.created_at,
        status: (profile.status as 'active' | 'blocked') || 'active',
        balance: walletMap.get(profile.id) || 0,
        totalDeposits: transactionStats.get(profile.id)?.deposits || 0,
        totalWithdrawals: transactionStats.get(profile.id)?.withdrawals || 0,
        totalBets: betCounts.get(profile.id) || 0,
      })) || [];
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: 'active' | 'blocked' }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ status: newStatus })
        .eq("id", userId);

      if (error) throw error;
      return { userId, newStatus };
    },
    onSuccess: ({ newStatus }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(`User ${newStatus === 'blocked' ? 'blocked' : 'unblocked'} successfully`);
    },
    onError: (error) => {
      toast.error("Failed to update user status");
      console.error(error);
    },
  });

  const toggleStatus = (userId: string, currentStatus: 'active' | 'blocked') => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    toggleStatusMutation.mutate({ userId, newStatus });
  };

  return {
    users,
    isLoading,
    toggleStatus,
    isToggling: toggleStatusMutation.isPending,
  };
}
