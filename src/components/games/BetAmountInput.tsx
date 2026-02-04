import { useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/formatters';

interface BetAmountInputProps {
  value: number;
  onChange: (amount: number) => void;
  maxBalance: number;
  disabled?: boolean;
  minBet?: number;
  stepAmount?: number;
}

const PRESET_AMOUNTS = [50, 100, 200, 500, 1000];

export function BetAmountInput({
  value,
  onChange,
  maxBalance,
  disabled = false,
  minBet = 10,
  stepAmount = 50,
}: BetAmountInputProps) {
  const [inputValue, setInputValue] = useState(value.toString());

  const handleIncrement = () => {
    const newValue = Math.min(maxBalance, value + stepAmount);
    onChange(newValue);
    setInputValue(newValue.toString());
  };

  const handleDecrement = () => {
    const newValue = Math.max(minBet, value - stepAmount);
    onChange(newValue);
    setInputValue(newValue.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setInputValue(raw);
    
    if (raw) {
      const numValue = parseInt(raw, 10);
      if (!isNaN(numValue) && numValue >= 0) {
        onChange(Math.min(Math.max(minBet, numValue), maxBalance));
      }
    }
  };

  const handleInputBlur = () => {
    // Ensure value is within bounds on blur
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue) || numValue < minBet) {
      onChange(minBet);
      setInputValue(minBet.toString());
    } else if (numValue > maxBalance) {
      onChange(maxBalance);
      setInputValue(maxBalance.toString());
    } else {
      onChange(numValue);
      setInputValue(numValue.toString());
    }
  };

  const handlePresetClick = (amount: number) => {
    const newValue = Math.min(amount, maxBalance);
    onChange(newValue);
    setInputValue(newValue.toString());
  };

  return (
    <div className="space-y-4">
      {/* Main Amount Control */}
      <div className="flex items-center justify-center gap-3">
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="icon"
            onClick={handleDecrement}
            disabled={disabled || value <= minBet}
            className="w-12 h-12 rounded-full border-2 border-primary/50 bg-primary/10 hover:bg-primary/20"
          >
            <Minus className="w-5 h-5" />
          </Button>
        </motion.div>

        {/* Manual Input Field */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">₹</span>
          <Input
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            disabled={disabled}
            className="w-36 h-14 text-center text-2xl font-bold pl-8 pr-3 rounded-xl border-2 border-primary/30 bg-secondary/50 focus:border-primary"
          />
        </div>

        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="icon"
            onClick={handleIncrement}
            disabled={disabled || value >= maxBalance}
            className="w-12 h-12 rounded-full border-2 border-primary/50 bg-primary/10 hover:bg-primary/20"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>

      {/* Preset Amounts */}
      <div className="flex flex-wrap justify-center gap-2">
        {PRESET_AMOUNTS.map((amount) => (
          <motion.div key={amount} whileTap={{ scale: 0.95 }}>
            <Button
              variant={value === amount ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetClick(amount)}
              disabled={disabled}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                value === amount 
                  ? 'bg-primary text-primary-foreground shadow-lg' 
                  : 'bg-secondary/50 hover:bg-secondary border-primary/20'
              }`}
            >
              {formatCurrency(amount)}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
