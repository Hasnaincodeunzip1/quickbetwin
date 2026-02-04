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
  Dice1, Dice2, Dice3, Dice4, Dice5, Dice6,
  ArrowUp,
  ArrowDown,
  Home,
  ArrowDownCircle,
  ArrowUpCircle,
  User
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type SizeChoice = 'big' | 'small';

const DiceIcon = ({ value }: { value: number }) => {
  const icons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
  const Icon = icons[value - 1] || Dice1;
  return <Icon className="w-10 h-10" />;
};

export default function BigSmallGame() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { balance, refetchBalance } = useWallet();
  const { placeBet, isPlacingBet, clearCurrentBet, fetchBetForRound } = useBets();

  const [selectedDuration, setSelectedDuration] = useState<DurationMinutes>(1);
  const gameType: GameType = 'bigsmall';
  const { currentRound, recentResults, timeLeft, isBettingOpen, isLocked, isTransitioning } = useGameRounds({ 
    gameType, 
    durationMinutes: selectedDuration 
  });

  const [selectedChoice, setSelectedChoice] = useState<SizeChoice | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [localBet, setLocalBet] = useState<{ choice: SizeChoice; amount: number } | null>(null);
  const [lastResult, setLastResult] = useState<{ dice: number[]; total: number; size: SizeChoice } | null>(null);
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
      if (choice === 'big' || choice === 'small') {
        setSelectedChoice(choice);
        setBetAmount(bet.amount);
        setLocalBet({ choice, amount: bet.amount });
      }
    };

    sync();
    return () => { cancelled = true; };
  }, [currentRound?.id, fetchBetForRound, clearCurrentBet]);

  useEffect(() => {
    if (recentResults.length > 0 && recentResults[0].result) {
      const resultStr = recentResults[0].result;
      const dice = resultStr.split(',').map(Number);
      const total = dice.reduce((a, b) => a + b, 0);
      const size: SizeChoice = total >= 11 ? 'big' : 'small';
      setLastResult({ dice, total, size });
      setShowResult(true);

      if (localBet && localBet.choice === size) {
        const winAmount = localBet.amount * 1.95;
        toast({
          title: "🎉 You Won!",
          description: `Total ${total} is ${size}! You won ₹${winAmount}`,
        });
        refetchBalance();
      } else if (localBet) {
        toast({
          title: "Better luck next time!",
          description: `Total ${total} is ${size}. Keep playing!`,
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
      toast({ title: "Insufficient Balance", description: "You don't have enough balance for this bet.", variant: "destructive" });
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
          <h1 className="text-lg font-bold flex items-center gap-2">🎲 Big / Small</h1>
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
          <WaitingForRound gameName="Big/Small" isTransitioning={isTransitioning} />
        ) : (
          <>
            <Card className="game-card overflow-hidden border-0 bg-gradient-to-br from-secondary/80 to-secondary/40">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-transparent to-yellow-500/20" />
              <CardContent className="relative pt-6 text-center">
                <div className="flex justify-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-primary/20 rounded-full text-xs font-medium border border-primary/30">Round #{currentRound.round_number}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${isLocked ? 'bg-destructive/20 text-destructive border-destructive/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'}`}>
                    {isLocked ? '🔒 Locked' : '🎲 Open'}
                  </span>
                </div>
                <motion.div key={timeLeft} initial={{ scale: 1 }} animate={{ scale: timeLeft <= 5 ? [1, 1.15, 1] : 1 }} className={`text-7xl font-bold font-mono ${timeLeft <= 5 ? 'text-destructive' : 'text-primary'}`}>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </motion.div>
                <div className="flex justify-center gap-4 mt-3 text-sm">
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full border border-orange-500/30">Big: 11-18</span>
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30">Small: 3-10</span>
                </div>
              </CardContent>
            </Card>

            <Card className="game-card border-0 bg-gradient-to-br from-secondary/60 to-secondary/30">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Big or Small?</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {(['big', 'small'] as SizeChoice[]).map((choice) => (
                    <motion.button
                      key={choice}
                      whileHover={{ scale: canBet ? 1.02 : 1 }}
                      whileTap={{ scale: canBet ? 0.95 : 1 }}
                      onClick={() => canBet && setSelectedChoice(choice)}
                      disabled={!canBet}
                      className={`relative h-32 rounded-2xl transition-all overflow-hidden ${choice === 'big' ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 'bg-gradient-to-br from-yellow-400 to-yellow-600'} ${selectedChoice === choice ? 'ring-4 ring-white scale-105 shadow-2xl' : 'opacity-85 hover:opacity-100'} ${!canBet ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                        {choice === 'big' ? <ArrowUp className="w-8 h-8 mb-1" /> : <ArrowDown className="w-8 h-8 mb-1" />}
                        <span className="text-2xl font-bold capitalize">{choice}</span>
                        <span className="text-xs opacity-90 mt-1">{choice === 'big' ? '11-18' : '3-10'}</span>
                        <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full mt-1 backdrop-blur-sm">2x</span>
                      </div>
                      {localBet?.choice === choice && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-sm font-bold text-green-600">✓</span>
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
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
                <Button onClick={handlePlaceBet} disabled={!selectedChoice || !canBet || betAmount > balance || isPlacingBet} className="w-full h-14 text-lg font-bold bg-gradient-to-r from-orange-500 to-yellow-500 hover:opacity-90 text-white shadow-lg shadow-orange-500/30">
                  {isPlacingBet ? 'Placing Bet...' : localBet ? `✓ ${formatCurrency(localBet.amount)} on ${localBet.choice}` : selectedChoice ? `Place Bet - ${formatCurrency(betAmount)}` : 'Select Big or Small'}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        <AnimatePresence>
          {showResult && lastResult && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md">
              <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="text-center">
                <div className="flex justify-center gap-4 mb-6">
                  {lastResult.dice.map((d, i) => (
                    <motion.div key={i} initial={{ rotateX: 0, y: -50 }} animate={{ rotateX: 360, y: 0 }} transition={{ delay: i * 0.2, duration: 0.5 }} className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center text-background shadow-xl">
                      <DiceIcon value={d} />
                    </motion.div>
                  ))}
                </div>
                <motion.h2 className="text-5xl font-bold mb-2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 }}>{lastResult.total}</motion.h2>
                <motion.p className={`text-2xl font-bold ${lastResult.size === 'big' ? 'text-orange-500' : 'text-yellow-500'}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>{lastResult.size.toUpperCase()}</motion.p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <Card className="game-card border-0 bg-gradient-to-br from-secondary/60 to-secondary/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><History className="w-4 h-4" /> Recent Results ({selectedDuration} min)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {recentResults.length > 0 ? recentResults.map((round, index) => {
                const dice = round.result?.split(',').map(Number) || [];
                const total = dice.reduce((a, b) => a + b, 0);
                const size = total >= 11 ? 'big' : 'small';
                return (
                  <motion.div key={round.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className={`w-12 h-12 rounded-full flex flex-col items-center justify-center flex-shrink-0 shadow-lg ${size === 'big' ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 'bg-gradient-to-br from-yellow-400 to-yellow-600'}`}>
                    <span className="text-sm font-bold text-white">{total}</span>
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
