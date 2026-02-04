import { motion } from 'framer-motion';

type GameColor = 'red' | 'green' | 'violet';

interface ColorBettingCardsProps {
  selectedColor: GameColor | null;
  onSelect: (color: GameColor) => void;
  disabled?: boolean;
  localBet?: { color: GameColor; amount: number } | null;
}

const COLOR_CONFIG = {
  red: { 
    gradient: 'from-red-400 via-red-500 to-red-600',
    glow: 'shadow-red-500/50',
    label: 'Red',
    multiplier: '2x'
  },
  green: { 
    gradient: 'from-green-400 via-green-500 to-green-600',
    glow: 'shadow-green-500/50',
    label: 'Green',
    multiplier: '2x'
  },
  violet: { 
    gradient: 'from-violet-400 via-violet-500 to-violet-600',
    glow: 'shadow-violet-500/50',
    label: 'Violet',
    multiplier: '5x'
  },
};

export function ColorBettingCards({ 
  selectedColor, 
  onSelect, 
  disabled = false,
  localBet 
}: ColorBettingCardsProps) {
  const colors: GameColor[] = ['red', 'green', 'violet'];

  return (
    <div className="grid grid-cols-3 gap-3">
      {colors.map((color, index) => {
        const config = COLOR_CONFIG[color];
        const isSelected = selectedColor === color;
        const hasBet = localBet?.color === color;
        
        return (
          <motion.button
            key={color}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: disabled ? 1 : 1.05, y: disabled ? 0 : -4 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            onClick={() => !disabled && onSelect(color)}
            disabled={disabled}
            className={`relative h-28 rounded-2xl overflow-hidden
              bg-gradient-to-br ${config.gradient}
              ${isSelected ? `ring-4 ring-white shadow-2xl ${config.glow} scale-105` : 'shadow-lg'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-xl'}
              transition-all duration-300
            `}
          >
            {/* Shine overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20" />
            
            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center text-white">
              <span className="text-2xl font-bold capitalize drop-shadow-lg">{config.label}</span>
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full mt-2 backdrop-blur-sm">
                {config.multiplier}
              </span>
            </div>
            
            {/* Bet placed indicator */}
            {hasBet && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg"
              >
                <span className="text-green-600 text-lg font-bold">✓</span>
              </motion.div>
            )}
            
            {/* Decorative elements */}
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -left-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
          </motion.button>
        );
      })}
    </div>
  );
}
