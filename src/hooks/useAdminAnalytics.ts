import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, format } from "date-fns";
import { useEffect } from "react";

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  todayRevenue: number;
  pendingWithdrawals: number;
  profitMargin: number;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  payouts: number;
}

export interface BetDistribution {
  color: string;
  value: number;
  fill: string;
}

export interface UserGrowthData {
  date: string;
  users: number;
}

const GAME_TYPE_COLORS: Record<string, { color: string; fill: string }> = {
  color: { color: "Color", fill: "hsl(var(--game-red))" },
  parity: { color: "Parity", fill: "hsl(var(--game-green))" },
  bigsmall: { color: "Big/Small", fill: "hsl(var(--game-blue))" },
  dice: { color: "Dice", fill: "hsl(var(--primary))" },
  number: { color: "Number", fill: "hsl(var(--game-violet))" },
  spin: { color: "Spin", fill: "hsl(var(--secondary))" },
};

export function useAdminAnalytics() {
  const queryClient = useQueryClient();

  // Set up realtime subscriptions for instant updates
  useEffect(() => {
    const channel = supabase
      .channel('admin-analytics')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bets' },
        () => {
          // Invalidate queries when bets change
          queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
          queryClient.invalidateQueries({ queryKey: ["admin-revenue-chart"] });
          queryClient.invalidateQueries({ queryKey: ["admin-bet-distribution"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          // Invalidate stats when transactions change (for pending withdrawals)
          queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          // Invalidate queries when new users sign up
          queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
          queryClient.invalidateQueries({ queryKey: ["admin-user-growth"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async (): Promise<AdminStats> => {
      const today = startOfDay(new Date());
      const yesterday = subDays(today, 1);

      // Get total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get active users (users who placed bets in last 24 hours)
      const { data: activeBettors } = await supabase
        .from("bets")
        .select("user_id")
        .gte("created_at", yesterday.toISOString());
      
      const activeUsers = new Set(activeBettors?.map(b => b.user_id) || []).size;

      // Get total revenue (sum of all bets)
      const { data: allBets } = await supabase
        .from("bets")
        .select("amount, payout");
      
      const totalBetAmount = allBets?.reduce((sum, bet) => sum + Number(bet.amount), 0) || 0;
      const totalPayouts = allBets?.reduce((sum, bet) => sum + (Number(bet.payout) || 0), 0) || 0;
      const totalRevenue = totalBetAmount - totalPayouts;

      // Get today's revenue
      const { data: todayBets } = await supabase
        .from("bets")
        .select("amount, payout")
        .gte("created_at", today.toISOString());
      
      const todayBetAmount = todayBets?.reduce((sum, bet) => sum + Number(bet.amount), 0) || 0;
      const todayPayouts = todayBets?.reduce((sum, bet) => sum + (Number(bet.payout) || 0), 0) || 0;
      const todayRevenue = todayBetAmount - todayPayouts;

      // Get pending withdrawals
      const { data: pendingTx } = await supabase
        .from("transactions")
        .select("amount")
        .eq("type", "withdrawal")
        .eq("status", "pending");
      
      const pendingWithdrawals = pendingTx?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

      // Calculate profit margin
      const profitMargin = totalBetAmount > 0 
        ? Math.round((totalRevenue / totalBetAmount) * 100 * 10) / 10
        : 0;

      return {
        totalUsers: totalUsers || 0,
        activeUsers,
        totalRevenue: Math.max(0, totalRevenue),
        todayRevenue,
        pendingWithdrawals,
        profitMargin,
      };
    },
    staleTime: 5000, // Consider data fresh for 5 seconds
  });

  // Fetch revenue chart data (last 7 days)
  const { data: revenueChartData, isLoading: revenueLoading } = useQuery({
    queryKey: ["admin-revenue-chart"],
    queryFn: async (): Promise<RevenueChartData[]> => {
      const days: RevenueChartData[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayStart = startOfDay(date);
        const dayEnd = subDays(startOfDay(subDays(date, -1)), 0);

        const { data: dayBets } = await supabase
          .from("bets")
          .select("amount, payout")
          .gte("created_at", dayStart.toISOString())
          .lt("created_at", dayEnd.toISOString());

        const revenue = dayBets?.reduce((sum, bet) => sum + Number(bet.amount), 0) || 0;
        const payouts = dayBets?.reduce((sum, bet) => sum + (Number(bet.payout) || 0), 0) || 0;

        days.push({
          date: format(date, "MMM dd"),
          revenue,
          payouts,
        });
      }

      return days;
    },
    staleTime: 10000,
  });

  // Fetch bet distribution by game type
  const { data: betDistribution, isLoading: distributionLoading } = useQuery({
    queryKey: ["admin-bet-distribution"],
    queryFn: async (): Promise<BetDistribution[]> => {
      const { data: rounds } = await supabase
        .from("game_rounds")
        .select("id, game_type");

      if (!rounds?.length) {
        return Object.entries(GAME_TYPE_COLORS).map(([_, config]) => ({
          color: config.color,
          value: 0,
          fill: config.fill,
        }));
      }

      const roundGameTypes = new Map(rounds.map(r => [r.id, r.game_type]));

      const { data: bets } = await supabase
        .from("bets")
        .select("round_id, amount");

      const gameTypeAmounts: Record<string, number> = {};
      let totalAmount = 0;

      bets?.forEach(bet => {
        const gameType = roundGameTypes.get(bet.round_id);
        if (gameType) {
          gameTypeAmounts[gameType] = (gameTypeAmounts[gameType] || 0) + Number(bet.amount);
          totalAmount += Number(bet.amount);
        }
      });

      if (totalAmount === 0) {
        return Object.entries(GAME_TYPE_COLORS).map(([_, config]) => ({
          color: config.color,
          value: 0,
          fill: config.fill,
        }));
      }

      return Object.entries(GAME_TYPE_COLORS).map(([type, config]) => ({
        color: config.color,
        value: Math.round(((gameTypeAmounts[type] || 0) / totalAmount) * 100),
        fill: config.fill,
      }));
    },
    staleTime: 10000,
  });

  // Fetch user growth data (last 7 days)
  const { data: userGrowthData, isLoading: growthLoading } = useQuery({
    queryKey: ["admin-user-growth"],
    queryFn: async (): Promise<UserGrowthData[]> => {
      const days: UserGrowthData[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayEnd = startOfDay(subDays(date, -1));

        const { count } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .lt("created_at", dayEnd.toISOString());

        days.push({
          date: format(date, "MMM dd"),
          users: count || 0,
        });
      }

      return days;
    },
    staleTime: 30000,
  });

  return {
    stats: stats || {
      totalUsers: 0,
      activeUsers: 0,
      totalRevenue: 0,
      todayRevenue: 0,
      pendingWithdrawals: 0,
      profitMargin: 0,
    },
    revenueChartData: revenueChartData || [],
    betDistribution: betDistribution || [],
    userGrowthData: userGrowthData || [],
    isLoading: statsLoading || revenueLoading || distributionLoading || growthLoading,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
