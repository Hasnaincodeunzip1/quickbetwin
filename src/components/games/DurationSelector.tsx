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
  { value: 3, label: '3 Min' },
  { value: 5, label: '5 Min' },
];

export function DurationSelector({ 
  selectedDuration, 
  onDurationChange, 
  disabled = false 
}: DurationSelectorProps) {
  const handleClick = (duration: DurationMinutes) => {
    if (!disabled && duration !== selectedDuration) {
      onDurationChange(duration);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      <Clock className="w-4 h-4 text-muted-foreground" />
      <div className="flex bg-secondary rounded-full p-1 gap-1">
        {DURATIONS.map((duration) => (
          <button
            key={duration.value}
            type="button"
            onClick={() => handleClick(duration.value)}
            disabled={disabled}
            className={`relative px-4 py-2 rounded-full text-xs font-medium transition-all ${
              selectedDuration === duration.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary-foreground/10'
            } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            {duration.label}
          </button>
        ))}
      </div>
    </div>
  );
}
