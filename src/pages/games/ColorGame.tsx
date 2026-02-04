import { useState, useEffect } from 'react';
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
import { BetAmountInput } from '@/components/games/BetAmountInput';
import { ColorBettingCards } from '@/components/games/ColorBettingCards';
import { NumberBalls } from '@/components/games/NumberBalls';
import { 
  Wallet, 
  Gamepad2, 
  History, 
  Trophy,
  Sparkles,
  Home,
  ArrowDownCircle,
  ArrowUpCircle,
  User
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
            <Card className="game-card overflow-hidden border-0 bg-gradient-to-br from-secondary/80 to-secondary/40">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
              <CardContent className="relative pt-6 text-center">
                <div className="flex justify-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-primary/20 rounded-full text-xs font-medium border border-primary/30">
                    Round #{currentRound.round_number}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${isLocked ? 'bg-destructive/20 text-destructive border border-destructive/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                    {isLocked ? '🔒 Locked' : '🎲 Betting Open'}
                  </span>
                </div>
                <motion.div
                  key={timeLeft}
                  initial={{ scale: 1 }}
                  animate={{ scale: timeLeft <= 10 ? [1, 1.1, 1] : 1 }}
                  transition={{ duration: 0.5 }}
                  className={`text-6xl font-bold font-mono ${
                    timeLeft <= 10 ? 'text-destructive' : 'text-primary'
                  }`}
                >
                  {formatTime(timeLeft)}
                </motion.div>
                {timeLeft <= 10 && timeLeft > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3"
                  >
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-destructive to-orange-500"
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: timeLeft, ease: 'linear' }}
                      />
                    </div>
                    <p className="text-xs text-destructive mt-1 animate-pulse">Hurry! Place your bet!</p>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Color Selection - New Design */}
            <Card className="game-card border-0 bg-gradient-to-br from-secondary/60 to-secondary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Select Color
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ColorBettingCards
                  selectedColor={selectedColor}
                  onSelect={(color) => canBet && setSelectedColor(color)}
                  disabled={!canBet}
                  localBet={localBet}
                />
              </CardContent>
            </Card>

            {/* Number Balls Selection */}
            <Card className="game-card border-0 bg-gradient-to-br from-secondary/60 to-secondary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="text-primary">🎱</span>
                  Pick Your Lucky Number (10x)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <NumberBalls
                  selectedNumber={null}
                  onSelect={() => {}}
                  disabled={true}
                  gameType="number"
                />
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Numbers available in Number Game
                </p>
              </CardContent>
            </Card>

            {/* Bet Amount - New Component with Manual Input */}
            <Card className="game-card border-0 bg-gradient-to-br from-secondary/60 to-secondary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Bet Amount</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <BetAmountInput
                  value={betAmount}
                  onChange={setBetAmount}
                  maxBalance={balance}
                  disabled={!canBet}
                />

                <Button
                  onClick={handlePlaceBet}
                  disabled={!selectedColor || !canBet || betAmount > balance || isPlacingBet}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary via-primary to-amber-500 hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-50 disabled:shadow-none"
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
        <Card className="game-card border-0 bg-gradient-to-br from-secondary/60 to-secondary/30">
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
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold shadow-lg ${
                      round.result === 'red' ? 'bg-gradient-to-br from-red-400 to-red-600' :
                      round.result === 'green' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                      'bg-gradient-to-br from-violet-400 to-violet-600'
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

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0f2e] to-[#1a1f4e] border-t border-primary/20">
        <div className="container max-w-lg mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <Link to="/dashboard" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <Home className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </Link>
            <Link to="/wallet?action=deposit" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowDownCircle className="w-5 h-5 text-game-green" />
              <span className="text-xs">Deposit</span>
            </Link>
            <Link to="/wallet?action=withdraw" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowUpCircle className="w-5 h-5 text-game-red" />
              <span className="text-xs">Withdraw</span>
            </Link>
            <Link to="/profile" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <User className="w-5 h-5" />
              <span className="text-xs">Profile</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
