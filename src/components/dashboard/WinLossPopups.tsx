import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingDown, Ticket, Sparkles } from 'lucide-react';

interface MockEvent {
  id: number;
  type: 'win' | 'loss' | 'lottery';
  userName: string;
  amount: number;
  game?: string;
}

const MOCK_NAMES = [
  'Raj K.', 'Priya S.', 'Amit P.', 'Sneha M.', 'Vikram R.', 
  'Anita G.', 'Rahul D.', 'Kavya N.', 'Arjun T.', 'Meera L.',
  'Rohan B.', 'Pooja V.', 'Karan S.', 'Divya K.', 'Nikhil M.',
  'Swati R.', 'Aakash J.', 'Neha P.', 'Sanjay G.', 'Ritu A.'
];

const MOCK_GAMES = ['Color', 'Parity', 'Dice', 'Spin', 'Number', 'Big/Small'];

function generateMockEvent(): MockEvent {
  const types: ('win' | 'loss' | 'lottery')[] = ['win', 'win', 'win', 'loss', 'lottery'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  let amount: number;
  if (type === 'lottery') {
    amount = [500, 1000, 2000, 5000, 10000][Math.floor(Math.random() * 5)];
  } else if (type === 'win') {
    amount = Math.floor(Math.random() * 5000) + 100;
  } else {
    amount = Math.floor(Math.random() * 1000) + 50;
  }

  return {
    id: Date.now() + Math.random(),
    type,
    userName: MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)],
    amount,
    game: type !== 'lottery' ? MOCK_GAMES[Math.floor(Math.random() * MOCK_GAMES.length)] : undefined
  };
}

export function WinLossPopups() {
  const [events, setEvents] = useState<MockEvent[]>([]);

  useEffect(() => {
    // Initial events
    const initialEvents = Array.from({ length: 1 }, generateMockEvent);
    setEvents(initialEvents);

    // Add new events periodically
    const interval = setInterval(() => {
      const newEvent = generateMockEvent();
      setEvents(prev => {
        const updated = [...prev, newEvent];
        // Keep only last 3 events
        return updated.slice(-3);
      });

      // Remove event after 4 seconds
      setTimeout(() => {
        setEvents(prev => prev.filter(e => e.id !== newEvent.id));
      }, 4000);
    }, 5000 + Math.random() * 5000);

    return () => clearInterval(interval);
  }, []);

  const getEventStyles = (type: MockEvent['type']) => {
    switch (type) {
      case 'win':
        return {
          bg: 'bg-gradient-to-r from-green-500/90 to-emerald-600/90',
          icon: Trophy,
          iconColor: 'text-yellow-300'
        };
      case 'loss':
        return {
          bg: 'bg-gradient-to-r from-red-500/80 to-rose-600/80',
          icon: TrendingDown,
          iconColor: 'text-red-200'
        };
      case 'lottery':
        return {
          bg: 'bg-gradient-to-r from-purple-500/90 to-pink-600/90',
          icon: Ticket,
          iconColor: 'text-yellow-300'
        };
    }
  };

  return (
    <div className="fixed top-20 right-4 z-40 space-y-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {events.map((event) => {
          const styles = getEventStyles(event.type);
          const Icon = styles.icon;

          return (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`${styles.bg} backdrop-blur-sm rounded-lg p-3 shadow-lg min-w-[200px] max-w-[280px]`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Icon className={`w-6 h-6 ${styles.iconColor}`} />
                  {event.type === 'lottery' && (
                    <motion.div
                      className="absolute -top-1 -right-1"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <Sparkles className="w-3 h-3 text-yellow-300" />
                    </motion.div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">
                    {event.userName}
                  </p>
                  <p className="text-white/80 text-xs">
                    {event.type === 'win' && `Won ₹${event.amount.toLocaleString()} in ${event.game}!`}
                    {event.type === 'loss' && `Playing ${event.game}`}
                    {event.type === 'lottery' && `🎉 Lottery Win ₹${event.amount.toLocaleString()}!`}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
