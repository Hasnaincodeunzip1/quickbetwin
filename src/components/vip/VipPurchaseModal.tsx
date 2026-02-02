import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Check, Loader2, Sparkles, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VipTier, useVipLevel, getVipLevelIndex } from '@/hooks/useVipLevel';
import { formatCurrency } from '@/lib/formatters';

interface VipPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTier: VipTier | null;
  onPurchaseSuccess?: () => void;
}

export const VipPurchaseModal = forwardRef<HTMLDivElement, VipPurchaseModalProps>(
  function VipPurchaseModal({ isOpen, onClose, selectedTier, onPurchaseSuccess }, ref) {
    const { purchaseVip, isPurchasing, currentLevel } = useVipLevel();

    const handlePurchase = async () => {
      if (!selectedTier) return;
      
      const success = await purchaseVip(selectedTier);
      if (success) {
        onPurchaseSuccess?.();
        onClose();
      }
    };

    if (!selectedTier) return null;

  const taxAmount = selectedTier.basePrice * selectedTier.taxRate;
  const isUpgrade = getVipLevelIndex(selectedTier.level) > getVipLevelIndex(currentLevel);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-card rounded-2xl border border-border overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className={`bg-gradient-to-r ${selectedTier.color} p-6 text-center relative overflow-hidden`}>
              <motion.div
                className="absolute inset-0 opacity-20"
                animate={{ 
                  backgroundPosition: ['0% 0%', '100% 100%'],
                }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                style={{
                  backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}
              />
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <span className="text-5xl">{selectedTier.icon}</span>
              </motion.div>
              <h3 className="text-2xl font-bold text-white mt-2">{selectedTier.name} VIP</h3>
              <p className="text-white/80 text-sm">Unlock premium referral rewards!</p>
            </div>

            {/* Price Breakdown */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="w-5 h-5 text-muted-foreground" />
                <span className="font-semibold">Price Breakdown</span>
              </div>
              
              <div className="space-y-3 bg-secondary/50 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base Price</span>
                  <span>{formatCurrency(selectedTier.basePrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (10%)</span>
                  <span className="text-yellow-500">+{formatCurrency(taxAmount)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-lg text-primary">{formatCurrency(selectedTier.totalPrice)}</span>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-2">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  VIP Benefits:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-game-green" />
                    <span><strong>{formatCurrency(selectedTier.referralBonus)}</strong> per successful referral</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-game-green" />
                    <span>Unlock lottery ticket rewards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-game-green" />
                    <span>Referrals must deposit to count</span>
                  </li>
                </ul>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isPurchasing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePurchase}
                  disabled={isPurchasing || !isUpgrade}
                  className={`flex-1 bg-gradient-to-r ${selectedTier.color} text-white hover:opacity-90`}
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4 mr-2" />
                      {isUpgrade ? 'Purchase' : 'Already Owned'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
