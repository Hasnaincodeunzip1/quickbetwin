import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useGameRounds, GameType, DurationMinutes } from '@/hooks/useGameRounds';
import { useBets } from '@/hooks/useBets';
import { formatCurrency, getColorMultiplier } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WaitingForRound } from '@/components/games/WaitingForRound';
import { DurationSelector } from '@/components/games/DurationSelector';
import { 
  Wallet, 
  Gamepad2, 
  History, 
  Users, 
  Trophy,
  Minus,
  Plus,
  Sparkles
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type GameColor = 'red' | 'green' | 'violet';

export default function ColorGame() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { balance, refetchBalance } = useWallet();
  const { placeBet, currentBet, isPlacingBet, clearCurrentBet, fetchBetForRound } = useBets();
  
  const [selectedDuration, setSelectedDuration] = useState<DurationMinutes>(1);
  const gameType: GameType = 'color';
  const { currentRound, recentResults, timeLeft, isBettingOpen, isLocked } = useGameRounds({ 
    gameType, 
    durationMinutes: selectedDuration 
  });

  const [selectedColor, setSelectedColor] = useState<GameColor | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [localBet, setLocalBet] = useState<{ color: GameColor; amount: number } | null>(null);
  const [lastResult, setLastResult] = useState<GameColor | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Sync bet state for the current round (prevents controls staying disabled across rounds)
  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      if (!currentRound) {
        clearCurrentBet();
        setLocalBet(null);
        setSelectedColor(null);
        return;
      }

      // Always reset local state on round change, then re-hydrate if a bet exists for this round
      clearCurrentBet();
      setLocalBet(null);
      setSelectedColor(null);

      const bet = await fetchBetForRound(currentRound.id);
      if (cancelled || !bet) return;

      const choice = bet.bet_choice;
      if (choice === 'red' || choice === 'green' || choice === 'violet') {
        setSelectedColor(choice);
        setBetAmount(bet.amount);
        setLocalBet({ color: choice, amount: bet.amount });
      }
    };

    sync();
    return () => {
      cancelled = true;
    };
  }, [currentRound?.id, fetchBetForRound, clearCurrentBet]);

  // Handle completed rounds
  useEffect(() => {
    if (recentResults.length > 0 && recentResults[0].result) {
      const result = recentResults[0].result;
      // Validate that the result is a valid GameColor
      if (result !== 'red' && result !== 'green' && result !== 'violet') {
        return;
      }
      const latestResult = result as GameColor;
      setLastResult(latestResult);
      setShowResult(true);
      
      if (localBet && localBet.color === latestResult) {
        const multiplier = getColorMultiplier(latestResult);
        const winAmount = localBet.amount * multiplier;
        toast({
          title: "🎉 You Won!",
          description: `Congratulations! You won ₹${winAmount}`,
        });
        refetchBalance();
      } else if (localBet) {
        toast({
          title: "Better luck next time!",
          description: `The result was ${latestResult}. Keep playing!`,
          variant: "destructive",
        });
      }

      setTimeout(() => {
        setShowResult(false);
        setLocalBet(null);
        clearCurrentBet();
        setSelectedColor(null);
        refetchBalance();
      }, 3000);
    }
  }, [recentResults, localBet, refetchBalance, clearCurrentBet]);

  // Auth redirect - must be after all hooks
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading state while auth is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBetAmountChange = (delta: number) => {
    setBetAmount((prev) => Math.max(10, Math.min(balance, prev + delta)));
  };

  const handlePlaceBet = async () => {
    if (!selectedColor || !isBettingOpen || localBet || isPlacingBet || !currentRound) return;

    if (betAmount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this bet.",
        variant: "destructive",
      });
      return;
    }

    const bet = await placeBet(currentRound.id, selectedColor, betAmount);
    if (bet) {
      setLocalBet({ color: selectedColor, amount: betAmount });
      refetchBalance();
    }
  };

  const presetAmounts = [50, 100, 200, 500, 1000];

  const colorConfig = {
    red: { bg: 'bg-game-red', glow: 'shadow-[0_0_30px_hsl(0_80%_55%/0.4)]', label: 'Red' },
    green: { bg: 'bg-game-green', glow: 'shadow-[0_0_30px_hsl(142_76%_45%/0.4)]', label: 'Green' },
    violet: { bg: 'bg-game-violet', glow: 'shadow-[0_0_30px_hsl(270_80%_55%/0.4)]', label: 'Violet' },
  };

  const canBet = Boolean(isBettingOpen && !localBet && currentRound);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f2e] via-background to-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#1a1f4e] via-[#1e2761] to-[#1a1f4e] border-b border-primary/20">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-1">
            <span className="text-game-green">Gen</span>
            <span className="text-primary">Z</span>
            <span className="text-game-red">WIN</span>
          </h1>
          <div className="flex items-center gap-2 bg-secondary/80 px-3 py-1.5 rounded-full border border-primary/30">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="font-semibold">{formatCurrency(balance)}</span>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Duration Selector */}
        <DurationSelector 
          selectedDuration={selectedDuration}
          onDurationChange={setSelectedDuration}
          disabled={!!localBet}
        />

        {/* Waiting State or Timer */}
        {!currentRound ? (
          <WaitingForRound gameName="Color Prediction" />
        ) : (
          <>
            {/* Timer & Round Info */}
            <Card className="game-card overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
              <CardContent className="relative pt-6 text-center">
                <div className="flex justify-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-secondary rounded-full text-xs font-medium">
                    Round #{currentRound.round_number}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${isLocked ? 'bg-destructive text-destructive-foreground' : 'bg-primary/20 text-primary'}`}>
                    {isLocked ? '🔒 Locked' : '🎲 Open'}
                  </span>
                </div>
                <motion.div
                  key={timeLeft}
                  initial={{ scale: 1 }}
                  animate={{ scale: timeLeft <= 10 ? [1, 1.1, 1] : 1 }}
                  transition={{ duration: 0.5 }}
                  className={`text-6xl font-bold font-mono ${
                    timeLeft <= 10 ? 'text-destructive' : 'text-foreground'
                  }`}
                >
                  {formatTime(timeLeft)}
                </motion.div>
                {timeLeft <= 10 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2"
                  >
                    <div className="h-1 bg-secondary rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-destructive"
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: timeLeft, ease: 'linear' }}
                      />
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Color Selection */}
            <Card className="game-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Select Color
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {(['red', 'green', 'violet'] as GameColor[]).map((color) => (
                    <motion.button
                      key={color}
                      whileHover={{ scale: canBet ? 1.02 : 1 }}
                      whileTap={{ scale: canBet ? 0.95 : 1 }}
                      onClick={() => canBet && setSelectedColor(color)}
                      disabled={!canBet}
                      className={`relative h-28 rounded-2xl transition-all overflow-hidden ${colorConfig[color].bg} ${
                        selectedColor === color 
                          ? `ring-4 ring-white ${colorConfig[color].glow} scale-105` 
                          : 'opacity-80 hover:opacity-100'
                      } ${!canBet ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                        <span className="text-xl font-bold capitalize">{color}</span>
                        <span className="text-sm opacity-90 bg-white/20 px-2 py-0.5 rounded-full mt-1">
                          {getColorMultiplier(color)}x
                        </span>
                      </div>
                      {localBet?.color === color && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
                        >
                          <span className="text-sm font-bold text-background">✓</span>
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
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleBetAmountChange(-50)}
                    disabled={!canBet || betAmount <= 10}
                    className="w-14 h-14 rounded-full text-lg"
                  >
                    <Minus className="w-6 h-6" />
                  </Button>
                  <div className="text-4xl font-bold w-36 text-center">
                    {formatCurrency(betAmount)}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleBetAmountChange(50)}
                    disabled={!canBet || betAmount >= balance}
                    className="w-14 h-14 rounded-full text-lg"
                  >
                    <Plus className="w-6 h-6" />
                  </Button>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  {presetAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant={betAmount === amount ? "default" : "outline"}
                      size="sm"
                      onClick={() => canBet && setBetAmount(Math.min(amount, balance))}
                      disabled={!canBet}
                      className={`px-4 ${betAmount === amount ? 'bg-primary text-primary-foreground' : ''}`}
                    >
                      {formatCurrency(amount)}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={handlePlaceBet}
                  disabled={!selectedColor || !canBet || betAmount > balance || isPlacingBet}
                  className="w-full h-16 text-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground glow-primary disabled:opacity-50"
                >
                  {isPlacingBet 
                    ? 'Placing Bet...'
                    : localBet 
                      ? `✓ ${formatCurrency(localBet.amount)} on ${localBet.color}`
                      : selectedColor 
                        ? `Place Bet - ${formatCurrency(betAmount)}`
                        : 'Select a Color'
                  }
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Result Display */}
        <AnimatePresence>
          {showResult && lastResult && colorConfig[lastResult] && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
            >
              <motion.div
                initial={{ y: 50, rotateY: 0 }}
                animate={{ y: 0, rotateY: 360 }}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                <motion.div 
                  className={`w-36 h-36 rounded-full mx-auto mb-4 flex items-center justify-center ${colorConfig[lastResult].bg} ${colorConfig[lastResult].glow}`}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <Trophy className="w-16 h-16 text-white" />
                </motion.div>
                <h2 className="text-4xl font-bold capitalize mb-2">{lastResult}</h2>
                <p className="text-muted-foreground text-lg">Round Result</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Results */}
        <Card className="game-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent Results ({selectedDuration} min)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {recentResults.length > 0 ? (
                recentResults.map((round, index) => (
                  <motion.div
                    key={round.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold ${
                      round.result === 'red' ? 'bg-game-red' :
                      round.result === 'green' ? 'bg-game-green' :
                      'bg-game-violet'
                    }`}
                  >
                    {round.result?.[0].toUpperCase()}
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-2">No results yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border">
        <div className="container max-w-lg mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <Link to="/dashboard" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
              <Wallet className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </Link>
            <Link to="/game/color" className="flex flex-col items-center gap-1 text-primary">
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
