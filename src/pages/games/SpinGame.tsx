import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
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
  Plus
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

export default function SpinGame() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { balance, placeBet, addWinnings } = useWallet();

  const [betAmount, setBetAmount] = useState(100);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState<SpinSymbol[]>(['🍒', '🍋', '🍊']);
  const [lastWin, setLastWin] = useState<{ amount: number; symbol: SpinSymbol } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [resultHistory, setResultHistory] = useState<{ reels: SpinSymbol[]; won: boolean }[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  const handleBetAmountChange = (delta: number) => {
    setBetAmount((prev) => Math.max(10, Math.min(balance, prev + delta)));
  };

  const spin = useCallback(() => {
    if (isSpinning || betAmount > balance) return;
    
    if (!placeBet(betAmount)) return;
    
    setIsSpinning(true);
    setShowResult(false);
    setLastWin(null);

    // Animate reels
    let spinCount = 0;
    const spinInterval = setInterval(() => {
      setReels([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ]);
      spinCount++;

      if (spinCount >= 20) {
        clearInterval(spinInterval);
        
        // Final result
        const finalReels: SpinSymbol[] = [
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
        ];
        setReels(finalReels);
        
        // Check for wins (all three match)
        const allMatch = finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2];
        const twoMatch = finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2] || finalReels[0] === finalReels[2];
        
        if (allMatch) {
          const winSymbol = finalReels[0];
          const winAmount = betAmount * multipliers[winSymbol];
          addWinnings(winAmount);
          setLastWin({ amount: winAmount, symbol: winSymbol });
          toast({
            title: "🎰 JACKPOT!",
            description: `Triple ${winSymbol}! You won ${formatCurrency(winAmount)}`,
          });
        } else if (twoMatch) {
          const winAmount = betAmount * 1.5;
          addWinnings(winAmount);
          setLastWin({ amount: winAmount, symbol: finalReels[0] });
          toast({
            title: "🎰 Two of a Kind!",
            description: `You won ${formatCurrency(winAmount)}`,
          });
        } else {
          toast({
            title: "No match",
            description: "Spin again for another chance!",
            variant: "destructive",
          });
        }

        setResultHistory(h => [{ reels: finalReels, won: allMatch || twoMatch }, ...h].slice(0, 10));
        setShowResult(true);
        setIsSpinning(false);
      }
    }, 100);
  }, [isSpinning, betAmount, balance, placeBet, addWinnings]);

  const presetAmounts = [50, 100, 200, 500, 1000];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">🎰 Lucky Spin</h1>
          <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="font-semibold">{formatCurrency(balance)}</span>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Slot Machine */}
        <Card className="game-card overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-red-500/10" />
          <CardContent className="relative pt-6">
            <div className="bg-secondary/50 rounded-2xl p-6 mb-4">
              <div className="flex justify-center gap-2 mb-4">
                {reels.map((symbol, index) => (
                  <motion.div
                    key={index}
                    animate={isSpinning ? { y: [0, -10, 0] } : {}}
                    transition={{ repeat: isSpinning ? Infinity : 0, duration: 0.1 }}
                    className="w-20 h-20 bg-background rounded-xl flex items-center justify-center text-4xl shadow-lg border-2 border-border"
                  >
                    {symbol}
                  </motion.div>
                ))}
              </div>
              
              {showResult && lastWin && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <p className="text-2xl font-bold text-game-green">
                    +{formatCurrency(lastWin.amount)}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Payout Table */}
            <div className="grid grid-cols-3 gap-2 text-xs text-center">
              {symbols.map((symbol) => (
                <div key={symbol} className="bg-secondary/30 rounded-lg p-2">
                  <span className="text-lg">{symbol}{symbol}{symbol}</span>
                  <p className="text-muted-foreground">{multipliers[symbol]}x</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="game-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Bet Amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="icon" onClick={() => handleBetAmountChange(-50)} disabled={isSpinning || betAmount <= 10} className="w-12 h-12 rounded-full">
                <Minus className="w-5 h-5" />
              </Button>
              <div className="text-3xl font-bold w-32 text-center">{formatCurrency(betAmount)}</div>
              <Button variant="outline" size="icon" onClick={() => handleBetAmountChange(50)} disabled={isSpinning || betAmount >= balance} className="w-12 h-12 rounded-full">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {presetAmounts.map((amount) => (
                <Button key={amount} variant={betAmount === amount ? "default" : "outline"} size="sm" onClick={() => !isSpinning && setBetAmount(Math.min(amount, balance))} disabled={isSpinning}>
                  {formatCurrency(amount)}
                </Button>
              ))}
            </div>
            <Button 
              onClick={spin} 
              disabled={isSpinning || betAmount > balance} 
              className="w-full h-16 text-xl font-bold bg-gradient-to-r from-rose-500 to-red-500 hover:opacity-90 text-white"
            >
              {isSpinning ? '🎰 Spinning...' : '🎰 SPIN!'}
            </Button>
          </CardContent>
        </Card>

        <Card className="game-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Spins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resultHistory.slice(0, 5).map((result, index) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center justify-between p-2 rounded-lg ${result.won ? 'bg-game-green/20' : 'bg-secondary/30'}`}
                >
                  <div className="flex gap-1 text-xl">
                    {result.reels.map((r, i) => <span key={i}>{r}</span>)}
                  </div>
                  <span className={`text-sm font-semibold ${result.won ? 'text-game-green' : 'text-muted-foreground'}`}>
                    {result.won ? 'Win!' : 'Miss'}
                  </span>
                </motion.div>
              ))}
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
