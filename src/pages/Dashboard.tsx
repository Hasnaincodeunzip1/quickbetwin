import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useUserBets } from '@/hooks/useUserBets';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VipSection } from '@/components/vip/VipSection';
import { WinLossPopups } from '@/components/dashboard/WinLossPopups';
import { 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Gamepad2, 
  History, 
  Users, 
  LogOut,
  Trophy,
  TrendingUp,
  Clock
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, isAdmin, isLoading, logout } = useAuth();
  const { balance } = useWallet();
  const { bets, isLoading: betsLoading } = useUserBets();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    } else if (!isLoading && isAdmin) {
      navigate('/admin');
    }
  }, [isAuthenticated, isAdmin, isLoading, navigate]);

  if (isLoading || !user) return null;
  
  const displayName = profile?.name || user.email?.split('@')[0] || 'Player';

  const recentBets = bets.slice(0, 3);

  const stats = {
    totalBets: bets.length,
    wins: bets.filter(b => b.won).length,
    totalWinnings: bets.filter(b => b.won).reduce((sum, b) => sum + (Number(b.payout) || 0), 0),
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Win/Loss Popups */}
      <WinLossPopups />
      
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">
            <span className="text-game-red">GenX</span>
            <span className="text-game-green">WIN</span>
          </h1>
          <button 
            onClick={handleLogout}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Welcome & Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="game-card overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
            <CardContent className="relative pt-6">
              <p className="text-muted-foreground text-sm">Welcome back,</p>
              <p className="text-lg font-semibold mb-4">{displayName}</p>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Wallet Balance</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(balance)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => navigate('/wallet?action=deposit')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <ArrowDownCircle className="w-4 h-4 mr-2" />
                  Deposit
                </Button>
                <Button 
                  onClick={() => navigate('/wallet?action=withdraw')}
                  variant="outline"
                  className="border-border hover:bg-secondary"
                >
                  <ArrowUpCircle className="w-4 h-4 mr-2" />
                  Withdraw
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          <Card className="game-card">
            <CardContent className="pt-4 text-center">
              <Trophy className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
              <p className="text-lg font-bold">{stats.wins}</p>
              <p className="text-xs text-muted-foreground">Wins</p>
            </CardContent>
          </Card>
          <Card className="game-card">
            <CardContent className="pt-4 text-center">
              <Gamepad2 className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{stats.totalBets}</p>
              <p className="text-xs text-muted-foreground">Total Bets</p>
            </CardContent>
          </Card>
          <Card className="game-card">
            <CardContent className="pt-4 text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-game-green" />
              <p className="text-lg font-bold">{formatCurrency(stats.totalWinnings)}</p>
              <p className="text-xs text-muted-foreground">Winnings</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Games Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="game-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Gamepad2 className="w-4 h-4" />
                Choose Your Game
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Color Prediction', path: '/game/color', color: 'from-game-red to-game-green', icon: '🎨' },
                  { name: 'Fast Parity', path: '/game/parity', color: 'from-blue-500 to-cyan-500', icon: '⚡' },
                  { name: 'Big/Small', path: '/game/bigsmall', color: 'from-orange-500 to-yellow-500', icon: '🎲' },
                  { name: 'Dice Roll', path: '/game/dice', color: 'from-purple-500 to-pink-500', icon: '🎯' },
                  { name: 'Number Guess', path: '/game/number', color: 'from-green-500 to-emerald-500', icon: '🔢' },
                  { name: 'Lucky Spin', path: '/game/spin', color: 'from-rose-500 to-red-500', icon: '🎰' },
                ].map((game, index) => (
                  <motion.button
                    key={game.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    onClick={() => navigate(game.path)}
                    className={`relative p-4 rounded-xl bg-gradient-to-br ${game.color} hover:scale-105 transition-transform text-white text-left`}
                  >
                    <span className="text-2xl mb-2 block">{game.icon}</span>
                    <span className="text-sm font-semibold">{game.name}</span>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* VIP Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <VipSection />
        </motion.div>

        {/* Recent Bets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="game-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Your Recent Bets
                </CardTitle>
                <Link to="/history" className="text-xs text-primary hover:underline">
                  View All
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {betsLoading ? (
                <p className="text-center text-muted-foreground py-4">Loading...</p>
              ) : recentBets.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No bets yet. Start playing!</p>
              ) : (
                recentBets.map((bet) => (
                  <div 
                    key={bet.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${
                        bet.bet_choice === 'red' ? 'bg-game-red' :
                        bet.bet_choice === 'green' ? 'bg-game-green' :
                        bet.bet_choice === 'violet' ? 'bg-game-violet' :
                        'bg-primary'
                      }`} />
                      <div>
                        <p className="text-sm font-medium capitalize">{bet.bet_choice}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(Number(bet.amount))}</p>
                      </div>
                    </div>
                    <div className={`text-sm font-bold ${bet.won ? 'text-game-green' : bet.won === false ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {bet.won === null ? 'Pending' : bet.won ? `+${formatCurrency(Number(bet.payout) || 0)}` : 'Lost'}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border">
        <div className="container max-w-lg mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <Link to="/dashboard" className="flex flex-col items-center gap-1 text-primary">
              <Wallet className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </Link>
            <Link to="/game" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
              <Gamepad2 className="w-5 h-5" />
              <span className="text-xs">Play</span>
            </Link>
            <Link to="/history" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
              <History className="w-5 h-5" />
              <span className="text-xs">History</span>
            </Link>
            <Link to="/referral" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
              <Users className="w-5 h-5" />
              <span className="text-xs">Referral</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
