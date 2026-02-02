import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Gamepad2, 
  Clock, 
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Play,
  Lock,
  XCircle,
  RefreshCw,
  Loader2,
  Bot,
  Power
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/formatters";
import { useAdminGameRounds, GameType } from "@/hooks/useAdminGameRounds";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const GAME_TYPES: { id: GameType; name: string; icon: string }[] = [
  { id: 'color', name: 'Color Prediction', icon: '🎨' },
  { id: 'parity', name: 'Fast Parity', icon: '⚡' },
  { id: 'bigsmall', name: 'Big/Small', icon: '📊' },
  { id: 'dice', name: 'Dice Roll', icon: '🎲' },
  { id: 'number', name: 'Number Guess', icon: '🔢' },
  { id: 'spin', name: 'Lucky Spin', icon: '🎰' },
];

const GAME_OPTIONS: Record<GameType, string[]> = {
  color: ['red', 'green', 'violet'],
  parity: ['odd', 'even'],
  bigsmall: ['big', 'small'],
  dice: ['1', '2', '3', '4', '5', '6', 'odd', 'even'],
  number: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  spin: ['red', 'blue', 'green', 'yellow', 'purple', 'orange'],
};

const MULTIPLIERS: Record<GameType, Record<string, number>> = {
  color: { red: 2, green: 2, violet: 4.5 },
  parity: { odd: 2, even: 2 },
  bigsmall: { big: 2, small: 2 },
  dice: { '1': 6, '2': 6, '3': 6, '4': 6, '5': 6, '6': 6, odd: 2, even: 2 },
  number: { '0': 9, '1': 9, '2': 9, '3': 9, '4': 9, '5': 9, '6': 9, '7': 9, '8': 9, '9': 9 },
  spin: { red: 2, blue: 2, green: 2, yellow: 2, purple: 2, orange: 2 },
};

function GameControlPanel({ gameType }: { gameType: GameType }) {
  const {
    activeRound,
    recentRounds,
    betStats,
    isLoading,
    isCreating,
    createRound,
    lockRound,
    setResult,
    cancelRound,
    refreshData
  } = useAdminGameRounds(gameType);

  const [selectedDuration, setSelectedDuration] = useState<string>("1");
  const [selectedResult, setSelectedResult] = useState<string | null>(null);

  const gameOptions = GAME_OPTIONS[gameType];
  const multipliers = MULTIPLIERS[gameType];

  // Calculate stats
  const totalBets = betStats.reduce((sum, s) => sum + s.count, 0);
  const totalAmount = betStats.reduce((sum, s) => sum + s.amount, 0);

  const getBetAmount = (choice: string) => {
    const stat = betStats.find(s => s.bet_choice === choice);
    return stat?.amount || 0;
  };

  const getBetCount = (choice: string) => {
    const stat = betStats.find(s => s.bet_choice === choice);
    return stat?.count || 0;
  };

  const calculatePayout = (choice: string) => {
    const amount = getBetAmount(choice);
    const multiplier = multipliers[choice] || 2;
    return amount * multiplier;
  };

  const calculateProfit = (choice: string) => {
    return totalAmount - calculatePayout(choice);
  };

  const getTimeLeft = () => {
    if (!activeRound) return 0;
    const endTime = new Date(activeRound.end_time).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((endTime - now) / 1000));
  };

  const formatTimeDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCreateRound = () => {
    createRound(parseInt(selectedDuration));
  };

  const handleSetResult = async () => {
    if (!selectedResult) return;
    await setResult(selectedResult);
    setSelectedResult(null);
  };

  const getOptionColor = (option: string) => {
    const colorMap: Record<string, string> = {
      red: 'bg-red-500',
      green: 'bg-green-500',
      violet: 'bg-violet-500',
      purple: 'bg-purple-500',
      blue: 'bg-blue-500',
      yellow: 'bg-yellow-500',
      orange: 'bg-orange-500',
      odd: 'bg-amber-500',
      even: 'bg-cyan-500',
      big: 'bg-emerald-500',
      small: 'bg-rose-500',
    };
    return colorMap[option] || 'bg-primary';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Round / Active Round */}
      {!activeRound ? (
        <Card className="game-card border-dashed border-2 border-primary/30">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Play className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No Active Round</h3>
                <p className="text-sm text-muted-foreground">Create a new round to start accepting bets</p>
              </div>
              <div className="flex items-center justify-center gap-4">
                <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Minute</SelectItem>
                    <SelectItem value="3">3 Minutes</SelectItem>
                    <SelectItem value="5">5 Minutes</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleCreateRound} disabled={isCreating} className="gap-2">
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Start Round
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="game-card border-primary/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-primary" />
                Round #{activeRound.round_number}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={activeRound.status === 'betting' ? 'default' : 'secondary'}
                  className={activeRound.status === 'betting' ? 'bg-game-green text-white animate-pulse' : 'bg-yellow-500 text-black'}
                >
                  {activeRound.status === 'betting' ? 'Betting Open' : 'Betting Locked'}
                </Badge>
                <Button variant="ghost" size="icon" onClick={refreshData}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Round Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-secondary rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-xl font-bold">{activeRound.duration} min</p>
              </div>
              <div className="p-4 bg-secondary rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Time Left</span>
                </div>
                <p className={`text-2xl font-bold ${getTimeLeft() <= 10 ? 'text-game-red' : ''}`}>
                  {formatTimeDisplay(getTimeLeft())}
                </p>
              </div>
              <div className="p-4 bg-secondary rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Total Bets</span>
                </div>
                <p className="text-xl font-bold">{totalBets}</p>
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {gameOptions.map((option) => {
                const profit = calculateProfit(option);
                const isSelected = selectedResult === option;
                
                return (
                  <div 
                    key={option}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-primary shadow-lg ring-2 ring-primary/50' 
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    onClick={() => setSelectedResult(option)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${getOptionColor(option)}`} />
                        <span className="font-semibold capitalize text-sm">{option}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bets</span>
                        <span>{getBetCount(option)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount</span>
                        <span>{formatCurrency(getBetAmount(option))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payout ({multipliers[option]}x)</span>
                        <span className="text-game-red">{formatCurrency(calculatePayout(option))}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-border">
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

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-secondary/50 rounded-lg border border-border">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-sm">
                      {selectedResult 
                        ? `Selected: ${selectedResult.toUpperCase()} (Profit: ${formatCurrency(calculateProfit(selectedResult))})` 
                        : 'Click an option above to select the result'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {activeRound.status === 'betting' && (
                  <Button 
                    variant="outline" 
                    onClick={lockRound}
                    className="gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Lock Betting
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={cancelRound}
                  className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSetResult}
                  disabled={!selectedResult}
                  className="gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Set Result
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Results */}
      <Card className="game-card">
        <CardHeader>
          <CardTitle className="text-lg">Recent Rounds</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRounds.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Round</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Bets</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRounds.map((round) => (
                  <TableRow key={round.id}>
                    <TableCell className="font-medium">#{round.round_number}</TableCell>
                    <TableCell>
                      <Badge variant={
                        round.status === 'completed' ? 'default' : 
                        round.status === 'cancelled' ? 'destructive' : 
                        'secondary'
                      }>
                        {round.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {round.result ? (
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${getOptionColor(round.result)}`} />
                          <span className="capitalize">{round.result}</span>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{round.total_bets || 0}</TableCell>
                    <TableCell className="font-medium text-primary">
                      {formatCurrency(round.total_amount || 0)}
                    </TableCell>
                    <TableCell>{round.duration} min</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No rounds yet. Create your first round above!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminGameControl() {
  const [selectedGame, setSelectedGame] = useState<GameType>('color');
  const [autoControllerEnabled, setAutoControllerEnabled] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  useEffect(() => {
    fetchAutoControllerSetting();
  }, []);

  const fetchAutoControllerSetting = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'auto_game_controller')
        .single();

      if (error) throw error;
      const value = data?.value as { enabled?: boolean } | null;
      setAutoControllerEnabled(value?.enabled ?? true);
    } catch (error) {
      console.error('Failed to fetch auto controller setting:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const toggleAutoController = async () => {
    setIsUpdatingSettings(true);
    const newValue = !autoControllerEnabled;

    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ value: { enabled: newValue } })
        .eq('key', 'auto_game_controller');

      if (error) throw error;

      setAutoControllerEnabled(newValue);
      toast({
        title: newValue ? "Auto Controller Enabled" : "Auto Controller Disabled",
        description: newValue 
          ? "Games will now run automatically 24/7 with profit-optimized results." 
          : "Automatic game rounds have been paused. You can manually control rounds below.",
      });
    } catch (error: any) {
      console.error('Failed to update auto controller setting:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update the setting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Game Control</h1>
        <p className="text-muted-foreground">Create rounds, set results, and manage betting periods</p>
      </div>

      {/* Auto Controller Toggle */}
      <Card className={`game-card border-2 transition-colors ${autoControllerEnabled ? 'border-green-500/50 bg-green-500/5' : 'border-muted'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${autoControllerEnabled ? 'bg-green-500/20' : 'bg-muted'}`}>
                <Bot className={`w-6 h-6 ${autoControllerEnabled ? 'text-green-500' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Auto Game Controller
                  {autoControllerEnabled && (
                    <Badge className="bg-green-500 text-white animate-pulse">
                      <Power className="w-3 h-3 mr-1" />
                      ACTIVE
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {autoControllerEnabled 
                    ? "Games are running automatically 24/7 with profit-optimized results"
                    : "Automatic game rounds are paused. Manual control is active."
                  }
                </CardDescription>
              </div>
            </div>
            {isLoadingSettings ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : (
              <Switch
                checked={autoControllerEnabled}
                onCheckedChange={toggleAutoController}
                disabled={isUpdatingSettings}
                className="data-[state=checked]:bg-green-500"
              />
            )}
          </div>
        </CardHeader>
        {autoControllerEnabled && (
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Runs every minute</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>All 6 game types</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Profit-maximized results</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Auto payouts</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Tabs value={selectedGame} onValueChange={(v) => setSelectedGame(v as GameType)}>
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 h-auto gap-1">
          {GAME_TYPES.map((game) => (
            <TabsTrigger 
              key={game.id} 
              value={game.id}
              className="flex items-center gap-1 text-xs py-2"
            >
              <span>{game.icon}</span>
              <span className="hidden sm:inline">{game.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {GAME_TYPES.map((game) => (
          <TabsContent key={game.id} value={game.id}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <GameControlPanel gameType={game.id} />
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
