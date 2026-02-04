import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useGameRounds, GameType, DurationMinutes } from '@/hooks/useGameRounds';
import { useBets } from '@/hooks/useBets';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WaitingForRound } from '@/components/games/WaitingForRound';
import { DurationSelector } from '@/components/games/DurationSelector';
import { BetAmountInput } from '@/components/games/BetAmountInput';
import { NumberBalls } from '@/components/games/NumberBalls';
import { 
  Wallet, 
  History, 
  ArrowLeft,
  Target,
  Sparkles,
  Home,
  ArrowDownCircle,
  ArrowUpCircle,
  User
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const diceColors = [
  'from-red-400 to-red-600',
  'from-blue-400 to-blue-600',
  'from-green-400 to-green-600',
  'from-yellow-400 to-yellow-600',
  'from-purple-400 to-purple-600',
  'from-orange-400 to-orange-600',
];

export default function DiceGame() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { balance, refetchBalance } = useWallet();
  const { placeBet, isPlacingBet, clearCurrentBet, fetchBetForRound } = useBets();

  const [selectedDuration, setSelectedDuration] = useState<DurationMinutes>(1);
  const gameType: GameType = 'dice';
  const { currentRound, recentResults, timeLeft, isBettingOpen, isLocked, isTransitioning } = useGameRounds({ 
    gameType, 
    durationMinutes: selectedDuration 
  });

  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [localBet, setLocalBet] = useState<{ number: number; amount: number } | null>(null);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastProcessedRoundId, setLastProcessedRoundId] = useState<string | null>(null);

  // Sync bet state for the current round
  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      if (!currentRound) {
        clearCurrentBet();
        setLocalBet(null);
        setSelectedNumber(null);
        return;
      }

      clearCurrentBet();
      setLocalBet(null);
      setSelectedNumber(null);

      const bet = await fetchBetForRound(currentRound.id);
      if (cancelled || !bet) return;

      const num = parseInt(bet.bet_choice);
      if (!isNaN(num)) {
        setSelectedNumber(num);
        setBetAmount(bet.amount);
        setLocalBet({ number: num, amount: bet.amount });
      }
    };

    sync();
    return () => { cancelled = true; };
  }, [currentRound?.id, fetchBetForRound, clearCurrentBet]);

  // Handle completed rounds - only trigger for NEW results
  useEffect(() => {
    if (recentResults.length === 0 || !recentResults[0].result) return;
    
    const latestRound = recentResults[0];
    // Skip if we already processed this round
    if (latestRound.id === lastProcessedRoundId) return;
    
    const result = parseInt(latestRound.result);
    if (isNaN(result)) return;
    
    setLastProcessedRoundId(latestRound.id);
    setLastResult(result);
    setShowResult(true);

    if (localBet && localBet.number === result) {
      const winAmount = localBet.amount * 5.5;
      toast({
        title: "🎯 Perfect Hit!",
        description: `Dice landed on ${result}! You won ₹${winAmount}`,
      });
      refetchBalance();
    } else if (localBet) {
      toast({
        title: "Not this time!",
        description: `Dice landed on ${result}. Try again!`,
        variant: "destructive",
      });
    }

    const timeout = setTimeout(() => {
      setShowResult(false);
      setLocalBet(null);
      clearCurrentBet();
      setSelectedNumber(null);
      refetchBalance();
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [recentResults, localBet, refetchBalance, clearCurrentBet, lastProcessedRoundId]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const handlePlaceBet = async () => {
    if (selectedNumber === null || !isBettingOpen || localBet || isPlacingBet || !currentRound) return;
    
    if (betAmount > balance) {
      toast({ title: "Insufficient Balance", description: "You don't have enough balance for this bet.", variant: "destructive" });
      return;
    }

    const bet = await placeBet(currentRound.id, selectedNumber.toString(), betAmount);
    if (bet) {
      setLocalBet({ number: selectedNumber, amount: betAmount });
      refetchBalance();
    }
  };

  const canBet = Boolean(isBettingOpen && !localBet && currentRound);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f2e] via-background to-background pb-24">
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#1a1f4e] via-[#1e2761] to-[#1a1f4e] border-b border-primary/20">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 hover:bg-secondary/50 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            Dice Roll
          </h1>
          <div className="flex items-center gap-2 bg-secondary/80 px-3 py-1.5 rounded-full border border-primary/30">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="font-semibold">{formatCurrency(balance)}</span>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-4 space-y-4">
        <DurationSelector 
          selectedDuration={selectedDuration}
          onDurationChange={setSelectedDuration}
          disabled={!!localBet}
        />

        {!currentRound || isTransitioning ? (
          <WaitingForRound gameName="Dice Roll" isTransitioning={isTransitioning} />
        ) : (
          <>
            <Card className="game-card overflow-hidden border-0 bg-gradient-to-br from-secondary/80 to-secondary/40">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-pink-500/20" />
              <CardContent className="relative pt-6 text-center">
                <div className="flex justify-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-primary/20 rounded-full text-xs font-medium border border-primary/30">Round #{currentRound.round_number}</span>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium flex items-center gap-1 border border-purple-500/30">
                    <Sparkles className="w-3 h-3" /> 6x Payout
                  </span>
                </div>
                <motion.div key={timeLeft} initial={{ scale: 1 }} animate={{ scale: timeLeft <= 10 ? [1, 1.1, 1] : 1 }} className={`text-6xl font-bold font-mono ${timeLeft <= 10 ? 'text-destructive' : 'text-primary'}`}>
                  {formatTime(timeLeft)}
                </motion.div>
              </CardContent>
            </Card>

            <Card className="game-card border-0 bg-gradient-to-br from-secondary/60 to-secondary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-500" />
                  Pick Your Number (6x payout)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <NumberBalls
                  selectedNumber={selectedNumber}
                  onSelect={(num) => canBet && setSelectedNumber(num)}
                  disabled={!canBet}
                  gameType="dice"
                />
              </CardContent>
            </Card>

            <Card className="game-card border-0 bg-gradient-to-br from-secondary/60 to-secondary/30">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Bet Amount</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <BetAmountInput
                  value={betAmount}
                  onChange={setBetAmount}
                  maxBalance={balance}
                  disabled={!canBet}
                />
                <Button onClick={handlePlaceBet} disabled={selectedNumber === null || !canBet || betAmount > balance || isPlacingBet} className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white shadow-lg shadow-purple-500/30">
                  {isPlacingBet ? 'Placing Bet...' : localBet ? `✓ ${formatCurrency(localBet.amount)} on ${localBet.number}` : selectedNumber !== null ? `Place Bet - ${formatCurrency(betAmount)}` : 'Pick a Number'}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        <AnimatePresence>
          {showResult && lastResult && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md">
              <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="text-center">
                <motion.div className={`w-40 h-40 rounded-3xl mx-auto mb-4 bg-gradient-to-br ${diceColors[lastResult - 1]} flex items-center justify-center shadow-2xl`} animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                  <span className="text-8xl">{diceEmojis[lastResult - 1]}</span>
                </motion.div>
                <h2 className="text-4xl font-bold mb-2">Rolled: {lastResult}</h2>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <Card className="game-card border-0 bg-gradient-to-br from-secondary/60 to-secondary/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><History className="w-4 h-4" /> Recent Rolls ({selectedDuration} min)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {recentResults.length > 0 ? recentResults.map((round) => {
                const num = parseInt(round.result || '1');
                return (
                  <div key={round.id} className={`w-12 h-12 rounded-full bg-gradient-to-br ${diceColors[num - 1]} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <span className="text-2xl">{diceEmojis[num - 1]}</span>
                  </div>
                );
              }) : (
                <p className="text-sm text-muted-foreground py-2">No rolls yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

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
