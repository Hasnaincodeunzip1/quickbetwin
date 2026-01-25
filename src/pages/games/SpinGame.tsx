import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useGameRounds, GameType } from '@/hooks/useGameRounds';
import { useBets } from '@/hooks/useBets';
import { formatCurrency } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wallet, 
  Gamepad2, 
  History, 
  Users, 
  ArrowLeft,
  Minus,
  Plus,
  Sparkles,
  Star,
  Zap
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type SpinSymbol = '🍒' | '🍋' | '🍊' | '💎' | '7️⃣' | '⭐';

const symbols: SpinSymbol[] = ['🍒', '🍋', '🍊', '💎', '7️⃣', '⭐'];
const multipliers: Record<SpinSymbol, number> = {
  '🍒': 2,
  '🍋': 3,
  '🍊': 4,
  '💎': 5,
  '7️⃣': 7,
  '⭐': 10,
};

const symbolNames: Record<SpinSymbol, string> = {
  '🍒': 'Cherry',
  '🍋': 'Lemon',
  '🍊': 'Orange',
  '💎': 'Diamond',
  '7️⃣': 'Lucky 7',
  '⭐': 'Star',
};

export default function SpinGame() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { balance, refetchBalance } = useWallet();
  const { placeBet: placeBetAPI, isPlacingBet } = useBets();

  const gameType: GameType = 'spin';
  const { currentRound } = useGameRounds({ gameType, durationMinutes: 1 });

  const [betAmount, setBetAmount] = useState(100);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState<SpinSymbol[]>(['🍒', '🍋', '🍊']);
  const [lastWin, setLastWin] = useState<{ amount: number; symbol: SpinSymbol } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [resultHistory, setResultHistory] = useState<{ reels: SpinSymbol[]; won: boolean; amount?: number }[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleBetAmountChange = (delta: number) => {
    setBetAmount((prev) => Math.max(10, Math.min(balance, prev + delta)));
  };

  const spin = useCallback(async () => {
    if (isSpinning || betAmount > balance || isPlacingBet) return;
    
    if (betAmount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this bet.",
        variant: "destructive",
      });
      return;
    }

    // Place bet in database if round exists
    if (currentRound) {
      const bet = await placeBetAPI(currentRound.id, 'spin', betAmount);
      if (!bet) return;
    }
    
    setIsSpinning(true);
    setShowResult(false);
    setLastWin(null);

    // Animate reels with varying speeds
    let spinCount = 0;
    const spinInterval = setInterval(() => {
      setReels([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ]);
      spinCount++;

      if (spinCount >= 25) {
        clearInterval(spinInterval);
        
        // Final result
        const finalReels: SpinSymbol[] = [
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
        ];
        setReels(finalReels);
        
        // Check for wins
        const allMatch = finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2];
        const twoMatch = finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2] || finalReels[0] === finalReels[2];
        
        let winAmount = 0;
        if (allMatch) {
          const winSymbol = finalReels[0];
          winAmount = betAmount * multipliers[winSymbol];
          setLastWin({ amount: winAmount, symbol: winSymbol });
          toast({
            title: "🎰 JACKPOT!",
            description: `Triple ${symbolNames[winSymbol]}! You won ₹${winAmount}`,
          });
        } else if (twoMatch) {
          winAmount = betAmount * 1.5;
          setLastWin({ amount: winAmount, symbol: finalReels[0] });
          toast({
            title: "🎰 Two of a Kind!",
            description: `You won ₹${winAmount}`,
          });
        } else {
          toast({
            title: "No match",
            description: "Spin again for another chance!",
            variant: "destructive",
          });
        }

        setResultHistory(h => [{ reels: finalReels, won: allMatch || twoMatch, amount: winAmount }, ...h].slice(0, 10));
        setShowResult(true);
        setIsSpinning(false);
        refetchBalance();
      }
    }, 80);
  }, [isSpinning, betAmount, balance, isPlacingBet, currentRound, placeBetAPI, refetchBalance]);

  const presetAmounts = [50, 100, 200, 500, 1000];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 hover:bg-secondary rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Lucky Spin
          </h1>
          <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="font-semibold">{formatCurrency(balance)}</span>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Slot Machine */}
        <Card className="game-card overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 via-transparent to-yellow-500/20" />
          <CardContent className="relative pt-6">
            {/* Machine Frame */}
            <div className="bg-gradient-to-b from-secondary to-secondary/80 rounded-3xl p-1 mb-4">
              <div className="bg-gradient-to-b from-background to-card rounded-2xl p-4">
                {/* Top Lights */}
                <div className="flex justify-center gap-3 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                      key={i}
                      animate={isSpinning ? { opacity: [0.3, 1, 0.3] } : { opacity: 1 }}
                      transition={{ repeat: isSpinning ? Infinity : 0, duration: 0.3, delay: i * 0.1 }}
                      className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg"
                    />
                  ))}
                </div>

                {/* Reels */}
                <div className="flex justify-center gap-3 mb-4">
                  {reels.map((symbol, index) => (
                    <motion.div
                      key={index}
                      animate={isSpinning ? { y: [0, -15, 0, -10, 0] } : {}}
                      transition={{ repeat: isSpinning ? Infinity : 0, duration: 0.15 }}
                      className="w-24 h-24 bg-gradient-to-b from-white to-gray-100 rounded-2xl flex items-center justify-center text-5xl shadow-inner border-4 border-secondary"
                    >
                      <motion.span
                        animate={isSpinning ? { scale: [1, 0.9, 1] } : {}}
                        transition={{ repeat: isSpinning ? Infinity : 0, duration: 0.1 }}
                      >
                        {symbol}
                      </motion.span>
                    </motion.div>
                  ))}
                </div>
                
                {/* Win Display */}
                <AnimatePresence>
                  {showResult && lastWin && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-2"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 0.5 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                        <p className="text-2xl font-bold text-game-green">
                          +{formatCurrency(lastWin.amount)}
                        </p>
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Payout Table */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {symbols.map((symbol) => (
                <div key={symbol} className="bg-secondary/50 rounded-xl p-2 hover:bg-secondary/70 transition-colors">
                  <div className="text-2xl mb-1">{symbol}{symbol}{symbol}</div>
                  <p className="text-xs text-muted-foreground font-medium">{multipliers[symbol]}x</p>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2">
              2 matching = 1.5x • 3 matching = Symbol multiplier
            </p>
          </CardContent>
        </Card>

        {/* Bet Controls */}
        <Card className="game-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Bet Amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="icon" onClick={() => handleBetAmountChange(-50)} disabled={isSpinning || betAmount <= 10} className="w-14 h-14 rounded-full">
                <Minus className="w-6 h-6" />
              </Button>
              <div className="text-4xl font-bold w-36 text-center">{formatCurrency(betAmount)}</div>
              <Button variant="outline" size="icon" onClick={() => handleBetAmountChange(50)} disabled={isSpinning || betAmount >= balance} className="w-14 h-14 rounded-full">
                <Plus className="w-6 h-6" />
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {presetAmounts.map((amount) => (
                <Button 
                  key={amount} 
                  variant={betAmount === amount ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => !isSpinning && setBetAmount(Math.min(amount, balance))} 
                  disabled={isSpinning}
                >
                  {formatCurrency(amount)}
                </Button>
              ))}
            </div>
            <Button 
              onClick={spin} 
              disabled={isSpinning || betAmount > balance || isPlacingBet} 
              className="w-full h-20 text-2xl font-bold bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 hover:opacity-90 text-white shadow-lg relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-white/20"
                animate={!isSpinning ? { x: ['-100%', '100%'] } : {}}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              />
              <span className="relative flex items-center gap-2">
                {isSpinning ? (
                  <>
                    <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.5 }}>
                      🎰
                    </motion.span>
                    Spinning...
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6" />
                    SPIN!
                  </>
                )}
              </span>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Spins */}
        <Card className="game-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent Spins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resultHistory.slice(0, 5).map((result, index) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    result.won 
                      ? 'bg-gradient-to-r from-game-green/20 to-transparent border border-game-green/30' 
                      : 'bg-secondary/30'
                  }`}
                >
                  <div className="flex gap-2 text-2xl">
                    {result.reels.map((r, i) => <span key={i}>{r}</span>)}
                  </div>
                  <span className={`text-sm font-bold ${result.won ? 'text-game-green' : 'text-muted-foreground'}`}>
                    {result.won ? `+${formatCurrency(result.amount || 0)}` : 'Miss'}
                  </span>
                </motion.div>
              ))}
              {resultHistory.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">No spins yet - try your luck!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border">
        <div className="container max-w-lg mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <Link to="/dashboard" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"><Wallet className="w-5 h-5" /><span className="text-xs">Home</span></Link>
            <Link to="/game/spin" className="flex flex-col items-center gap-1 text-primary"><Gamepad2 className="w-5 h-5" /><span className="text-xs">Play</span></Link>
            <Link to="/history" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"><History className="w-5 h-5" /><span className="text-xs">History</span></Link>
            <Link to="/referral" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"><Users className="w-5 h-5" /><span className="text-xs">Referral</span></Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
