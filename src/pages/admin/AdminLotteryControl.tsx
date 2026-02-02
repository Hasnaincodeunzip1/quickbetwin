import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Ticket, 
  Crown, 
  Users, 
  Gift,
  CheckCircle2,
  Loader2,
  Trophy,
  Plus,
  Search,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type VipLevel = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

interface LotteryTicket {
  id: string;
  user_id: string;
  ticket_number: string;
  vip_level: VipLevel;
  is_used: boolean;
  created_at: string;
  earned_at_referral_count: number;
  user_name?: string;
}

interface LotteryDraw {
  id: string;
  name: string;
  vip_level: VipLevel;
  prize_amount: number;
  winner_user_id: string | null;
  winner_ticket_id: string | null;
  status: string;
  draw_date: string | null;
  created_at: string;
}

const VIP_LEVELS: { value: VipLevel; label: string; icon: string; color: string }[] = [
  { value: 'bronze', label: 'Bronze', icon: '🥉', color: 'bg-amber-600' },
  { value: 'silver', label: 'Silver', icon: '🥈', color: 'bg-gray-400' },
  { value: 'gold', label: 'Gold', icon: '🥇', color: 'bg-yellow-500' },
  { value: 'platinum', label: 'Platinum', icon: '💎', color: 'bg-cyan-400' },
  { value: 'diamond', label: 'Diamond', icon: '👑', color: 'bg-purple-500' },
];

export default function AdminLotteryControl() {
  const [activeTab, setActiveTab] = useState<VipLevel>('bronze');
  const [tickets, setTickets] = useState<LotteryTicket[]>([]);
  const [draws, setDraws] = useState<LotteryDraw[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create draw form
  const [showCreateDraw, setShowCreateDraw] = useState(false);
  const [newDrawName, setNewDrawName] = useState('');
  const [newDrawPrize, setNewDrawPrize] = useState('');
  const [newDrawVipLevel, setNewDrawVipLevel] = useState<VipLevel>('bronze');
  const [isCreatingDraw, setIsCreatingDraw] = useState(false);

  // Select winner
  const [selectedDraw, setSelectedDraw] = useState<LotteryDraw | null>(null);
  const [selectedWinnerTicket, setSelectedWinnerTicket] = useState<string | null>(null);
  const [isSettingWinner, setIsSettingWinner] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch tickets for current VIP level with user names
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('lottery_tickets')
        .select('*')
        .eq('vip_level', activeTab)
        .eq('is_used', false)
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;

      // Get user names for tickets
      const userIds = [...new Set(ticketsData?.map(t => t.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      const ticketsWithNames = (ticketsData || []).map(ticket => ({
        ...ticket,
        user_name: profiles?.find(p => p.id === ticket.user_id)?.name || 'Unknown'
      }));

      setTickets(ticketsWithNames);

      // Fetch draws for current VIP level
      const { data: drawsData, error: drawsError } = await supabase
        .from('lottery_draws')
        .select('*')
        .eq('vip_level', activeTab)
        .order('created_at', { ascending: false });

      if (drawsError) throw drawsError;
      setDraws(drawsData || []);
    } catch (error) {
      console.error('Error fetching lottery data:', error);
      toast({
        title: "Error",
        description: "Failed to load lottery data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createDraw = async () => {
    if (!newDrawName || !newDrawPrize) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingDraw(true);
    try {
      const { error } = await supabase
        .from('lottery_draws')
        .insert({
          name: newDrawName,
          vip_level: newDrawVipLevel,
          prize_amount: parseFloat(newDrawPrize),
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lottery draw created successfully"
      });

      setShowCreateDraw(false);
      setNewDrawName('');
      setNewDrawPrize('');
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create draw",
        variant: "destructive"
      });
    } finally {
      setIsCreatingDraw(false);
    }
  };

  const setWinner = async (draw: LotteryDraw, ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    setIsSettingWinner(true);
    try {
      // Update draw with winner
      const { error: drawError } = await supabase
        .from('lottery_draws')
        .update({
          winner_user_id: ticket.user_id,
          winner_ticket_id: ticketId,
          status: 'completed',
          draw_date: new Date().toISOString()
        })
        .eq('id', draw.id);

      if (drawError) throw drawError;

      // Mark ticket as used
      const { error: ticketError } = await supabase
        .from('lottery_tickets')
        .update({ is_used: true })
        .eq('id', ticketId);

      if (ticketError) throw ticketError;

      // Add prize to winner's wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', ticket.user_id)
        .single();

      if (wallet) {
        await supabase
          .from('wallets')
          .update({ balance: Number(wallet.balance) + draw.prize_amount })
          .eq('user_id', ticket.user_id);
      }

      toast({
        title: "🎉 Winner Set!",
        description: `${ticket.user_name} won ${formatCurrency(draw.prize_amount)}!`
      });

      setSelectedDraw(null);
      setSelectedWinnerTicket(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set winner",
        variant: "destructive"
      });
    } finally {
      setIsSettingWinner(false);
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingDraws = draws.filter(d => d.status === 'pending');
  const completedDraws = draws.filter(d => d.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="w-6 h-6 text-primary" />
            Lottery Control
          </h1>
          <p className="text-muted-foreground">Manage lottery draws by VIP level</p>
        </div>
        <Dialog open={showCreateDraw} onOpenChange={setShowCreateDraw}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Draw
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Lottery Draw</DialogTitle>
              <DialogDescription>
                Set up a new lottery draw for a specific VIP level
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Draw Name</label>
                <Input
                  placeholder="Weekly Gold Lottery"
                  value={newDrawName}
                  onChange={(e) => setNewDrawName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">VIP Level</label>
                <Select value={newDrawVipLevel} onValueChange={(v) => setNewDrawVipLevel(v as VipLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VIP_LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.icon} {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prize Amount (₹)</label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={newDrawPrize}
                  onChange={(e) => setNewDrawPrize(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDraw(false)}>
                Cancel
              </Button>
              <Button onClick={createDraw} disabled={isCreatingDraw}>
                {isCreatingDraw ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Draw
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* VIP Level Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as VipLevel)}>
        <TabsList className="grid grid-cols-5 w-full">
          {VIP_LEVELS.map(level => (
            <TabsTrigger key={level.value} value={level.value} className="gap-1">
              <span>{level.icon}</span>
              <span className="hidden sm:inline">{level.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {VIP_LEVELS.map(level => (
          <TabsContent key={level.value} value={level.value} className="space-y-6 mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${level.color}/20`}>
                          <Ticket className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{tickets.length}</p>
                          <p className="text-sm text-muted-foreground">Active Tickets</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-yellow-500/20">
                          <Trophy className="w-6 h-6 text-yellow-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{pendingDraws.length}</p>
                          <p className="text-sm text-muted-foreground">Pending Draws</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-green-500/20">
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{completedDraws.length}</p>
                          <p className="text-sm text-muted-foreground">Completed</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Pending Draws */}
                {pendingDraws.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Gift className="w-5 h-5 text-yellow-500" />
                        Pending Draws - Select Winners
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {pendingDraws.map(draw => (
                          <div key={draw.id} className="p-4 bg-secondary/50 rounded-lg border border-border">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-semibold">{draw.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Prize: {formatCurrency(draw.prize_amount)}
                                </p>
                              </div>
                              <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                                Pending
                              </Badge>
                            </div>
                            
                            {selectedDraw?.id === draw.id ? (
                              <div className="space-y-3">
                                <p className="text-sm font-medium">Select winning ticket:</p>
                                <Select 
                                  value={selectedWinnerTicket || ''} 
                                  onValueChange={setSelectedWinnerTicket}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose a ticket" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {filteredTickets.map(ticket => (
                                      <SelectItem key={ticket.id} value={ticket.id}>
                                        {ticket.ticket_number} - {ticket.user_name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setSelectedDraw(null)}
                                    className="flex-1"
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={() => selectedWinnerTicket && setWinner(draw, selectedWinnerTicket)}
                                    disabled={!selectedWinnerTicket || isSettingWinner}
                                    className="flex-1"
                                  >
                                    {isSettingWinner ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Confirm Winner
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button 
                                variant="outline" 
                                onClick={() => setSelectedDraw(draw)}
                                className="w-full"
                              >
                                Select Winner
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Tickets Table */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Active Tickets</CardTitle>
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search tickets..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredTickets.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ticket #</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Earned At</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTickets.map(ticket => (
                            <TableRow key={ticket.id}>
                              <TableCell className="font-mono font-bold">
                                {ticket.ticket_number}
                              </TableCell>
                              <TableCell>{ticket.user_name}</TableCell>
                              <TableCell>{ticket.earned_at_referral_count} referrals</TableCell>
                              <TableCell>
                                {new Date(ticket.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant={ticket.is_used ? 'secondary' : 'default'}>
                                  {ticket.is_used ? 'Used' : 'Active'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Ticket className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No tickets found for {level.label} VIP level</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Completed Draws */}
                {completedDraws.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        Completed Draws
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Draw Name</TableHead>
                            <TableHead>Prize</TableHead>
                            <TableHead>Winner</TableHead>
                            <TableHead>Draw Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {completedDraws.map(draw => (
                            <TableRow key={draw.id}>
                              <TableCell className="font-medium">{draw.name}</TableCell>
                              <TableCell className="text-primary font-bold">
                                {formatCurrency(draw.prize_amount)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="border-green-500 text-green-500">
                                  Winner Selected
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {draw.draw_date ? new Date(draw.draw_date).toLocaleDateString() : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
