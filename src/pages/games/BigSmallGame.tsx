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

type SizeChoice = 'big' | 'small';

export default function BigSmallGame() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { balance, placeBet, addWinnings } = useWallet();

  const [timeLeft, setTimeLeft] = useState(45);
  const [isLocked, setIsLocked] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<SizeChoice | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [currentBet, setCurrentBet] = useState<{ choice: SizeChoice; amount: number } | null>(null);
  const [lastResult, setLastResult] = useState<{ dice: number[]; total: number; size: SizeChoice } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [roundNumber, setRoundNumber] = useState(3001);
  const [resultHistory, setResultHistory] = useState<{ total: number; size: SizeChoice }[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          const dice = [
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1
          ];
          const total = dice.reduce((a, b) => a + b, 0);
          const size: SizeChoice = total >= 11 ? 'big' : 'small';
          const result = { dice, total, size };
          setLastResult(result);
          setShowResult(true);
          setResultHistory(h => [{ total, size }, ...h].slice(0, 10));

          if (currentBet) {
            if (currentBet.choice === size) {
              const winAmount = currentBet.amount * 1.95;
              addWinnings(winAmount);
              toast({
                title: "🎉 You Won!",
                description: `Total ${total} is ${size}! You won ${formatCurrency(winAmount)}`,
              });
            } else {
              toast({
                title: "Better luck next time!",
                description: `Total ${total} is ${size}. Keep playing!`,
                variant: "destructive",
              });
            }
          }

          setTimeout(() => {
            setShowResult(false);
            setCurrentBet(null);
            setSelectedChoice(null);
            setIsLocked(false);
            setRoundNumber(prev => prev + 1);
          }, 3000);

          return 45;
        }

        if (prev === 6 && !isLocked) {
          setIsLocked(true);
          toast({ title: "Betting Closed", description: "Wait for the result..." });
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentBet, isLocked, addWinnings]);

  const handleBetAmountChange = (delta: number) => {
    setBetAmount((prev) => Math.max(10, Math.min(balance, prev + delta)));
  };

  const handlePlaceBet = useCallback(() => {
    if (!selectedChoice || isLocked || currentBet) return;
    if (placeBet(betAmount)) {
      setCurrentBet({ choice: selectedChoice, amount: betAmount });
      toast({ title: "Bet Placed!", description: `${formatCurrency(betAmount)} on ${selectedChoice}` });
    }
  }, [selectedChoice, isLocked, currentBet, betAmount, placeBet]);

  const presetAmounts = [50, 100, 200, 500, 1000];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">🎲 Big/Small</h1>
          <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="font-semibold">{formatCurrency(balance)}</span>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-4 space-y-4">
        <Card className="game-card overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-yellow-500/10" />
          <CardContent className="relative pt-6 text-center">
            <p className="text-muted-foreground text-sm mb-1">Round #{roundNumber}</p>
            <motion.div
              key={timeLeft}
              initial={{ scale: 1 }}
              animate={{ scale: timeLeft <= 5 ? [1, 1.1, 1] : 1 }}
              className={`text-5xl font-bold font-mono ${
                timeLeft <= 5 ? 'text-destructive animate-countdown' : 'text-foreground'
              }`}
            >
              0:{timeLeft.toString().padStart(2, '0')}
            </motion.div>
            <p className="text-sm mt-2 text-muted-foreground">
              Big: 11-18 | Small: 3-10
            </p>
          </CardContent>
        </Card>

        <AnimatePresence>
          {showResult && lastResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            >
              <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="text-center">
                <div className="flex justify-center gap-3 mb-4">
                  {lastResult.dice.map((d, i) => (
                    <motion.div
                      key={i}
                      initial={{ rotateY: 0 }}
                      animate={{ rotateY: 360 }}
                      transition={{ delay: i * 0.2 }}
                      className="w-16 h-16 rounded-xl bg-white flex items-center justify-center text-3xl font-bold text-background shadow-lg"
                    >
                      {d}
                    </motion.div>
                  ))}
                </div>
                <h2 className="text-3xl font-bold mb-2">Total: {lastResult.total}</h2>
                <p className={`text-xl font-semibold ${lastResult.size === 'big' ? 'text-orange-500' : 'text-yellow-500'}`}>
                  {lastResult.size.toUpperCase()}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <Card className="game-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Big or Small?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {(['big', 'small'] as SizeChoice[]).map((choice) => (
                <motion.button
                  key={choice}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => !isLocked && !currentBet && setSelectedChoice(choice)}
                  disabled={isLocked || !!currentBet}
                  className={`relative h-28 rounded-xl transition-all ${
                    choice === 'big' ? 'bg-orange-500' : 'bg-yellow-500'
                  } ${
                    selectedChoice === choice ? 'ring-4 ring-white scale-105' : 'opacity-80 hover:opacity-100'
                  } ${(isLocked || currentBet) ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <span className="text-2xl font-bold capitalize">{choice}</span>
                    <span className="text-xs opacity-80">{choice === 'big' ? '11-18' : '3-10'}</span>
                    <span className="text-sm opacity-80">1.95x</span>
                  </div>
                </motion.button>
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
              <Button variant="outline" size="icon" onClick={() => handleBetAmountChange(-50)} disabled={isLocked || !!currentBet || betAmount <= 10} className="w-12 h-12 rounded-full">
                <Minus className="w-5 h-5" />
              </Button>
              <div className="text-3xl font-bold w-32 text-center">{formatCurrency(betAmount)}</div>
              <Button variant="outline" size="icon" onClick={() => handleBetAmountChange(50)} disabled={isLocked || !!currentBet || betAmount >= balance} className="w-12 h-12 rounded-full">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {presetAmounts.map((amount) => (
                <Button key={amount} variant={betAmount === amount ? "default" : "outline"} size="sm" onClick={() => !isLocked && !currentBet && setBetAmount(Math.min(amount, balance))} disabled={isLocked || !!currentBet}>
                  {formatCurrency(amount)}
                </Button>
              ))}
            </div>
            <Button onClick={handlePlaceBet} disabled={!selectedChoice || isLocked || !!currentBet || betAmount > balance} className="w-full h-14 text-lg font-bold bg-gradient-to-r from-orange-500 to-yellow-500 hover:opacity-90 text-white">
              {currentBet ? `Bet Placed: ${formatCurrency(currentBet.amount)} on ${currentBet.choice}` : selectedChoice ? `Place Bet - ${formatCurrency(betAmount)}` : 'Select Big or Small'}
            </Button>
          </CardContent>
        </Card>

        <Card className="game-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {resultHistory.map((result, index) => (
                <motion.div key={index} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${result.size === 'big' ? 'bg-orange-500' : 'bg-yellow-500'}`}>
                  <span className="text-sm font-bold text-white">{result.total}</span>
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
            <Link to="/game/bigsmall" className="flex flex-col items-center gap-1 text-primary"><Gamepad2 className="w-5 h-5" /><span className="text-xs">Play</span></Link>
            <Link to="/history" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"><History className="w-5 h-5" /><span className="text-xs">History</span></Link>
            <Link to="/referral" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"><Users className="w-5 h-5" /><span className="text-xs">Referral</span></Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
