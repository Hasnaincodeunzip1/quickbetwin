import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { formatCurrency } from '@/lib/formatters';
import { openUPIWithFallback, isMobileDevice } from '@/lib/upiDeepLink';
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
  XCircle,
  Landmark,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Wallet() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const { balance, transactions, deposit, withdraw, depositBankAccount, depositUPIAccount } = useWallet();

  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>(
    (searchParams.get('action') as 'deposit' | 'withdraw') || 'deposit'
  );
  const [depositMethod, setDepositMethod] = useState<'bank' | 'upi'>('bank');
  const [withdrawMethod, setWithdrawMethod] = useState<'bank' | 'upi'>('bank');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  // Bank withdrawal fields
  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  // UPI withdrawal field
  const [withdrawUpiId, setWithdrawUpiId] = useState('');
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
    const success = await deposit(amount, depositMethod);
    setLoading(false);
    
    if (success) {
      setDepositAmount('');
    }
  };

  // Handle UPI Pay Now button - opens UPI app with payment details
  const handleUPIPayNow = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 100) {
      toast({
        title: "Invalid Amount",
        description: "Please enter an amount of ₹100 or more",
        variant: "destructive",
      });
      return;
    }

    if (!depositUPIAccount) {
      toast({
        title: "No UPI Account",
        description: "No UPI account available for deposits",
        variant: "destructive",
      });
      return;
    }

    const transactionRef = `DEP${Date.now()}`;

    openUPIWithFallback(
      {
        upiId: depositUPIAccount.upi_id,
        payeeName: depositUPIAccount.holder_name,
        amount: amount,
        transactionNote: `Deposit to GenXWIN`,
        transactionRef: transactionRef,
      },
      () => {
        // Fallback if UPI app doesn't open
        toast({
          title: "UPI App Not Found",
          description: "Please install a UPI app (GPay, PhonePe, Paytm) or use the QR code to pay",
          variant: "destructive",
        });
      }
    );

    toast({
      title: "Opening UPI App",
      description: "Complete the payment in your UPI app, then click 'Confirm Deposit' below",
    });
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

    let withdrawDetails = '';
    
    if (withdrawMethod === 'bank') {
      if (!bankName.trim() || !accountHolderName.trim() || !accountNumber.trim() || !ifscCode.trim()) {
        toast({
          title: "Bank Details Required",
          description: "Please fill in all bank account details",
          variant: "destructive",
        });
        return;
      }
      withdrawDetails = JSON.stringify({
        method: 'bank',
        bankName: bankName.trim(),
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim(),
      });
    } else {
      if (!withdrawUpiId.trim()) {
        toast({
          title: "UPI ID Required",
          description: "Please enter your UPI ID",
          variant: "destructive",
        });
        return;
      }
      withdrawDetails = JSON.stringify({
        method: 'upi',
        upiId: withdrawUpiId.trim(),
      });
    }

    setLoading(true);
    await withdraw(amount, withdrawDetails);
    setLoading(false);
    setWithdrawAmount('');
    setBankName('');
    setAccountHolderName('');
    setAccountNumber('');
    setIfscCode('');
    setWithdrawUpiId('');
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
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
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
            {/* Deposit Method Selection */}
            <div className="flex gap-2">
              <Button
                variant={depositMethod === 'bank' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setDepositMethod('bank')}
              >
                <Landmark className="w-4 h-4 mr-2" />
                Bank Transfer
              </Button>
              <Button
                variant={depositMethod === 'upi' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setDepositMethod('upi')}
              >
                <Smartphone className="w-4 h-4 mr-2" />
                UPI
              </Button>
            </div>

            {/* Bank Account Info */}
            {depositMethod === 'bank' && depositBankAccount && (
              <Card className="game-card border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-game-green animate-pulse" />
                    Transfer to This Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bank</span>
                    <span className="font-medium">{depositBankAccount.bank_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Account Holder</span>
                    <span className="font-medium">{depositBankAccount.account_holder_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Account Number</span>
                    <span className="font-mono font-medium">{depositBankAccount.account_number}</span>
                  </div>
                  {depositBankAccount.ifsc_code && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IFSC Code</span>
                      <span className="font-mono font-medium">{depositBankAccount.ifsc_code}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* UPI Account Info */}
            {depositMethod === 'upi' && depositUPIAccount && (
              <Card className="game-card border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-game-green animate-pulse" />
                    Pay via UPI
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">UPI ID</span>
                    <span className="font-mono font-medium">{depositUPIAccount.upi_id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{depositUPIAccount.holder_name}</span>
                  </div>
                  
                  {/* Pay Now Button - Opens UPI App */}
                  {isMobileDevice() && (
                    <Button
                      onClick={handleUPIPayNow}
                      disabled={!depositAmount || parseFloat(depositAmount) < 100}
                      className="w-full h-12 bg-game-green hover:bg-game-green/90 text-white"
                    >
                      <ExternalLink className="w-5 h-5 mr-2" />
                      Pay ₹{depositAmount || '0'} in UPI App
                    </Button>
                  )}
                  
                  {depositUPIAccount.qr_code_url && (
                    <div className="flex flex-col items-center pt-2">
                      <p className="text-xs text-muted-foreground mb-2">
                        {isMobileDevice() ? 'Or scan QR Code to Pay' : 'Scan QR Code to Pay'}
                      </p>
                      <img
                        src={depositUPIAccount.qr_code_url}
                        alt="UPI QR Code"
                        className="w-48 h-48 rounded-lg border bg-white p-2"
                      />
                    </div>
                  )}
                  
                  {!isMobileDevice() && (
                    <p className="text-xs text-center text-muted-foreground">
                      💡 Tip: Open on your phone to pay directly via UPI app
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* No account available message */}
            {depositMethod === 'bank' && !depositBankAccount && (
              <Card className="game-card border-destructive/30 bg-destructive/5">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No bank account available for deposits. Please contact support.</p>
                </CardContent>
              </Card>
            )}
            {depositMethod === 'upi' && !depositUPIAccount && (
              <Card className="game-card border-destructive/30 bg-destructive/5">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No UPI account available for deposits. Please contact support.</p>
                </CardContent>
              </Card>
            )}

            <Card className="game-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Add Money</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter amount"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value.replace(/\D/g, ''))}
                    className="bg-secondary text-lg h-12"
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
                  disabled={loading || !depositAmount || (depositMethod === 'bank' ? !depositBankAccount : !depositUPIAccount)}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground glow-primary"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ArrowDownCircle className="w-5 h-5 mr-2" />
                      {depositMethod === 'upi' 
                        ? `Confirm Deposit ${depositAmount && formatCurrency(parseFloat(depositAmount) || 0)}`
                        : `Deposit ${depositAmount && formatCurrency(parseFloat(depositAmount) || 0)}`
                      }
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  {depositMethod === 'bank' 
                    ? 'Transfer to the account above and click deposit. Your wallet will be credited after admin approval.'
                    : isMobileDevice()
                      ? 'Click "Pay in UPI App" to pay, then "Confirm Deposit" to notify admin. Your wallet will be credited after approval.'
                      : 'Pay via UPI using the QR code and click confirm. Your wallet will be credited after admin approval.'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdraw Tab */}
          <TabsContent value="withdraw" className="mt-4 space-y-4">
            {/* Withdrawal Method Selection */}
            <div className="flex gap-2">
              <Button
                variant={withdrawMethod === 'bank' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setWithdrawMethod('bank')}
              >
                <Landmark className="w-4 h-4 mr-2" />
                Bank Account
              </Button>
              <Button
                variant={withdrawMethod === 'upi' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setWithdrawMethod('upi')}
              >
                <Smartphone className="w-4 h-4 mr-2" />
                UPI
              </Button>
            </div>

            <Card className="game-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Withdraw Money</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value.replace(/\D/g, ''))}
                    className="bg-secondary text-lg h-12"
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

                {/* Bank Account Form */}
                {withdrawMethod === 'bank' && (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <p className="text-sm font-medium text-muted-foreground">Enter Your Bank Details</p>
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input
                        placeholder="e.g., HDFC Bank"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="bg-secondary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Holder Name</Label>
                      <Input
                        placeholder="e.g., John Doe"
                        value={accountHolderName}
                        onChange={(e) => setAccountHolderName(e.target.value)}
                        className="bg-secondary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Number</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="e.g., 1234567890"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                        className="bg-secondary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>IFSC Code</Label>
                      <Input
                        placeholder="e.g., HDFC0001234"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                        className="bg-secondary"
                      />
                    </div>
                  </div>
                )}

                {/* UPI Form */}
                {withdrawMethod === 'upi' && (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <p className="text-sm font-medium text-muted-foreground">Enter Your UPI Details</p>
                    <div className="space-y-2">
                      <Label>UPI ID</Label>
                      <Input
                        placeholder="e.g., yourname@upi"
                        value={withdrawUpiId}
                        onChange={(e) => setWithdrawUpiId(e.target.value)}
                        className="bg-secondary"
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleWithdraw}
                  disabled={loading || !withdrawAmount || (withdrawMethod === 'bank' ? (!bankName || !accountHolderName || !accountNumber || !ifscCode) : !withdrawUpiId)}
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
