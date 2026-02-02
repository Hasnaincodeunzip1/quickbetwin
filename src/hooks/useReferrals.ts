import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Referral {
  id: string;
  referred_user_id: string;
  bonus: number;
  created_at: string;
  referred_name?: string;
  referred_deposited: boolean;
  bonus_claimed: boolean;
}

interface LotteryTicket {
  id: string;
  ticket_number: string;
  earned_at_referral_count: number;
  is_used: boolean;
  created_at: string;
}

export function useReferrals() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [lotteryTickets, setLotteryTickets] = useState<LotteryTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setReferrals([]);
      setLotteryTickets([]);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      
      // Fetch referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (referralsError) {
        console.error('Error fetching referrals:', referralsError);
      } else {
        // For each referral, try to get the referred user's name from profiles
        const referralsWithNames = await Promise.all(
          (referralsData || []).map(async (ref) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', ref.referred_user_id)
              .maybeSingle();
            
            return {
              ...ref,
              referred_name: profile?.name || 'User'
            };
          })
        );
        setReferrals(referralsWithNames);
      }

      // Fetch lottery tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('lottery_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ticketsError) {
        console.error('Error fetching lottery tickets:', ticketsError);
      } else {
        setLotteryTickets(ticketsData || []);
      }

      setIsLoading(false);
    };

    fetchData();

    // Subscribe to realtime updates
    const referralsChannel = supabase
      .channel('referrals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referrals',
          filter: `referrer_id=eq.${user.id}`
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    const ticketsChannel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lottery_tickets',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(referralsChannel);
      supabase.removeChannel(ticketsChannel);
    };
  }, [user]);

  const totalReferrals = referrals.length;
  const qualifiedReferrals = referrals.filter(r => r.referred_deposited).length;
  const totalEarned = referrals.filter(r => r.bonus_claimed).reduce((sum, r) => sum + Number(r.bonus), 0);

  return {
    referrals,
    lotteryTickets,
    totalReferrals,
    qualifiedReferrals,
    totalEarned,
    isLoading
  };
}
