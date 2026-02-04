import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useReferrals } from '@/hooks/useReferrals';
import { useVipLevel } from '@/hooks/useVipLevel';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Gamepad2, 
  History, 
  Users, 
  ArrowLeft,
  Copy,
  Share2,
  Gift,
  Trophy,
  Ticket,
  Star,
  Sparkles,
  CheckCircle2,
  Crown,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Lottery ticket milestones - users get tickets at these referral counts (only counted after VIP + deposit)
const LOTTERY_MILESTONES = [2, 5, 10, 15, 25, 50];

export default function Referral() {
  const navigate = useNavigate();
  const { isAuthenticated, profile, isLoading: authLoading } = useAuth();
  const { referrals, lotteryTickets, totalReferrals, totalEarned, isLoading: referralsLoading, qualifiedReferrals } = useReferrals();
  const { currentLevel, currentTier } = useVipLevel();
  const [showLotteryModal, setShowLotteryModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const referralCode = profile?.referral_code || 'LOADING...';
  const referralLink = `https://genzwin.app/ref/${referralCode}`;
  
  const hasVip = currentLevel !== 'none';
  const referralBonus = currentTier?.referralBonus || 0;
  
  // Calculate lottery tickets based on qualified referrals (deposited)
  const ticketsEarned = lotteryTickets.length;
  const nextMilestone = LOTTERY_MILESTONES.find(m => qualifiedReferrals < m) || LOTTERY_MILESTONES[LOTTERY_MILESTONES.length - 1];
  const progressToNext = qualifiedReferrals >= nextMilestone ? 100 : (qualifiedReferrals / nextMilestone) * 100;
  const referralsNeeded = Math.max(0, nextMilestone - qualifiedReferrals);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join GenZWIN',
          text: `Use my referral code ${referralCode} and start winning!`,
          url: referralLink,
        });
      } catch (err) {
        copyToClipboard(referralLink, 'Referral link');
      }
    } else {
      copyToClipboard(referralLink, 'Referral link');
    }
  };

  const isLoading = authLoading || referralsLoading;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Referral Program
          </h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* VIP Warning Banner */}
        {!hasVip && (
          <Card className="game-card border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-500 shrink-0" />
                <div>
                  <p className="font-semibold text-yellow-600 dark:text-yellow-400">VIP Required</p>
                  <p className="text-sm text-muted-foreground">
                    Purchase a VIP level to start earning referral rewards and lottery tickets!
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/dashboard')}
                className="w-full mt-3 bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                <Crown className="w-4 h-4 mr-2" />
                Get VIP Now
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Hero Banner */}
        <Card className="game-card overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5" />
          <div className="absolute top-2 right-2">
            {hasVip && currentTier && (
              <Badge className={`bg-gradient-to-r ${currentTier.color} text-white border-0`}>
                {currentTier.icon} {currentTier.name}
              </Badge>
            )}
          </div>
          <CardContent className="relative pt-6 pb-4">
            <h2 className="text-2xl font-bold mb-1">Invite & Earn!</h2>
            <p className="text-muted-foreground text-sm mb-4">
              {hasVip 
                ? `Get ${formatCurrency(referralBonus)} for every friend who deposits!`
                : 'Get VIP to unlock referral rewards!'
              }
            </p>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold border-2 border-background">
                    {i}
                  </div>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {totalReferrals} friends joined ({qualifiedReferrals} deposited)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="game-card p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{qualifiedReferrals}</p>
            <p className="text-xs text-muted-foreground">Qualified</p>
          </Card>
          <Card className="game-card p-4 text-center">
            <Gift className="w-6 h-6 mx-auto mb-2 text-game-green" />
            <p className="text-2xl font-bold">{formatCurrency(totalEarned)}</p>
            <p className="text-xs text-muted-foreground">Total Earned</p>
          </Card>
          <Card className="game-card p-4 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/10" />
            <Ticket className="w-6 h-6 mx-auto mb-2 text-yellow-500 relative z-10" />
            <p className="text-2xl font-bold relative z-10">{ticketsEarned}</p>
            <p className="text-xs text-muted-foreground relative z-10">Lottery Tickets</p>
          </Card>
        </div>

        {/* Lottery Ticket Progress */}
        {hasVip && (
          <Card className="game-card overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-orange-500/5 to-red-500/5" />
            <CardHeader className="pb-2 relative">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                Lottery Ticket Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{qualifiedReferrals} qualified referrals</span>
                  <span className="text-muted-foreground">Next ticket at {nextMilestone}</span>
                </div>
                <Progress value={progressToNext} className="h-3 bg-secondary" />
                {referralsNeeded > 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    🎟️ {referralsNeeded} more referral{referralsNeeded > 1 ? 's' : ''} (who deposit) to unlock next ticket!
                  </p>
                )}
              </div>

              {/* Milestone Track */}
              <div className="flex justify-between items-center py-2">
                {LOTTERY_MILESTONES.slice(0, 5).map((milestone) => (
                  <div key={milestone} className="flex flex-col items-center">
                    <motion.div
                      initial={false}
                      animate={qualifiedReferrals >= milestone ? { scale: [1, 1.2, 1] } : {}}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        qualifiedReferrals >= milestone 
                          ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' 
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {qualifiedReferrals >= milestone ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        milestone
                      )}
                    </motion.div>
                    <span className="text-xs mt-1 text-muted-foreground">{milestone}</span>
                  </div>
                ))}
              </div>

              {ticketsEarned > 0 && (
                <Button 
                  onClick={() => setShowLotteryModal(true)}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 text-white"
                >
                  <Ticket className="w-4 h-4 mr-2" />
                  View My {ticketsEarned} Lottery Ticket{ticketsEarned > 1 ? 's' : ''}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Referral Code & Link */}
        <Card className="game-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Your Referral Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-secondary rounded-lg px-4 py-3 font-mono font-bold text-lg text-center tracking-widest">
                {referralCode}
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => copyToClipboard(referralCode, 'Referral code')}
                className="h-12 w-12"
              >
                <Copy className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-secondary rounded-lg px-3 py-2 text-sm truncate text-muted-foreground">
                {referralLink}
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => copyToClipboard(referralLink, 'Referral link')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            <Button 
              onClick={handleShare}
              className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground glow-primary"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share with Friends
            </Button>
          </CardContent>
        </Card>

        {/* Referral History */}
        <Card className="game-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              Your Referrals ({totalReferrals})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : referrals.length > 0 ? (
              <div className="space-y-3">
                {referrals.map((referral, index) => (
                  <motion.div
                    key={referral.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold">
                        {(referral.referred_name || 'U').charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{referral.referred_name || 'User'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-game-green">+{formatCurrency(Number(referral.bonus))}</p>
                      <p className="text-xs text-muted-foreground">Bonus</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No referrals yet</p>
                <p className="text-sm text-muted-foreground/70">Share your code to start earning!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="game-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { icon: Crown, title: 'Get VIP First', desc: 'Purchase Bronze, Silver, Gold, Platinum or Diamond' },
                { icon: Share2, title: 'Share Your Code', desc: 'Send your referral link to friends' },
                { icon: Users, title: 'Friend Signs Up', desc: 'They register using your code' },
                { icon: Gift, title: 'They Deposit', desc: `You get ${hasVip ? formatCurrency(referralBonus) : 'VIP bonus'} when they deposit!` },
                { icon: Ticket, title: 'Unlock Lottery', desc: 'Get tickets at 2, 5, 10+ qualified referrals' },
              ].map((step, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Lottery Modal */}
      <AnimatePresence>
        {showLotteryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setShowLotteryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card rounded-2xl border border-border overflow-hidden"
            >
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Ticket className="w-12 h-12 mx-auto mb-2 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold text-white">Your Lottery Tickets</h3>
                <p className="text-white/80 text-sm">Next draw: Coming Soon!</p>
              </div>
              <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                {lotteryTickets.length > 0 ? (
                  lotteryTickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-yellow-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                          <Star className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-mono font-bold text-sm">{ticket.ticket_number}</p>
                          <p className="text-xs text-muted-foreground">Earned at {ticket.earned_at_referral_count} referrals</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-yellow-500">Jackpot Entry</p>
                        <p className="text-xs text-game-green">{ticket.is_used ? 'Used' : 'Active'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No lottery tickets yet. Keep referring!
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-border">
                <Button 
                  onClick={() => setShowLotteryModal(false)}
                  className="w-full"
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border">
        <div className="container max-w-lg mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <Link to="/dashboard" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
              <Wallet className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </Link>
            <Link to="/game/color" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
              <Gamepad2 className="w-5 h-5" />
              <span className="text-xs">Play</span>
            </Link>
            <Link to="/history" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
              <History className="w-5 h-5" />
              <span className="text-xs">History</span>
            </Link>
            <Link to="/referral" className="flex flex-col items-center gap-1 text-primary">
              <Users className="w-5 h-5" />
              <span className="text-xs">Referral</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
