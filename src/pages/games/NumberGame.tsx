import { useState, useEffect, useRef } from 'react';
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
import { GameModeIndicator } from '@/components/games/GameModeIndicator';
import { 
  Wallet, 
  History, 
  ArrowLeft,
  Crown,
  Sparkles,
  Home,
  ArrowDownCircle,
  ArrowUpCircle,
  User
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function NumberGame() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { balance, refetchBalance } = useWallet();
  const { placeBet, isPlacingBet, clearCurrentBet, fetchBetForRound } = useBets();

  const [selectedDuration, setSelectedDuration] = useState<DurationMinutes>(1);
  const gameType: GameType = 'number';
  const { currentRound, recentResults, isBettingOpen, isLocked } = useGameRounds({ 
    gameType, 
    durationMinutes: selectedDuration 
  });

  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [localBet, setLocalBet] = useState<{ number: number; amount: number } | null>(null);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  // Ref (not state) so StrictMode/dev double-effects can't re-trigger the result overlay.
  const lastProcessedRoundIdRef = useRef<string | null>(null);

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

  // Only trigger result display for NEW results (not on every recentResults change)
  useEffect(() => {
    if (recentResults.length === 0 || !recentResults[0].result) return;
    
    const latestRound = recentResults[0];
    // Skip if we already processed this round
    if (latestRound.id === lastProcessedRoundIdRef.current) return;
    
    const result = parseInt(latestRound.result);
    if (isNaN(result)) return;
    
    lastProcessedRoundIdRef.current = latestRound.id;
    console.log(`[NumberGame] Processing round result: ${latestRound.id} (round #${latestRound.round_number})`);

    setLastResult(result);
    setShowResult(true);

    if (localBet && localBet.number === result) {
      const winAmount = localBet.amount * 9;
      toast({
        title: "🎉 JACKPOT!",
        description: `Number ${result} hit! You won ₹${winAmount}`,
      });
      refetchBalance();
    } else if (localBet) {
      toast({
        title: "Not your number!",
        description: `Result was ${result}. Better luck next time!`,
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
  }, [recentResults, localBet, refetchBalance, clearCurrentBet]);

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


  const numberColors = [
    'from-violet-400 to-violet-600',
    'from-green-400 to-green-600',
    'from-red-400 to-red-600',
    'from-green-400 to-green-600',
    'from-red-400 to-red-600',
    'from-violet-400 to-violet-600',
    'from-red-400 to-red-600',
    'from-green-400 to-green-600',
    'from-red-400 to-red-600',
    'from-green-400 to-green-600',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f2e] via-background to-background pb-24">
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#1a1f4e] via-[#1e2761] to-[#1a1f4e] border-b border-primary/20">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 hover:bg-secondary/50 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <span className="text-2xl">🎱</span>
            Number Guess
          </h1>
          <div className="flex items-center gap-2 bg-secondary/80 px-3 py-1.5 rounded-full border border-primary/30">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="font-semibold">{formatCurrency(balance)}</span>
          </div>
          <GameModeIndicator />
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-4 space-y-4">
        <DurationSelector 
          selectedDuration={selectedDuration}
          onDurationChange={(dur) => {
            setSelectedDuration(dur);
            setLocalBet(null);
            clearCurrentBet();
            setSelectedNumber(null);
          }}
          disabled={false}
        />

        {!currentRound ? (
          <WaitingForRound gameName="Number Guess" />
        ) : (
          <>
            <Card className="game-card overflow-hidden border-0 bg-gradient-to-br from-secondary/80 to-secondary/40">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-transparent to-emerald-500/20" />
              <CardContent className="relative pt-6 text-center">
                <div className="flex justify-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-primary/20 rounded-full text-xs font-medium border border-primary/30">Round #{currentRound.round_number}</span>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium flex items-center gap-1 border border-emerald-500/30">
                    <Crown className="w-3 h-3" /> 10x Jackpot
                  </span>
                </div>
                <div className="text-4xl font-bold text-primary">
                  Round #{currentRound.round_number}
                </div>
                <p className="text-sm text-muted-foreground mt-2">Pick 0-9, win 10x your bet!</p>
              </CardContent>
            </Card>

            <Card className="game-card border-0 bg-gradient-to-br from-secondary/60 to-secondary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Crown className="w-4 h-4 text-emerald-500" />
                  Pick Your Lucky Number (10x payout)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <NumberBalls
                  selectedNumber={selectedNumber}
                  onSelect={(num) => canBet && setSelectedNumber(num)}
                  disabled={!canBet}
                  gameType="number"
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
                <Button onClick={handlePlaceBet} disabled={selectedNumber === null || !canBet || betAmount > balance || isPlacingBet} className="w-full h-14 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 text-white shadow-lg shadow-green-500/30">
                  {isPlacingBet ? 'Placing Bet...' : localBet ? `✓ ${formatCurrency(localBet.amount)} on ${localBet.number}` : selectedNumber !== null ? `Place Bet - ${formatCurrency(betAmount)}` : 'Pick a Number'}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        <AnimatePresence>
          {showResult && lastResult !== null && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md">
              <motion.div
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="text-center"
              >
                <motion.div
                  className={`w-40 h-40 rounded-full mx-auto mb-4 bg-gradient-to-br ${numberColors[lastResult]} flex items-center justify-center shadow-2xl`}
                  initial={{ scale: 0.92 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                >
                  <span className="text-7xl font-bold text-white">{lastResult}</span>
                </motion.div>
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                  <h2 className="text-3xl font-bold">Winning Number</h2>
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <Card className="game-card border-0 bg-gradient-to-br from-secondary/60 to-secondary/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><History className="w-4 h-4" /> Recent Results ({selectedDuration} min)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {recentResults.length > 0 ? recentResults.map((round) => {
                const num = parseInt(round.result || '0');
                return (
                  <div key={round.id} className={`w-12 h-12 rounded-full bg-gradient-to-br ${numberColors[num]} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <span className="text-lg font-bold text-white">{num}</span>
                  </div>
                );
              }) : (
                <p className="text-sm text-muted-foreground py-2">No results yet</p>
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
