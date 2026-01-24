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
  Plus,
  Hash,
  Crown,
  Sparkles
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function NumberGame() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { balance, placeBet, addWinnings } = useWallet();

  const [timeLeft, setTimeLeft] = useState(90);
  const [isLocked, setIsLocked] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [currentBet, setCurrentBet] = useState<{ number: number; amount: number } | null>(null);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [roundNumber, setRoundNumber] = useState(9001);
  const [resultHistory, setResultHistory] = useState<number[]>([]);
  const [spinningNumber, setSpinningNumber] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsSpinning(true);
          
          // Spinning animation
          let spinCount = 0;
          const spinInterval = setInterval(() => {
            setSpinningNumber(Math.floor(Math.random() * 10));
            spinCount++;
            if (spinCount >= 20) {
              clearInterval(spinInterval);
              const result = Math.floor(Math.random() * 10);
              setLastResult(result);
              setSpinningNumber(result);
              setShowResult(true);
              setIsSpinning(false);
              setResultHistory(h => [result, ...h].slice(0, 10));

              if (currentBet) {
                if (currentBet.number === result) {
                  const winAmount = currentBet.amount * 9;
                  addWinnings(winAmount);
                  toast({
                    title: "🎉 JACKPOT!",
                    description: `Number ${result} hit! You won ${formatCurrency(winAmount)}`,
                  });
                } else {
                  toast({
                    title: "Not your number!",
                    description: `Result was ${result}. Better luck next time!`,
                    variant: "destructive",
                  });
                }
              }

              setTimeout(() => {
                setShowResult(false);
                setCurrentBet(null);
                setSelectedNumber(null);
                setIsLocked(false);
                setRoundNumber(prev => prev + 1);
              }, 3000);
            }
          }, 100);

          return 90;
        }

        if (prev === 11 && !isLocked) {
          setIsLocked(true);
          toast({ title: "Betting Closed", description: "Drawing number..." });
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
    if (selectedNumber === null || isLocked || currentBet) return;
    if (placeBet(betAmount)) {
      setCurrentBet({ number: selectedNumber, amount: betAmount });
      toast({ title: "Bet Placed!", description: `${formatCurrency(betAmount)} on ${selectedNumber}` });
    }
  }, [selectedNumber, isLocked, currentBet, betAmount, placeBet]);

  const presetAmounts = [50, 100, 200, 500, 1000];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const numberColors = [
    'from-rose-500 to-rose-600',
    'from-pink-500 to-pink-600',
    'from-fuchsia-500 to-fuchsia-600',
    'from-purple-500 to-purple-600',
    'from-violet-500 to-violet-600',
    'from-indigo-500 to-indigo-600',
    'from-blue-500 to-blue-600',
    'from-cyan-500 to-cyan-600',
    'from-teal-500 to-teal-600',
    'from-emerald-500 to-emerald-600',
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 hover:bg-secondary rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Hash className="w-5 h-5 text-emerald-500" />
            Number Guess
          </h1>
          <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="font-semibold">{formatCurrency(balance)}</span>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Timer */}
        <Card className="game-card overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-transparent to-emerald-500/20" />
          <CardContent className="relative pt-6 text-center">
            <div className="flex justify-center gap-2 mb-3">
              <span className="px-3 py-1 bg-secondary rounded-full text-xs font-medium">
                Round #{roundNumber}
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium flex items-center gap-1">
                <Crown className="w-3 h-3" /> 9x Jackpot
              </span>
            </div>
            <motion.div
              key={timeLeft}
              initial={{ scale: 1 }}
              animate={{ scale: timeLeft <= 10 ? [1, 1.1, 1] : 1 }}
              className={`text-6xl font-bold font-mono ${
                timeLeft <= 10 ? 'text-destructive' : 'text-foreground'
              }`}
            >
              {formatTime(timeLeft)}
            </motion.div>
            <p className="text-sm text-muted-foreground mt-2">Pick 0-9, win 9x your bet!</p>
          </CardContent>
        </Card>

        {/* Spinning Animation */}
        <AnimatePresence>
          {isSpinning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 0.2 }}
                className={`w-40 h-40 rounded-3xl bg-gradient-to-br ${numberColors[spinningNumber]} flex items-center justify-center shadow-2xl`}
              >
                <span className="text-7xl font-bold text-white">{spinningNumber}</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Modal */}
        <AnimatePresence>
          {showResult && lastResult !== null && !isSpinning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
            >
              <motion.div 
                initial={{ y: 50 }} 
                animate={{ y: 0 }}
                className="text-center"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                  className={`w-40 h-40 rounded-full mx-auto mb-4 bg-gradient-to-br ${numberColors[lastResult]} flex items-center justify-center shadow-2xl`}
                >
                  <span className="text-7xl font-bold text-white">{lastResult}</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                  <h2 className="text-3xl font-bold">Winning Number</h2>
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Number Selection */}
        <Card className="game-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Crown className="w-4 h-4 text-emerald-500" />
              Pick Your Lucky Number (9x payout)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <motion.button
                  key={num}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => !isLocked && !currentBet && setSelectedNumber(num)}
                  disabled={isLocked || !!currentBet}
                  className={`relative h-16 rounded-2xl bg-gradient-to-br ${numberColors[num]} transition-all overflow-hidden ${
                    selectedNumber === num 
                      ? 'ring-4 ring-white scale-110 shadow-lg z-10' 
                      : 'opacity-75 hover:opacity-100'
                  } ${(isLocked || currentBet) ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{num}</span>
                  </div>
                  {currentBet?.number === num && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg"
                    >
                      <span className="text-xs font-bold text-background">✓</span>
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bet Amount */}
        <Card className="game-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Bet Amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="icon" onClick={() => handleBetAmountChange(-50)} disabled={isLocked || !!currentBet || betAmount <= 10} className="w-14 h-14 rounded-full">
                <Minus className="w-6 h-6" />
              </Button>
              <div className="text-4xl font-bold w-36 text-center">{formatCurrency(betAmount)}</div>
              <Button variant="outline" size="icon" onClick={() => handleBetAmountChange(50)} disabled={isLocked || !!currentBet || betAmount >= balance} className="w-14 h-14 rounded-full">
                <Plus className="w-6 h-6" />
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {presetAmounts.map((amount) => (
                <Button key={amount} variant={betAmount === amount ? "default" : "outline"} size="sm" onClick={() => !isLocked && !currentBet && setBetAmount(Math.min(amount, balance))} disabled={isLocked || !!currentBet}>
                  {formatCurrency(amount)}
                </Button>
              ))}
            </div>
            <Button 
              onClick={handlePlaceBet} 
              disabled={selectedNumber === null || isLocked || !!currentBet || betAmount > balance} 
              className="w-full h-16 text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 text-white"
            >
              {currentBet 
                ? `✓ ${formatCurrency(currentBet.amount)} on ${currentBet.number}` 
                : selectedNumber !== null 
                  ? `Place Bet - ${formatCurrency(betAmount)}` 
                  : 'Pick a Number'}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Results */}
        <Card className="game-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {resultHistory.map((num, index) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, scale: 0.8 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${numberColors[num]} flex items-center justify-center flex-shrink-0 shadow-md`}
                >
                  <span className="text-lg font-bold text-white">{num}</span>
                </motion.div>
              ))}
              {resultHistory.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">No results yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border">
        <div className="container max-w-lg mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <Link to="/dashboard" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"><Wallet className="w-5 h-5" /><span className="text-xs">Home</span></Link>
            <Link to="/game/number" className="flex flex-col items-center gap-1 text-primary"><Gamepad2 className="w-5 h-5" /><span className="text-xs">Play</span></Link>
            <Link to="/history" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"><History className="w-5 h-5" /><span className="text-xs">History</span></Link>
            <Link to="/referral" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"><Users className="w-5 h-5" /><span className="text-xs">Referral</span></Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
