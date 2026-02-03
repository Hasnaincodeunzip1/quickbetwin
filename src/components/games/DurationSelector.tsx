import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { DurationMinutes } from '@/hooks/useGameRounds';

interface DurationSelectorProps {
  selectedDuration: DurationMinutes;
  onDurationChange: (duration: DurationMinutes) => void;
  disabled?: boolean;
}

const DURATIONS: { value: DurationMinutes; label: string }[] = [
  { value: 1, label: '1 Min' },
  { value: 2, label: '2 Min' },
  { value: 3, label: '3 Min' },
  { value: 5, label: '5 Min' },
];

export function DurationSelector({ 
  selectedDuration, 
  onDurationChange, 
  disabled = false 
}: DurationSelectorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      <Clock className="w-4 h-4 text-muted-foreground" />
      <div className="flex bg-secondary rounded-full p-1">
        {DURATIONS.map((duration) => (
          <motion.button
            key={duration.value}
            onClick={() => !disabled && onDurationChange(duration.value)}
            disabled={disabled}
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            className={`relative px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedDuration === duration.value
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {selectedDuration === duration.value && (
              <motion.div
                layoutId="duration-bg"
                className="absolute inset-0 bg-primary rounded-full"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">{duration.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
