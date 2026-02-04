import { useEffect, lazy, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useUserBets } from '@/hooks/useUserBets';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User,
  ArrowUpCircle, 
  ArrowDownCircle, 
  Home,
  LogOut,
  Trophy,
  TrendingUp,
  TrendingDown,
  Crown,
  Wallet,
  History,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

// Lazy load VIP section
const VipSection = lazy(() => import('@/components/vip/VipSection').then(m => ({ default: m.VipSection })));

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { balance } = useWallet();
  const { bets, stats, isLoading: betsLoading } = useUserBets();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const isLoading = authLoading || betsLoading;

  const handleLogout = async () => {
    await logout();
    navigate('/auth', { replace: true });
  };

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, hh:mm a');
    } catch {
      return dateString;
    }
  };

  const getBetColor = (betChoice: string) => {
    const choice = betChoice.toLowerCase();
    if (choice === 'red' || choice === 'big') return 'bg-game-red';
    if (choice === 'green' || choice === 'small') return 'bg-game-green';
    if (choice === 'violet' || choice === 'odd') return 'bg-game-violet';
    if (choice === 'even') return 'bg-blue-500';
    return 'bg-primary';
  };

  if (authLoading || !user) return null;

  const displayName = profile?.name || user.email?.split('@')[0] || 'Player';
  const vipLevel = profile?.vip_level || 'none';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f2e] via-background to-background pb-40">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#1a1f4e] via-[#1e2761] to-[#1a1f4e] border-b border-primary/20">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-1">
            <span className="text-game-green">Gen</span>
            <span className="text-primary">Z</span>
            <span className="text-game-red">WIN</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-secondary/80 px-3 py-1.5 rounded-full">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">{formatCurrency(balance)}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="game-card overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none z-0" />
            <CardContent className="relative z-10 pt-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold">{displayName}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {vipLevel !== 'none' && (
                    <div className="flex items-center gap-1 mt-1">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium capitalize text-yellow-500">{vipLevel} VIP</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => navigate('/wallet?action=deposit')}
                  className="bg-game-green hover:bg-game-green/90 text-white"
                >
                  <ArrowDownCircle className="w-4 h-4 mr-2" />
                  Deposit
                </Button>
                <Button 
                  onClick={() => navigate('/wallet?action=withdraw')}
                  className="bg-game-red hover:bg-game-red/90 text-white"
                >
                  <ArrowUpCircle className="w-4 h-4 mr-2" />
                  Withdraw
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Overview */}
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
              <TrendingDown className="w-5 h-5 mx-auto mb-1 text-destructive" />
              <p className="text-lg font-bold">{stats.losses}</p>
              <p className="text-xs text-muted-foreground">Losses</p>
            </CardContent>
          </Card>
          <Card className="game-card">
            <CardContent className="pt-4 text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className={`text-lg font-bold ${stats.netProfit >= 0 ? 'text-game-green' : 'text-destructive'}`}>
                {stats.netProfit >= 0 ? '+' : ''}{formatCurrency(stats.netProfit)}
              </p>
              <p className="text-xs text-muted-foreground">Net P/L</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Wallet Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="game-card">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-muted-foreground text-sm">Total Wagered</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.totalWagered)}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-sm">Total Won</p>
                  <p className="text-xl font-bold text-game-green">{formatCurrency(stats.totalWon)}</p>
                </div>
              </div>
              {stats.totalBets > 0 && (
                <>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-game-green rounded-full"
                      style={{ width: `${(stats.wins / stats.totalBets) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Win Rate: {((stats.wins / stats.totalBets) * 100).toFixed(1)}%
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* VIP Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Suspense fallback={<Skeleton className="h-40 w-full rounded-xl" />}>
            <VipSection />
          </Suspense>
        </motion.div>

        {/* Bet History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="game-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="w-4 h-4" />
                Bet History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : bets.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No bets placed yet
                </p>
              ) : (
                bets.slice(0, 10).map((bet, index) => (
                  <motion.div
                    key={bet.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.03 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getBetColor(bet.bet_choice)}`}>
                        <span className="text-white font-bold capitalize text-sm">
                          {bet.bet_choice.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">{bet.bet_choice}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(bet.amount)} • {formatTime(bet.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {bet.won === null ? (
                        <p className="font-bold text-yellow-500 text-sm">Pending</p>
                      ) : (
                        <p className={`font-bold text-sm ${bet.won ? 'text-game-green' : 'text-destructive'}`}>
                          {bet.won ? `+${formatCurrency(bet.payout || 0)}` : `-${formatCurrency(bet.amount)}`}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="game-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                onClick={() => navigate('/referral')}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium">Referral Program</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors text-destructive"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Logout</span>
                </div>
                <ChevronRight className="w-5 h-5" />
              </button>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#1a1f4e] via-[#1e2761] to-[#1a1f4e] border-t border-primary/20">
        <div className="container max-w-lg mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <Link to="/dashboard" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <Home className="w-6 h-6" />
              <span className="text-xs">Home</span>
            </Link>
            <Link to="/wallet?action=deposit" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowDownCircle className="w-6 h-6 text-game-green" />
              <span className="text-xs">Deposit</span>
            </Link>
            <Link to="/wallet?action=withdraw" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowUpCircle className="w-6 h-6 text-game-red" />
              <span className="text-xs">Withdraw</span>
            </Link>
            <Link to="/profile" className="flex flex-col items-center gap-1 text-primary">
              <User className="w-6 h-6" />
              <span className="text-xs">Profile</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
