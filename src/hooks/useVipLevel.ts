import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export type VipLevel = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface VipTier {
  level: VipLevel;
  name: string;
  basePrice: number;
  taxRate: number;
  totalPrice: number;
  referralBonus: number;
  color: string;
  icon: string;
}

export const VIP_TIERS: VipTier[] = [
  { level: 'bronze', name: 'Bronze', basePrice: 50, taxRate: 0.10, totalPrice: 55, referralBonus: 50, color: 'from-amber-600 to-amber-800', icon: '🥉' },
  { level: 'silver', name: 'Silver', basePrice: 100, taxRate: 0.10, totalPrice: 110, referralBonus: 100, color: 'from-gray-300 to-gray-500', icon: '🥈' },
  { level: 'gold', name: 'Gold', basePrice: 200, taxRate: 0.10, totalPrice: 220, referralBonus: 200, color: 'from-yellow-400 to-yellow-600', icon: '🥇' },
  { level: 'platinum', name: 'Platinum', basePrice: 500, taxRate: 0.10, totalPrice: 550, referralBonus: 500, color: 'from-cyan-300 to-cyan-600', icon: '💎' },
  { level: 'diamond', name: 'Diamond', basePrice: 1000, taxRate: 0.10, totalPrice: 1100, referralBonus: 1000, color: 'from-purple-400 to-purple-700', icon: '👑' },
];

export const getVipTier = (level: VipLevel): VipTier | undefined => {
  return VIP_TIERS.find(t => t.level === level);
};

export const getVipLevelIndex = (level: VipLevel): number => {
  const levels: VipLevel[] = ['none', 'bronze', 'silver', 'gold', 'platinum', 'diamond'];
  return levels.indexOf(level);
};

export function useVipLevel() {
  const { user, profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const currentLevel = (profile?.vip_level as VipLevel) || 'none';
  const currentTier = getVipTier(currentLevel);

  const purchaseVip = async (tier: VipTier): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to purchase VIP",
        variant: "destructive"
      });
      return false;
    }

    setIsPurchasing(true);
    
    try {
      // Check wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (walletError) throw walletError;
      
      const balance = Number(wallet.balance);
      if (balance < tier.totalPrice) {
        toast({
          title: "Insufficient Balance",
          description: `You need ₹${tier.totalPrice} to purchase ${tier.name} VIP. Current balance: ₹${balance}`,
          variant: "destructive"
        });
        return false;
      }

      // Create VIP purchase record
      const { error: purchaseError } = await supabase
        .from('vip_purchases')
        .insert({
          user_id: user.id,
          vip_level: tier.level,
          base_price: tier.basePrice,
          tax_amount: tier.basePrice * tier.taxRate,
          total_paid: tier.totalPrice
        });

      if (purchaseError) throw purchaseError;

      // Update profile VIP level
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ vip_level: tier.level })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Deduct from wallet
      const { error: deductError } = await supabase
        .from('wallets')
        .update({ balance: balance - tier.totalPrice })
        .eq('user_id', user.id);

      if (deductError) throw deductError;

      // Refresh profile to get updated VIP level
      await refreshProfile?.();

      toast({
        title: "🎉 VIP Activated!",
        description: `Welcome to ${tier.name} VIP! You now get ₹${tier.referralBonus} per successful referral.`,
      });

      return true;
    } catch (error: any) {
      console.error('VIP purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to purchase VIP. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsPurchasing(false);
    }
  };

  const canUpgradeTo = (targetLevel: VipLevel): boolean => {
    return getVipLevelIndex(targetLevel) > getVipLevelIndex(currentLevel);
  };

  return {
    currentLevel,
    currentTier,
    isLoading,
    isPurchasing,
    purchaseVip,
    canUpgradeTo,
    VIP_TIERS
  };
}
