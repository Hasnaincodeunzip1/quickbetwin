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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/formatters";
import { useAdminGameRounds, GameType, DurationMinutes } from "@/hooks/useAdminGameRounds";
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

const DURATION_OPTIONS = [
  { value: 60, label: '1 min' },
  { value: 120, label: '2 min' },
  { value: 180, label: '3 min' },
  { value: 300, label: '5 min' },
];

const DEFAULT_DURATIONS: Record<GameType, number> = {
  color: 180,
  parity: 120,
  bigsmall: 120,
  dice: 180,
  number: 180,
  spin: 120,
};

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

const DURATIONS: DurationMinutes[] = [1, 3, 5];

// Individual duration control panel
function DurationControlPanel({ gameType, durationMinutes }: { gameType: GameType; durationMinutes: DurationMinutes }) {
  const {
    activeRound,
    betStats,
    isLoading,
    isCreating,
    createRound,
    lockRound,
    setResult,
    cancelRound,
    refreshData
  } = useAdminGameRounds({ gameType, durationMinutes });

  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [autoStartNext, setAutoStartNext] = useState(false);

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

  // Live timer update + auto-start next round
  useEffect(() => {
    if (!activeRound) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const endTime = new Date(activeRound.end_time).getTime();
      const now = Date.now();
      setTimeLeft(Math.max(0, Math.floor((endTime - now) / 1000)));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeRound]);

  // Auto-start new round when current round ends and autoStartNext is enabled
  useEffect(() => {
    if (!autoStartNext || activeRound || isCreating) return;
    
    // Small delay before auto-starting
    const timeout = setTimeout(() => {
      createRound();
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, [autoStartNext, activeRound, isCreating, createRound]);

  const formatTimeDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
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
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className={`border ${activeRound ? 'border-primary/50' : 'border-dashed border-muted-foreground/30'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {durationMinutes} Minute
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeRound && (
              <Badge 
                variant={activeRound.status === 'betting' ? 'default' : 'secondary'}
                className={activeRound.status === 'betting' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'}
              >
                {activeRound.status === 'betting' ? 'Betting' : 'Locked'}
              </Badge>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auto-start toggle */}
        <div className="flex items-center justify-between py-2 px-3 bg-secondary/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Play className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs">Auto-start next round</span>
          </div>
          <Switch
            checked={autoStartNext}
            onCheckedChange={setAutoStartNext}
            className="h-5 w-9"
          />
        </div>

        {!activeRound ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              {autoStartNext ? 'Starting next round...' : 'No active round'}
            </p>
            <Button onClick={() => createRound()} disabled={isCreating} size="sm" className="gap-2">
              {isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              Start {durationMinutes} Min Round
            </Button>
          </div>
        ) : (
          <>
            {/* Round Info */}
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="p-2 bg-secondary rounded">
                <p className="text-muted-foreground text-xs">Round</p>
                <p className="font-bold">#{activeRound.round_number}</p>
              </div>
              <div className="p-2 bg-secondary rounded">
                <p className="text-muted-foreground text-xs">Time</p>
                <p className={`font-bold ${timeLeft <= 10 ? 'text-red-500' : ''}`}>
                  {formatTimeDisplay(timeLeft)}
                </p>
              </div>
              <div className="p-2 bg-secondary rounded">
                <p className="text-muted-foreground text-xs">Bets</p>
                <p className="font-bold">{totalBets} ({formatCurrency(totalAmount)})</p>
              </div>
            </div>

            {/* Bet Options - Compact Grid */}
            <div className="grid grid-cols-3 gap-2">
              {gameOptions.slice(0, 6).map((option) => {
                const betCount = getBetCount(option);
                const profit = totalBets > 0 ? calculateProfit(option) : 0;
                const isSelected = selectedResult === option;
                
                return (
                  <div 
                    key={option}
                    className={`p-2 rounded border cursor-pointer transition-all text-xs ${
                      isSelected 
                        ? 'border-primary ring-2 ring-primary/50' 
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    onClick={() => setSelectedResult(option)}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <div className={`w-3 h-3 rounded ${getOptionColor(option)}`} />
                      <span className="font-medium capitalize">{option}</span>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-primary ml-auto" />}
                    </div>
                    <div className="text-muted-foreground">
                      {betCount} bets • {totalBets > 0 ? (profit >= 0 ? '+' : '') + formatCurrency(profit) : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Show remaining options if more than 6 */}
            {gameOptions.length > 6 && (
              <div className="grid grid-cols-4 gap-1">
                {gameOptions.slice(6).map((option) => {
                  const isSelected = selectedResult === option;
                  return (
                    <div 
                      key={option}
                      className={`p-1.5 rounded border cursor-pointer text-xs text-center ${
                        isSelected ? 'border-primary bg-primary/10' : 'border-border'
                      }`}
                      onClick={() => setSelectedResult(option)}
                    >
                      <span className="capitalize">{option}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {activeRound.status === 'betting' && (
                <Button variant="outline" size="sm" onClick={lockRound} className="flex-1 gap-1">
                  <Lock className="w-3 h-3" />
                  Lock
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={cancelRound}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <XCircle className="w-3 h-3" />
              </Button>
              <Button 
                size="sm"
                onClick={handleSetResult}
                disabled={!selectedResult || activeRound.status !== 'locked'}
                className="flex-1 gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                Set Result
              </Button>
            </div>
            {activeRound.status === 'betting' && (
              <p className="text-xs text-muted-foreground text-center">
                Lock betting before setting result
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Game control panel showing all 3 durations
function GameControlPanel({ gameType }: { gameType: GameType }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DURATIONS.map((duration) => (
          <DurationControlPanel 
            key={duration} 
            gameType={gameType} 
            durationMinutes={duration} 
          />
        ))}
      </div>
    </div>
  );
}

export default function AdminGameControl() {
  const [selectedGame, setSelectedGame] = useState<GameType>('color');
  const [autoControllerEnabled, setAutoControllerEnabled] = useState(true);
  const [gameDurations, setGameDurations] = useState<Record<GameType, number>>(DEFAULT_DURATIONS);
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
      const value = data?.value as { enabled?: boolean; durations?: Record<string, number> } | null;
      setAutoControllerEnabled(value?.enabled ?? true);
      if (value?.durations) {
        setGameDurations({
          ...DEFAULT_DURATIONS,
          ...value.durations as Record<GameType, number>
        });
      }
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
        .update({ value: { enabled: newValue, durations: gameDurations } })
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

  const updateGameDuration = async (gameType: GameType, duration: number) => {
    const newDurations = { ...gameDurations, [gameType]: duration };
    setGameDurations(newDurations);

    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ value: { enabled: autoControllerEnabled, durations: newDurations } })
        .eq('key', 'auto_game_controller');

      if (error) throw error;

      toast({
        title: "Duration Updated",
        description: `${GAME_TYPES.find(g => g.id === gameType)?.name} round duration set to ${duration / 60} minute(s).`,
      });
    } catch (error: any) {
      console.error('Failed to update duration:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update the duration.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Game Control</h1>
        <p className="text-muted-foreground">Manage all game durations simultaneously</p>
      </div>

      {/* Auto Controller Toggle */}
      <Card className={`border-2 transition-colors ${autoControllerEnabled ? 'border-green-500/50 bg-green-500/5' : 'border-muted'}`}>
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
          <CardContent className="pt-0 space-y-4">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Runs every minute</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>All 6 games × 3 durations</span>
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

            {/* Round Duration Configuration */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Default Round Durations</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {GAME_TYPES.map((game) => (
                  <div key={game.id} className="space-y-1.5">
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <span>{game.icon}</span>
                      <span>{game.name}</span>
                    </label>
                    <Select
                      value={gameDurations[game.id].toString()}
                      onValueChange={(val) => updateGameDuration(game.id, parseInt(val))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value.toString()}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Manual Control - Only show when auto is disabled */}
      {!autoControllerEnabled && (
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
      )}

      {autoControllerEnabled && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Auto Controller is Active</p>
            <p className="text-sm">Disable auto mode above to manually control game rounds</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
