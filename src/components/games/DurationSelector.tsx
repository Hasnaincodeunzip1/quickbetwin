import { useCallback, useRef } from 'react';
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
  disabled = false,
}: DurationSelectorProps) {
  // Debounce to prevent double-firing from touch + click
  const lastFireRef = useRef(0);

  const handleSelect = useCallback((duration: DurationMinutes) => {
    if (disabled) return;
    
    const now = Date.now();
    if (now - lastFireRef.current < 300) return;
    lastFireRef.current = now;
    
    console.log('[DurationSelector] Selected:', duration);
    onDurationChange(duration);
  }, [disabled, onDurationChange]);

  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      <Clock className="w-4 h-4 text-muted-foreground" />
      <div className="flex bg-secondary rounded-full p-1 gap-1">
        {DURATIONS.map((duration) => {
          const isSelected = selectedDuration === duration.value;

          return (
            <button
              key={duration.value}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onTouchStart={(e) => {
                e.preventDefault();
                handleSelect(duration.value);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(duration.value);
              }}
              onClick={(e) => {
                e.preventDefault();
                handleSelect(duration.value);
              }}
              className={`relative px-4 py-2 rounded-full text-xs font-medium transition-all select-none cursor-pointer touch-manipulation ${
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary-foreground/10'
              } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              {duration.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}