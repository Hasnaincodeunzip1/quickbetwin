import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Gamepad2, 
  Clock, 
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  mockGameHistory, 
  formatCurrency, 
  formatTime,
  getColorClass,
  GameRound 
} from "@/lib/mockData";
import { toast } from "sonner";

type GameColor = 'red' | 'green' | 'violet';

interface LiveRound {
  id: string;
  roundNumber: number;
  duration: 1 | 3 | 5;
  status: 'betting' | 'locked';
  timeLeft: number;
  bets: {
    red: { count: number; amount: number };
    green: { count: number; amount: number };
    violet: { count: number; amount: number };
  };
}

export default function AdminGameControl() {
  const [gameHistory, setGameHistory] = useState<GameRound[]>(mockGameHistory);
  const [liveRound, setLiveRound] = useState<LiveRound>({
    id: 'live_1',
    roundNumber: 2024010151,
    duration: 1,
    status: 'betting',
    timeLeft: 45,
    bets: {
      red: { count: 45, amount: 12500 },
      green: { count: 52, amount: 15200 },
      violet: { count: 18, amount: 8300 },
    },
  });
  const [selectedResult, setSelectedResult] = useState<GameColor | null>(null);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveRound(prev => {
        if (prev.timeLeft <= 0) {
          return { ...prev, status: 'locked', timeLeft: 0 };
        }
        if (prev.timeLeft === 10) {
          return { ...prev, status: 'locked', timeLeft: prev.timeLeft - 1 };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const totalBets = liveRound.bets.red.count + liveRound.bets.green.count + liveRound.bets.violet.count;
  const totalAmount = liveRound.bets.red.amount + liveRound.bets.green.amount + liveRound.bets.violet.amount;

  const calculatePayout = (color: GameColor) => {
    const multiplier = color === 'violet' ? 4.5 : 2;
    return liveRound.bets[color].amount * multiplier;
  };

  const calculateProfit = (color: GameColor) => {
    const payout = calculatePayout(color);
    return totalAmount - payout;
  };

  const handleSetResult = () => {
    if (!selectedResult) {
      toast.error("Please select a result color");
      return;
    }

    // Add to history
    const newRound: GameRound = {
      id: liveRound.id,
      roundNumber: liveRound.roundNumber,
      duration: liveRound.duration,
      result: selectedResult,
      startTime: new Date(Date.now() - 60000).toISOString(),
      endTime: new Date().toISOString(),
      status: 'completed',
      totalBets: totalBets,
      totalAmount: totalAmount,
    };

    setGameHistory([newRound, ...gameHistory]);

    // Create new round
    setLiveRound({
      id: `live_${Date.now()}`,
      roundNumber: liveRound.roundNumber + 1,
      duration: 1,
      status: 'betting',
      timeLeft: 60,
      bets: {
        red: { count: 0, amount: 0 },
        green: { count: 0, amount: 0 },
        violet: { count: 0, amount: 0 },
      },
    });

    toast.success(`Round completed! Result: ${selectedResult.toUpperCase()}`);
    setSelectedResult(null);
  };

  const formatTimeDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Game Control</h1>
        <p className="text-muted-foreground">Manage live rounds and set results</p>
      </div>

      {/* Live Round Control */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="game-card border-primary/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-primary" />
                Live Round Control
              </CardTitle>
              <Badge 
                variant={liveRound.status === 'betting' ? 'default' : 'secondary'}
                className={liveRound.status === 'betting' ? 'bg-game-green text-white animate-pulse' : 'bg-yellow-500 text-black'}
              >
                {liveRound.status === 'betting' ? 'Betting Open' : 'Betting Locked'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Round Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-secondary rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Round #</p>
                <p className="text-xl font-bold text-foreground">{liveRound.roundNumber}</p>
              </div>
              <div className="p-4 bg-secondary rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Time Left</span>
                </div>
                <p className={`text-2xl font-bold ${liveRound.timeLeft <= 10 ? 'text-game-red' : 'text-foreground'}`}>
                  {formatTimeDisplay(liveRound.timeLeft)}
                </p>
              </div>
              <div className="p-4 bg-secondary rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Total Bets</span>
                </div>
                <p className="text-xl font-bold text-foreground">{totalBets}</p>
              </div>
              <div className="p-4 bg-secondary rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Total Amount</span>
                </div>
                <p className="text-xl font-bold text-primary">{formatCurrency(totalAmount)}</p>
              </div>
            </div>

            {/* Bet Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['red', 'green', 'violet'] as const).map((color) => {
                const profit = calculateProfit(color);
                const isSelected = selectedResult === color;
                
                return (
                  <div 
                    key={color}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? `border-${color === 'red' ? 'game-red' : color === 'green' ? 'game-green' : 'game-violet'} shadow-lg` 
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    onClick={() => setSelectedResult(color)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${getColorClass(color)}`} />
                        <span className="font-semibold text-foreground capitalize">{color}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bets</span>
                        <span className="text-foreground">{liveRound.bets[color].count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="text-foreground">{formatCurrency(liveRound.bets[color].amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payout</span>
                        <span className="text-game-red">{formatCurrency(calculatePayout(color))}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-border">
                        <span className="text-muted-foreground">Profit</span>
                        <span className={profit >= 0 ? 'text-game-green font-bold' : 'text-game-red font-bold'}>
                          {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Set Result Button */}
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="font-medium text-foreground">Set Result</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedResult 
                      ? `Selected: ${selectedResult.toUpperCase()} (Profit: ${formatCurrency(calculateProfit(selectedResult))})` 
                      : 'Click a color above to select the winning result'}
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleSetResult}
                disabled={!selectedResult || liveRound.status !== 'locked'}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Confirm Result
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Game History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="game-card">
          <CardHeader>
            <CardTitle>Recent Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Round</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Total Bets</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gameHistory.slice(0, 10).map((round) => (
                  <TableRow key={round.id}>
                    <TableCell className="font-medium text-foreground">
                      #{round.roundNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded ${getColorClass(round.result!)}`} />
                        <span className="capitalize text-foreground">{round.result}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{round.totalBets || '-'}</TableCell>
                    <TableCell className="text-primary font-medium">
                      {round.totalAmount ? formatCurrency(round.totalAmount) : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatTime(round.endTime)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
