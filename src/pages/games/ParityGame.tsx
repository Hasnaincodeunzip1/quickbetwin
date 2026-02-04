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
import { 
  Wallet, 
  History, 
  ArrowLeft,
  Zap,
  TrendingUp,
  Home,
  ArrowDownCircle,
  ArrowUpCircle,
  User
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type ParityChoice = 'odd' | 'even';

export default function ParityGame() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { balance, refetchBalance } = useWallet();
  const { placeBet, isPlacingBet, clearCurrentBet, fetchBetForRound } = useBets();

  const [selectedDuration, setSelectedDuration] = useState<DurationMinutes>(1);
  const gameType: GameType = 'parity';
  const { currentRound, recentResults, timeLeft, isBettingOpen, isLocked } = useGameRounds({ 
    gameType, 
    durationMinutes: selectedDuration 
  });

  const [selectedChoice, setSelectedChoice] = useState<ParityChoice | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [localBet, setLocalBet] = useState<{ choice: ParityChoice; amount: number } | null>(null);
  const [lastResult, setLastResult] = useState<{ number: number; parity: ParityChoice } | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Sync bet state for the current round
  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      if (!currentRound) {
        clearCurrentBet();
        setLocalBet(null);
        setSelectedChoice(null);
        return;
      }

      clearCurrentBet();
      setLocalBet(null);
      setSelectedChoice(null);

      const bet = await fetchBetForRound(currentRound.id);
      if (cancelled || !bet) return;

      const choice = bet.bet_choice;
      if (choice === 'odd' || choice === 'even') {
        setSelectedChoice(choice);
        setBetAmount(bet.amount);
        setLocalBet({ choice, amount: bet.amount });
      }
    };

    sync();
    return () => { cancelled = true; };
  }, [currentRound?.id, fetchBetForRound, clearCurrentBet]);

  // Handle completed rounds
  useEffect(() => {
    if (recentResults.length > 0 && recentResults[0].result) {
      const result = recentResults[0].result;
      if (result !== 'odd' && result !== 'even') return;
      
      const parity = result as ParityChoice;
      setLastResult({ number: 0, parity });
      setShowResult(true);

      if (localBet && localBet.choice === parity) {
        const winAmount = localBet.amount * 1.95;
        toast({
          title: "🎉 You Won!",
          description: `Result is ${parity}! You won ₹${winAmount}`,
        });
        refetchBalance();
      } else if (localBet) {
        toast({
          title: "Better luck next time!",
          description: `Result was ${parity}. Keep playing!`,
          variant: "destructive",
        });
      }

      setTimeout(() => {
        setShowResult(false);
        setLocalBet(null);
        clearCurrentBet();
        setSelectedChoice(null);
        refetchBalance();
      }, 3000);
    }
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
    if (!selectedChoice || !isBettingOpen || localBet || isPlacingBet || !currentRound) return;

    if (betAmount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this bet.",
        variant: "destructive",
      });
      return;
    }

    const bet = await placeBet(currentRound.id, selectedChoice, betAmount);
    if (bet) {
      setLocalBet({ choice: selectedChoice, amount: betAmount });
      refetchBalance();
    }
  };

  const canBet = Boolean(isBettingOpen && !localBet && currentRound);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f2e] via-background to-background pb-24">
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#1a1f4e] via-[#1e2761] to-[#1a1f4e] border-b border-primary/20">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 hover:bg-secondary/50 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-500" />
            Fast Parity
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

        {!currentRound ? (
          <WaitingForRound gameName="Fast Parity" />
        ) : (
          <>
            <Card className="game-card overflow-hidden border-0 bg-gradient-to-br from-secondary/80 to-secondary/40">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-cyan-500/20" />
              <CardContent className="relative pt-6 text-center">
                <div className="flex justify-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-primary/20 rounded-full text-xs font-medium border border-primary/30">
                    Round #{currentRound.round_number}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${isLocked ? 'bg-destructive/20 text-destructive border-destructive/30' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'}`}>
                    {isLocked ? '🔒 Locked' : <><Zap className="w-3 h-3 inline" /> Open</>}
                  </span>
                </div>
                <motion.div
                  key={timeLeft}
                  initial={{ scale: 1 }}
                  animate={{ scale: timeLeft <= 5 ? [1, 1.15, 1] : 1 }}
                  className={`text-7xl font-bold font-mono ${
                    timeLeft <= 5 ? 'text-destructive' : 'text-primary'
                  }`}
                >
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </motion.div>
                <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    style={{ width: `${(timeLeft / (currentRound.duration * 60)) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="game-card border-0 bg-gradient-to-br from-secondary/60 to-secondary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-500" />
                  Odd or Even?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {(['odd', 'even'] as ParityChoice[]).map((choice) => (
                    <motion.button
                      key={choice}
                      whileHover={{ scale: canBet ? 1.02 : 1 }}
                      whileTap={{ scale: canBet ? 0.95 : 1 }}
                      onClick={() => canBet && setSelectedChoice(choice)}
                      disabled={!canBet}
                      className={`relative h-32 rounded-2xl transition-all overflow-hidden ${
                        choice === 'odd' 
                          ? 'bg-gradient-to-br from-cyan-400 to-cyan-600' 
                          : 'bg-gradient-to-br from-blue-500 to-blue-700'
                      } ${
                        selectedChoice === choice 
                          ? 'ring-4 ring-white scale-105 shadow-2xl' 
                          : 'opacity-85 hover:opacity-100'
                      } ${!canBet ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                        <span className="text-3xl font-bold capitalize mb-1">{choice}</span>
                        <span className="text-sm opacity-90 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">2x</span>
                      </div>
                      {localBet?.choice === choice && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
                        >
                          <span className="text-sm font-bold text-green-600">✓</span>
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>

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
                  disabled={!selectedChoice || !canBet || betAmount > balance || isPlacingBet}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 text-white shadow-lg shadow-cyan-500/30"
                >
                  {isPlacingBet ? 'Placing Bet...' : localBet ? `✓ ${formatCurrency(localBet.amount)} on ${localBet.choice}` : selectedChoice ? `Place Bet - ${formatCurrency(betAmount)}` : 'Select Odd or Even'}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        <AnimatePresence>
          {showResult && lastResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
            >
              <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="text-center">
                <motion.div 
                  className={`w-40 h-40 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-2xl ${
                    lastResult.parity === 'even' 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                      : 'bg-gradient-to-br from-cyan-400 to-cyan-500'
                  }`}
                  animate={{ rotateY: [0, 360] }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="text-4xl font-bold text-white capitalize">{lastResult.parity}</span>
                </motion.div>
                <h2 className="text-4xl font-bold capitalize mb-2">{lastResult.parity}</h2>
                <p className="text-muted-foreground text-lg">Round Result</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <Card className="game-card border-0 bg-gradient-to-br from-secondary/60 to-secondary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent Results ({selectedDuration} min)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {recentResults.length > 0 ? recentResults.filter(round => round.result === 'odd' || round.result === 'even').map((round, index) => {
                const parity = round.result as ParityChoice;
                return (
                  <motion.div
                    key={round.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`w-12 h-12 rounded-full flex flex-col items-center justify-center flex-shrink-0 shadow-lg ${
                      parity === 'even' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-cyan-400 to-cyan-500'
                    }`}
                  >
                    <span className="text-xs font-bold text-white capitalize">{parity[0].toUpperCase()}</span>
                  </motion.div>
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
