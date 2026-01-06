import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { mockReferrals, mockAllUsers, formatCurrency, formatDate } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Wallet, 
  Gamepad2, 
  History, 
  Users, 
  ArrowLeft,
  Copy,
  Gift,
  UserPlus,
  Share2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Referral() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  const referralCode = user.referralCode;
  const referralLink = `https://colorwin.app/register?ref=${referralCode}`;

  const stats = {
    totalReferrals: mockReferrals.length,
    totalEarnings: mockReferrals.reduce((sum, r) => sum + r.bonus, 0),
    bonusPerReferral: 100,
  };

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
          title: 'Join ColorWin!',
          text: `Use my referral code ${referralCode} to get bonus on signup!`,
          url: referralLink,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      copyToClipboard(referralLink, 'Referral link');
    }
  };

  const getReferredUserName = (userId: string) => {
    const user = mockAllUsers.find(u => u.id === userId);
    return user?.name || 'Unknown User';
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Referral Program</h1>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Referral Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="game-card overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
            <CardContent className="relative pt-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <Gift className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Invite & Earn</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Get <span className="text-primary font-bold">{formatCurrency(stats.bonusPerReferral)}</span> for every friend who joins!
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          <Card className="game-card">
            <CardContent className="pt-4 text-center">
              <UserPlus className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{stats.totalReferrals}</p>
              <p className="text-xs text-muted-foreground">Total Referrals</p>
            </CardContent>
          </Card>
          <Card className="game-card">
            <CardContent className="pt-4 text-center">
              <Gift className="w-5 h-5 mx-auto mb-1 text-game-green" />
              <p className="text-2xl font-bold text-game-green">{formatCurrency(stats.totalEarnings)}</p>
              <p className="text-xs text-muted-foreground">Total Earned</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Referral Code & Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="game-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Your Referral Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Input
                  value={referralCode}
                  readOnly
                  className="bg-secondary text-center text-xl font-bold tracking-widest h-14"
                />
                <button
                  onClick={() => copyToClipboard(referralCode, 'Referral code')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-md"
                >
                  <Copy className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Referral Link</p>
                <div className="flex gap-2">
                  <Input
                    value={referralLink}
                    readOnly
                    className="bg-secondary text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(referralLink, 'Referral link')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleShare}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground glow-primary"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share with Friends
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Referral History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="game-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Your Referrals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockReferrals.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No referrals yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Share your code to start earning!
                  </p>
                </div>
              ) : (
                mockReferrals.map((referral, index) => (
                  <motion.div
                    key={referral.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {getReferredUserName(referral.referredUserId)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(referral.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-game-green">
                        +{formatCurrency(referral.bonus)}
                      </p>
                      <p className="text-xs text-muted-foreground">Bonus</p>
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* How it Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="game-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { step: 1, title: 'Share Your Code', desc: 'Send your referral code to friends' },
                  { step: 2, title: 'Friend Signs Up', desc: 'They register using your code' },
                  { step: 3, title: 'Both Get Rewarded', desc: `You get ${formatCurrency(100)}, they get bonus too!` },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary-foreground">{item.step}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border">
        <div className="container max-w-lg mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <Link to="/dashboard" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
              <Wallet className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </Link>
            <Link to="/game" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
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
