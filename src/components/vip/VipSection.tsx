import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Lock, Check, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VipTier, VipLevel, useVipLevel, getVipLevelIndex, VIP_TIERS } from '@/hooks/useVipLevel';
import { VipPurchaseModal } from './VipPurchaseModal';
import { formatCurrency } from '@/lib/formatters';

export function VipSection() {
  const { currentLevel, currentTier, canUpgradeTo } = useVipLevel();
  const [selectedTier, setSelectedTier] = useState<VipTier | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const handleSelectTier = (tier: VipTier) => {
    if (canUpgradeTo(tier.level)) {
      setSelectedTier(tier);
      setShowPurchaseModal(true);
    }
  };

  return (
    <>
      <Card className="game-card overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-purple-500/5 pointer-events-none z-0" />
        <CardHeader className="relative z-10 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-500" />
            VIP Membership
            {currentLevel !== 'none' && currentTier && (
              <Badge className={`ml-auto bg-gradient-to-r ${currentTier.color} text-white border-0`}>
                {currentTier.icon} {currentTier.name}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 space-y-4">
          {currentLevel === 'none' && (
            <div className="text-center py-2 px-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                ⚠️ You need VIP to earn referral rewards!
              </p>
            </div>
          )}

          <div className="grid gap-3">
            {VIP_TIERS.map((tier, index) => {
              const isOwned = getVipLevelIndex(tier.level) <= getVipLevelIndex(currentLevel) && currentLevel !== 'none';
              const isCurrent = tier.level === currentLevel;
              const canBuy = canUpgradeTo(tier.level);
              
              return (
                <motion.div
                  key={tier.level}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleSelectTier(tier)}
                  className={`relative p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    isCurrent 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/30' 
                      : isOwned 
                        ? 'border-muted bg-muted/20 opacity-60'
                        : canBuy
                          ? 'border-border hover:border-primary/50 hover:bg-secondary/50'
                          : 'border-border opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center text-2xl`}>
                      {tier.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold">{tier.name}</h4>
                        {isCurrent && (
                          <Badge variant="outline" className="text-xs border-primary text-primary">
                            Current
                          </Badge>
                        )}
                        {isOwned && !isCurrent && (
                          <Badge variant="outline" className="text-xs">
                            <Check className="w-3 h-3 mr-1" /> Owned
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(tier.referralBonus)} per referral • {formatCurrency(tier.totalPrice)} (incl. tax)
                      </p>
                    </div>
                    <div className="text-right">
                      {canBuy ? (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      ) : isOwned ? (
                        <Check className="w-5 h-5 text-game-green" />
                      ) : (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <VipPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        selectedTier={selectedTier}
        onPurchaseSuccess={() => {
          setShowPurchaseModal(false);
        }}
      />
    </>
  );
}
