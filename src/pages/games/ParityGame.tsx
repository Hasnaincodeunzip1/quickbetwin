import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useGameRounds, GameType } from '@/hooks/useGameRounds';
import { useBets } from '@/hooks/useBets';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WaitingForRound } from '@/components/games/WaitingForRound';
import { 
  Wallet, 
  Gamepad2, 
  History, 
  Users, 
  ArrowLeft,
  Minus,
  Plus,
  Zap,
  TrendingUp
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type ParityChoice = 'odd' | 'even';

export default function ParityGame() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { balance, refetchBalance } = useWallet();
  const { placeBet, isPlacingBet, clearCurrentBet, fetchBetForRound } = useBets();

  const gameType: GameType = 'parity';
  const { currentRound, recentResults, timeLeft, isBettingOpen, isLocked } = useGameRounds({ gameType });

  const [selectedChoice, setSelectedChoice] = useState<ParityChoice | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [localBet, setLocalBet] = useState<{ choice: ParityChoice; amount: number } | null>(null);
  const [lastResult, setLastResult] = useState<{ number: number; parity: ParityChoice } | null>(null);
  const [showResult, setShowResult] = useState(false);

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

  useEffect(() => {
    if (currentRound) {
      fetchBetForRound(currentRound.id);
    } else {
      clearCurrentBet();
      setLocalBet(null);
      setSelectedChoice(null);
    }
  }, [currentRound, fetchBetForRound, clearCurrentBet]);

  // Handle completed rounds
  useEffect(() => {
    if (recentResults.length > 0 && recentResults[0].result) {
      const resultNum = parseInt(recentResults[0].result);
      const parity: ParityChoice = resultNum % 2 === 0 ? 'even' : 'odd';
      setLastResult({ number: resultNum, parity });
      setShowResult(true);

      if (localBet && localBet.choice === parity) {
        const winAmount = localBet.amount * 1.95;
        toast({
          title: "🎉 You Won!",
          description: `Number ${resultNum} is ${parity}! You won ₹${winAmount}`,
        });
        refetchBalance();
      } else if (localBet) {
        toast({
          title: "Better luck next time!",
          description: `Number ${resultNum} is ${parity}. Keep playing!`,
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

  const handleBetAmountChange = (delta: number) => {
    setBetAmount((prev) => Math.max(10, Math.min(balance, prev + delta)));
  };

  const handlePlaceBet = useCallback(async () => {
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
  }, [selectedChoice, isBettingOpen, localBet, isPlacingBet, betAmount, balance, currentRound, placeBet, refetchBalance]);

  const presetAmounts = [50, 100, 200, 500, 1000];
  const canBet = isBettingOpen && !localBet && currentRound;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 hover:bg-secondary rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-500" />
            Fast Parity
          </h1>
          <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="font-semibold">{formatCurrency(balance)}</span>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-4 space-y-4">
        {!currentRound ? (
          <WaitingForRound gameName="Fast Parity" />
        ) : (
          <>
            {/* Timer Card */}
            <Card className="game-card overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-cyan-500/20" />
              <CardContent className="relative pt-6 text-center">
                <div className="flex justify-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-secondary rounded-full text-xs font-medium">
                    Round #{currentRound.round_number}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${isLocked ? 'bg-destructive text-destructive-foreground' : 'bg-cyan-500/20 text-cyan-400'}`}>
                    {isLocked ? '🔒 Locked' : <><Zap className="w-3 h-3 inline" /> Open</>}
                  </span>
                </div>
                <motion.div
                  key={timeLeft}
                  initial={{ scale: 1 }}
                  animate={{ scale: timeLeft <= 5 ? [1, 1.15, 1] : 1 }}
                  className={`text-7xl font-bold font-mono ${
                    timeLeft <= 5 ? 'text-destructive' : 'text-foreground'
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

            {/* Choice Selection */}
            <Card className="game-card">
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
                          ? 'ring-4 ring-white scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]' 
                          : 'opacity-85 hover:opacity-100'
                      } ${!canBet ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                        <span className="text-3xl font-bold capitalize mb-1">{choice}</span>
                        <span className="text-sm opacity-90 bg-white/20 px-3 py-1 rounded-full">1.95x</span>
                      </div>
                      {localBet?.choice === choice && (
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
                  <Button variant="outline" size="icon" onClick={() => handleBetAmountChange(-50)} disabled={!canBet || betAmount <= 10} className="w-14 h-14 rounded-full">
                    <Minus className="w-6 h-6" />
                  </Button>
                  <div className="text-4xl font-bold w-36 text-center">{formatCurrency(betAmount)}</div>
                  <Button variant="outline" size="icon" onClick={() => handleBetAmountChange(50)} disabled={!canBet || betAmount >= balance} className="w-14 h-14 rounded-full">
                    <Plus className="w-6 h-6" />
                  </Button>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  {presetAmounts.map((amount) => (
                    <Button key={amount} variant={betAmount === amount ? "default" : "outline"} size="sm" onClick={() => canBet && setBetAmount(Math.min(amount, balance))} disabled={!canBet}>
                      {formatCurrency(amount)}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={handlePlaceBet}
                  disabled={!selectedChoice || !canBet || betAmount > balance || isPlacingBet}
                  className="w-full h-16 text-xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 text-white"
                >
                  {isPlacingBet ? 'Placing Bet...' : localBet ? `✓ ${formatCurrency(localBet.amount)} on ${localBet.choice}` : selectedChoice ? `Place Bet - ${formatCurrency(betAmount)}` : 'Select Odd or Even'}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Result Modal */}
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
                  className={`w-40 h-40 rounded-3xl mx-auto mb-4 flex items-center justify-center ${
                    lastResult.parity === 'even' 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-[0_0_40px_hsl(220_80%_50%/0.5)]' 
                      : 'bg-gradient-to-br from-cyan-400 to-cyan-500 shadow-[0_0_40px_hsl(180_80%_50%/0.5)]'
                  }`}
                  animate={{ rotateY: [0, 360] }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="text-5xl font-bold text-white">{lastResult.number}</span>
                </motion.div>
                <h2 className="text-4xl font-bold capitalize mb-2">{lastResult.parity}</h2>
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
              Recent Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {recentResults.length > 0 ? recentResults.map((round, index) => {
                const num = parseInt(round.result || '0');
                const parity = num % 2 === 0 ? 'even' : 'odd';
                return (
                  <motion.div
                    key={round.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                      parity === 'even' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-cyan-400 to-cyan-500'
                    }`}
                  >
                    <span className="text-sm font-bold text-white">{num}</span>
                  </motion.div>
                );
              }) : (
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
            <Link to="/game/parity" className="flex flex-col items-center gap-1 text-primary"><Gamepad2 className="w-5 h-5" /><span className="text-xs">Play</span></Link>
            <Link to="/history" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"><History className="w-5 h-5" /><span className="text-xs">History</span></Link>
            <Link to="/referral" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"><Users className="w-5 h-5" /><span className="text-xs">Referral</span></Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
