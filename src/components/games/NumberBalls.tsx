import { motion } from 'framer-motion';

interface NumberBallsProps {
  selectedNumber: number | null;
  onSelect: (num: number) => void;
  disabled?: boolean;
  gameType?: 'color' | 'number' | 'dice';
}

// Color mapping for each number (lottery ball style)
const BALL_COLORS: Record<number, { bg: string; glow: string; gradient: string }> = {
  0: { bg: 'bg-violet-500', glow: 'shadow-violet-500/50', gradient: 'from-violet-400 to-violet-600' },
  1: { bg: 'bg-green-500', glow: 'shadow-green-500/50', gradient: 'from-green-400 to-green-600' },
  2: { bg: 'bg-red-500', glow: 'shadow-red-500/50', gradient: 'from-red-400 to-red-600' },
  3: { bg: 'bg-green-500', glow: 'shadow-green-500/50', gradient: 'from-green-400 to-green-600' },
  4: { bg: 'bg-red-500', glow: 'shadow-red-500/50', gradient: 'from-red-400 to-red-600' },
  5: { bg: 'bg-violet-500', glow: 'shadow-violet-500/50', gradient: 'from-violet-400 to-violet-600' },
  6: { bg: 'bg-red-500', glow: 'shadow-red-500/50', gradient: 'from-red-400 to-red-600' },
  7: { bg: 'bg-green-500', glow: 'shadow-green-500/50', gradient: 'from-green-400 to-green-600' },
  8: { bg: 'bg-red-500', glow: 'shadow-red-500/50', gradient: 'from-red-400 to-red-600' },
  9: { bg: 'bg-green-500', glow: 'shadow-green-500/50', gradient: 'from-green-400 to-green-600' },
};

// For dice (1-6)
const DICE_COLORS: Record<number, { bg: string; glow: string; gradient: string }> = {
  1: { bg: 'bg-red-500', glow: 'shadow-red-500/50', gradient: 'from-red-400 to-red-600' },
  2: { bg: 'bg-blue-500', glow: 'shadow-blue-500/50', gradient: 'from-blue-400 to-blue-600' },
  3: { bg: 'bg-green-500', glow: 'shadow-green-500/50', gradient: 'from-green-400 to-green-600' },
  4: { bg: 'bg-yellow-500', glow: 'shadow-yellow-500/50', gradient: 'from-yellow-400 to-yellow-600' },
  5: { bg: 'bg-purple-500', glow: 'shadow-purple-500/50', gradient: 'from-purple-400 to-purple-600' },
  6: { bg: 'bg-orange-500', glow: 'shadow-orange-500/50', gradient: 'from-orange-400 to-orange-600' },
};

export function NumberBalls({ 
  selectedNumber, 
  onSelect, 
  disabled = false,
  gameType = 'number' 
}: NumberBallsProps) {
  const numbers = gameType === 'dice' ? [1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const colorMap = gameType === 'dice' ? DICE_COLORS : BALL_COLORS;

  return (
    <div className={`grid gap-3 ${gameType === 'dice' ? 'grid-cols-3' : 'grid-cols-5'}`}>
      {numbers.map((num, index) => {
        const isSelected = selectedNumber === num;
        const colors = colorMap[num];
        
        return (
          <motion.button
            key={num}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            whileHover={{ scale: disabled ? 1 : 1.1, y: disabled ? 0 : -4 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            onClick={() => !disabled && onSelect(num)}
            disabled={disabled}
            className={`relative aspect-square rounded-full flex items-center justify-center 
              bg-gradient-to-br ${colors.gradient}
              ${isSelected ? `ring-4 ring-white shadow-xl ${colors.glow} shadow-2xl scale-110` : 'shadow-lg'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-xl'}
              transition-all duration-200 overflow-hidden
            `}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-full" />
            <div className="absolute top-1 left-1/4 w-1/4 h-1/4 bg-white/30 rounded-full blur-sm" />
            
            {/* Number */}
            <span className="relative text-white font-bold text-2xl drop-shadow-lg">
              {num}
            </span>
            
            {/* Selected checkmark */}
            {isSelected && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md"
              >
                <span className="text-green-600 text-xs font-bold">✓</span>
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
