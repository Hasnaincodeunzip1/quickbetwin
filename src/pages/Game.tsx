import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { formatCurrency, mockGameHistory, getColorMultiplier } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wallet, 
  Gamepad2, 
  History, 
  Users, 
  Clock,
  Trophy,
  Minus,
  Plus
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type GameColor = 'red' | 'green' | 'violet';
type GameDuration = 1 | 3 | 5;

export default function Game() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { balance, placeBet, addWinnings } = useWallet();

  const [duration, setDuration] = useState<GameDuration>(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isLocked, setIsLocked] = useState(false);
  const [selectedColor, setSelectedColor] = useState<GameColor | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [currentBet, setCurrentBet] = useState<{ color: GameColor; amount: number } | null>(null);
  const [lastResult, setLastResult] = useState<GameColor | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [roundNumber, setRoundNumber] = useState(2024010151);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  // Timer logic
  useEffect(() => {
    const totalSeconds = duration * 60;
    setTimeLeft(totalSeconds);
    setIsLocked(false);
    setCurrentBet(null);
    setSelectedColor(null);
    setShowResult(false);
  }, [duration]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Round ended - show result
          const results: GameColor[] = ['red', 'green', 'violet'];
          const result = results[Math.floor(Math.random() * 3)];
          setLastResult(result);
          setShowResult(true);

          // Check if user won
          if (currentBet) {
            if (currentBet.color === result) {
              const multiplier = getColorMultiplier(result);
              const winAmount = currentBet.amount * multiplier;
              addWinnings(winAmount);
              toast({
                title: "🎉 You Won!",
                description: `Congratulations! You won ${formatCurrency(winAmount)}`,
              });
            } else {
              toast({
                title: "Better luck next time!",
                description: `The result was ${result}. Keep playing!`,
                variant: "destructive",
              });
            }
          }

          // Reset for next round
          setTimeout(() => {
            setShowResult(false);
            setCurrentBet(null);
            setSelectedColor(null);
            setIsLocked(false);
            setRoundNumber(prev => prev + 1);
          }, 3000);

          return duration * 60;
        }

        // Lock betting in last 10 seconds
        if (prev === 11 && !isLocked) {
          setIsLocked(true);
          toast({
            title: "Betting Closed",
            description: "Wait for the result...",
          });
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, currentBet, isLocked, addWinnings]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBetAmountChange = (delta: number) => {
    setBetAmount((prev) => Math.max(10, Math.min(balance, prev + delta)));
  };

  const handlePlaceBet = useCallback(() => {
    if (!selectedColor || isLocked || currentBet) return;

    if (placeBet(betAmount)) {
      setCurrentBet({ color: selectedColor, amount: betAmount });
      toast({
        title: "Bet Placed!",
        description: `${formatCurrency(betAmount)} on ${selectedColor}`,
      });
    }
  }, [selectedColor, isLocked, currentBet, betAmount, placeBet]);

  const presetAmounts = [50, 100, 200, 500, 1000];

  const recentResults = mockGameHistory.slice(0, 10);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">
            <span className="text-game-red">Color</span>
            <span className="text-game-green">Win</span>
          </h1>
          <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="font-semibold">{formatCurrency(balance)}</span>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Game Mode Selector */}
        <Tabs value={duration.toString()} onValueChange={(v) => setDuration(Number(v) as GameDuration)}>
          <TabsList className="grid w-full grid-cols-3 bg-secondary">
            <TabsTrigger value="1" className="gap-2">
              <Clock className="w-4 h-4" /> 1 Min
            </TabsTrigger>
            <TabsTrigger value="3" className="gap-2">
              <Clock className="w-4 h-4" /> 3 Min
            </TabsTrigger>
            <TabsTrigger value="5" className="gap-2">
              <Clock className="w-4 h-4" /> 5 Min
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Timer & Round Info */}
        <Card className="game-card overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <CardContent className="relative pt-6 text-center">
            <p className="text-muted-foreground text-sm mb-1">Round #{roundNumber}</p>
            <motion.div
              key={timeLeft}
              initial={{ scale: 1 }}
              animate={{ scale: timeLeft <= 10 ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.5 }}
              className={`text-5xl font-bold font-mono ${
                timeLeft <= 10 ? 'text-destructive animate-countdown' : 'text-foreground'
              }`}
            >
              {formatTime(timeLeft)}
            </motion.div>
            <p className={`text-sm mt-2 ${isLocked ? 'text-destructive' : 'text-primary'}`}>
              {isLocked ? '🔒 Betting Closed' : '🎲 Place Your Bet'}
            </p>
          </CardContent>
        </Card>

        {/* Result Display */}
        <AnimatePresence>
          {showResult && lastResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                className="text-center"
              >
                <div className={`w-32 h-32 rounded-full mx-auto mb-4 flex items-center justify-center ${
                  lastResult === 'red' ? 'bg-game-red' :
                  lastResult === 'green' ? 'bg-game-green' :
                  'bg-game-violet'
                }`}>
                  <Trophy className="w-16 h-16 text-white" />
                </div>
                <h2 className="text-3xl font-bold capitalize mb-2">{lastResult}</h2>
                <p className="text-muted-foreground">Round Result</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Color Selection */}
        <Card className="game-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Select Color</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {(['red', 'green', 'violet'] as GameColor[]).map((color) => (
                <motion.button
                  key={color}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => !isLocked && !currentBet && setSelectedColor(color)}
                  disabled={isLocked || !!currentBet}
                  className={`relative h-24 rounded-xl transition-all ${
                    color === 'red' ? 'bg-game-red' :
                    color === 'green' ? 'bg-game-green' :
                    'bg-game-violet'
                  } ${
                    selectedColor === color 
                      ? 'ring-4 ring-white scale-105' 
                      : 'opacity-80 hover:opacity-100'
                  } ${
                    (isLocked || currentBet) ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <span className="text-lg font-bold capitalize">{color}</span>
                    <span className="text-sm opacity-80">{getColorMultiplier(color)}x</span>
                  </div>
                  {currentBet?.color === color && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-background">✓</span>
                    </div>
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
            {/* Amount Adjuster */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleBetAmountChange(-50)}
                disabled={isLocked || !!currentBet || betAmount <= 10}
                className="w-12 h-12 rounded-full"
              >
                <Minus className="w-5 h-5" />
              </Button>
              <div className="text-3xl font-bold w-32 text-center">
                {formatCurrency(betAmount)}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleBetAmountChange(50)}
                disabled={isLocked || !!currentBet || betAmount >= balance}
                className="w-12 h-12 rounded-full"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            {/* Preset Amounts */}
            <div className="flex flex-wrap justify-center gap-2">
              {presetAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant={betAmount === amount ? "default" : "outline"}
                  size="sm"
                  onClick={() => !isLocked && !currentBet && setBetAmount(Math.min(amount, balance))}
                  disabled={isLocked || !!currentBet}
                  className={betAmount === amount ? 'bg-primary text-primary-foreground' : ''}
                >
                  {formatCurrency(amount)}
                </Button>
              ))}
            </div>

            {/* Place Bet Button */}
            <Button
              onClick={handlePlaceBet}
              disabled={!selectedColor || isLocked || !!currentBet || betAmount > balance}
              className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground glow-primary disabled:opacity-50"
            >
              {currentBet 
                ? `Bet Placed: ${formatCurrency(currentBet.amount)} on ${currentBet.color}`
                : selectedColor 
                  ? `Place Bet - ${formatCurrency(betAmount)}`
                  : 'Select a Color'
              }
            </Button>
          </CardContent>
        </Card>

        {/* Recent Results */}
        <Card className="game-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {recentResults.map((round, index) => (
                <motion.div
                  key={round.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    round.result === 'red' ? 'bg-game-red' :
                    round.result === 'green' ? 'bg-game-green' :
                    'bg-game-violet'
                  }`}
                >
                  <span className="text-sm font-bold text-white">
                    {round.result?.charAt(0).toUpperCase()}
                  </span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border">
        <div className="container max-w-lg mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <Link to="/dashboard" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
              <Wallet className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </Link>
            <Link to="/game" className="flex flex-col items-center gap-1 text-primary">
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
