import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { mockBets, mockGameHistory, formatCurrency, formatTime, formatDate } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wallet, 
  Gamepad2, 
  History as HistoryIcon, 
  Users, 
  ArrowLeft,
  Trophy,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

export default function History() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const stats = {
    totalBets: mockBets.length,
    wins: mockBets.filter(b => b.won).length,
    losses: mockBets.filter(b => !b.won).length,
    totalWagered: mockBets.reduce((sum, b) => sum + b.amount, 0),
    totalWon: mockBets.filter(b => b.won).reduce((sum, b) => sum + (b.payout || 0), 0),
    netProfit: mockBets.reduce((sum, b) => sum + ((b.payout || 0) - b.amount), 0),
  };

  const getRoundResult = (roundId: string) => {
    const round = mockGameHistory.find(r => r.id === roundId);
    return round?.result;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Bet History</h1>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-game-green rounded-full"
                  style={{ width: `${(stats.wins / stats.totalBets) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Win Rate: {((stats.wins / stats.totalBets) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bet History List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="game-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">All Bets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockBets.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No bets placed yet
                </p>
              ) : (
                mockBets.map((bet, index) => {
                  const roundResult = getRoundResult(bet.roundId);
                  return (
                    <motion.div
                      key={bet.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          bet.color === 'red' ? 'bg-game-red' :
                          bet.color === 'green' ? 'bg-game-green' :
                          'bg-game-violet'
                        }`}>
                          <span className="text-white font-bold capitalize">
                            {bet.color.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium capitalize">{bet.color}</p>
                            {roundResult && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                roundResult === 'red' ? 'bg-game-red/20 text-game-red' :
                                roundResult === 'green' ? 'bg-game-green/20 text-game-green' :
                                'bg-game-violet/20 text-game-violet'
                              }`}>
                                Result: {roundResult.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Bet: {formatCurrency(bet.amount)} • {formatTime(bet.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${bet.won ? 'text-game-green' : 'text-destructive'}`}>
                          {bet.won ? `+${formatCurrency(bet.payout || 0)}` : `-${formatCurrency(bet.amount)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {bet.won ? 'Won' : 'Lost'}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border">
        <div className="container max-w-lg mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <Link to="/dashboard" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
              <Wallet className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </Link>
            <Link to="/game" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
              <Gamepad2 className="w-5 h-5" />
              <span className="text-xs">Play</span>
            </Link>
            <Link to="/history" className="flex flex-col items-center gap-1 text-primary">
              <HistoryIcon className="w-5 h-5" />
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
