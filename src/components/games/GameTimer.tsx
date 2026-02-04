import { memo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface GameTimerProps {
  endTime: string | undefined;
  duration: number; // in minutes
  onExpired?: () => void;
}

export const GameTimer = memo(function GameTimer({ endTime, duration, onExpired }: GameTimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const expiredTriggeredRef = useRef(false);

  useEffect(() => {
    if (!endTime) {
      setTimeLeft(0);
      return;
    }

    expiredTriggeredRef.current = false;

    const updateTime = () => {
      const end = new Date(endTime).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      
      setTimeLeft(remaining);

      if (remaining === 0 && !expiredTriggeredRef.current) {
        expiredTriggeredRef.current = true;
        onExpired?.();
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [endTime, onExpired]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalSeconds = duration * 60;

  return (
    <>
      <div
        className={`text-6xl font-bold font-mono ${
          timeLeft <= 10 ? 'text-destructive animate-pulse' : 'text-primary'
        }`}
      >
        {formatTime(timeLeft)}
      </div>
      {timeLeft <= 10 && timeLeft > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3"
        >
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-destructive to-orange-500 transition-[width] duration-1000 ease-linear"
              style={{ width: `${Math.max(0, Math.min(100, (timeLeft / 10) * 100))}%` }}
            />
          </div>
          <p className="text-xs text-destructive mt-1 animate-pulse">Hurry! Place your bet!</p>
        </motion.div>
      )}
    </>
  );
});
