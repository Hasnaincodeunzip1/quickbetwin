import { useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { formatCurrency } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Sparkles, Flame, Zap, Star, Dice1, Target, RotateCcw } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';

// Lazy load non-critical components
const WinLossPopups = lazy(() => import('@/components/dashboard/WinLossPopups').then(m => ({ default: m.WinLossPopups })));

const games = [
  { 
    name: 'Color Prediction', 
    path: '/game/color', 
    gradient: 'from-rose-500 via-red-500 to-orange-500',
    icon: '🎨',
    description: 'Predict the winning color',
    hot: true
  },
  { 
    name: 'Fast Parity', 
    path: '/game/parity', 
    gradient: 'from-blue-500 via-cyan-500 to-teal-500',
    icon: '⚡',
    description: 'Odd or Even - Quick wins',
    hot: false
  },
  { 
    name: 'Big / Small', 
    path: '/game/bigsmall', 
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    icon: '🎲',
    description: 'Guess big or small',
    hot: true
  },
  { 
    name: 'Dice Roll', 
    path: '/game/dice', 
    gradient: 'from-purple-500 via-violet-500 to-fuchsia-500',
    icon: '🎯',
    description: 'Roll and win big',
    hot: false
  },
  { 
    name: 'Number Guess', 
    path: '/game/number', 
    gradient: 'from-emerald-500 via-green-500 to-lime-500',
    icon: '🔢',
    description: 'Pick your lucky number',
    hot: false
  },
  { 
    name: 'Lucky Spin', 
    path: '/game/spin', 
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    icon: '🎰',
    description: 'Spin to win prizes',
    hot: true
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, isAdmin, isLoading } = useAuth();
  const { balance } = useWallet();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    } else if (!isLoading && isAdmin) {
      navigate('/admin');
    }
  }, [isAuthenticated, isAdmin, isLoading, navigate]);

  if (isLoading || !user) return null;
  
  const displayName = profile?.name || user.email?.split('@')[0] || 'Player';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f2e] via-background to-background pb-24">
      {/* Win/Loss Popups - lazy loaded */}
      <Suspense fallback={null}>
        <WinLossPopups />
      </Suspense>
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#1a1f4e] via-[#1e2761] to-[#1a1f4e] border-b border-primary/20">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-1">
            <span className="text-game-green">Gen</span>
            <span className="text-primary">Z</span>
            <span className="text-game-red">WIN</span>
          </h1>
          <div className="flex items-center gap-2 bg-secondary/80 px-3 py-1.5 rounded-full">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">{formatCurrency(balance)}</span>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="overflow-hidden relative border-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
            <CardContent className="relative z-10 pt-6 pb-6">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-muted-foreground text-sm">Welcome back,</p>
                  <p className="text-xl font-bold">{displayName} 👋</p>
                  <p className="text-sm text-muted-foreground mt-1">Ready to win big today?</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(balance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Hot Games Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2"
        >
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="text-lg font-bold">Hot Games</span>
          <Sparkles className="w-4 h-4 text-yellow-500" />
        </motion.div>

        {/* Games Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 gap-4"
        >
          {games.map((game, index) => (
            <motion.button
              key={game.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(game.path)}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${game.gradient} p-4 text-left shadow-lg hover:shadow-xl transition-shadow`}
            >
              {/* Hot badge */}
              {game.hot && (
                <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3 text-yellow-300" />
                  <span className="text-xs font-bold text-white">HOT</span>
                </div>
              )}
              
              {/* Game icon */}
              <div className="text-4xl mb-3 drop-shadow-lg">{game.icon}</div>
              
              {/* Game info */}
              <h3 className="text-white font-bold text-sm leading-tight mb-1">{game.name}</h3>
              <p className="text-white/70 text-xs">{game.description}</p>
              
              {/* Decorative elements */}
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -left-4 -top-4 w-16 h-16 bg-white/5 rounded-full blur-xl" />
            </motion.button>
          ))}
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="game-card bg-gradient-to-r from-secondary/50 to-secondary/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Play & Win</p>
                    <p className="text-xs text-muted-foreground">Up to 9.8x returns</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-game-green/20 flex items-center justify-center">
                    <Star className="w-6 h-6 text-game-green" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">VIP Rewards</p>
                    <p className="text-xs text-muted-foreground">Earn more bonus</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
