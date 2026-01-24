import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { formatCurrency } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wallet as WalletIcon, 
  Gamepad2, 
  History, 
  Users, 
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Wallet() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const { balance, transactions, deposit, withdraw } = useWallet();

  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>(
    (searchParams.get('action') as 'deposit' | 'withdraw') || 'deposit'
  );
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum deposit is ₹100",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    // Simulate Razorpay payment flow
    await deposit(amount);
    setLoading(false);
    setDepositAmount('');
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum withdrawal is ₹100",
        variant: "destructive",
      });
      return;
    }

    if (!bankDetails.trim()) {
      toast({
        title: "Bank Details Required",
        description: "Please enter your bank account details",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    await withdraw(amount, bankDetails);
    setLoading(false);
    setWithdrawAmount('');
    setBankDetails('');
  };

  const depositPresets = [100, 500, 1000, 2000, 5000];
  const withdrawPresets = [100, 500, 1000, 2000];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-game-green" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'win':
      case 'referral_bonus':
        return 'text-game-green';
      case 'withdrawal':
      case 'bet':
        return 'text-destructive';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Wallet</h1>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="game-card overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
            <CardContent className="relative pt-6 text-center">
              <WalletIcon className="w-12 h-12 mx-auto mb-2 text-primary" />
              <p className="text-muted-foreground text-sm">Available Balance</p>
              <p className="text-4xl font-bold text-primary">{formatCurrency(balance)}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 bg-secondary">
            <TabsTrigger value="deposit" className="gap-2">
              <ArrowDownCircle className="w-4 h-4" /> Deposit
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="gap-2">
              <ArrowUpCircle className="w-4 h-4" /> Withdraw
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" /> History
            </TabsTrigger>
          </TabsList>

          {/* Deposit Tab */}
          <TabsContent value="deposit" className="mt-4 space-y-4">
            <Card className="game-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Add Money</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="bg-secondary text-lg h-12"
                    min={100}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {depositPresets.map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setDepositAmount(amount.toString())}
                    >
                      +{formatCurrency(amount)}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={handleDeposit}
                  disabled={loading || !depositAmount}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground glow-primary"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ArrowDownCircle className="w-5 h-5 mr-2" />
                      Deposit {depositAmount && formatCurrency(parseFloat(depositAmount) || 0)}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Secure payments powered by Razorpay
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdraw Tab */}
          <TabsContent value="withdraw" className="mt-4 space-y-4">
            <Card className="game-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Withdraw Money</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="bg-secondary text-lg h-12"
                    min={100}
                    max={balance}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {withdrawPresets.map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setWithdrawAmount(Math.min(amount, balance).toString())}
                      disabled={amount > balance}
                    >
                      {formatCurrency(amount)}
                    </Button>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Bank Account Details</Label>
                  <Input
                    placeholder="e.g., HDFC ****1234"
                    value={bankDetails}
                    onChange={(e) => setBankDetails(e.target.value)}
                    className="bg-secondary"
                  />
                </div>

                <Button
                  onClick={handleWithdraw}
                  disabled={loading || !withdrawAmount || !bankDetails}
                  className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ArrowUpCircle className="w-5 h-5 mr-2" />
                      Request Withdrawal
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Withdrawals are processed within 24-48 hours
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4">
            <Card className="game-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Transaction History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No transactions yet
                  </p>
                ) : (
                  transactions.map((tx) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'deposit' || tx.type === 'win' || tx.type === 'referral_bonus'
                            ? 'bg-game-green/20'
                            : 'bg-destructive/20'
                        }`}>
                          {tx.type === 'deposit' || tx.type === 'win' || tx.type === 'referral_bonus' ? (
                            <ArrowDownCircle className="w-5 h-5 text-game-green" />
                          ) : (
                            <ArrowUpCircle className="w-5 h-5 text-destructive" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium capitalize">
                            {tx.type.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">{tx.reference}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${getTypeColor(tx.type)}`}>
                          {tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                        </p>
                        <div className="flex items-center gap-1 justify-end">
                          {getStatusIcon(tx.status)}
                          <span className="text-xs text-muted-foreground capitalize">{tx.status}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border">
        <div className="container max-w-lg mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <Link to="/dashboard" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
              <WalletIcon className="w-5 h-5" />
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
            <Link to="/referral" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
              <Users className="w-5 h-5" />
              <span className="text-xs">Referral</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
