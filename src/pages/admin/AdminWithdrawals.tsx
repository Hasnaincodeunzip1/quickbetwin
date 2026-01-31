import { useState } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Wallet,
  User,
  Building,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/formatters";
import { useAdminTransactions } from "@/hooks/useAdminTransactions";

export default function AdminWithdrawals() {
  const { transactions, isLoading, stats, approveTransaction, rejectTransaction, refetch } = useAdminTransactions();
  const [selectedTransaction, setSelectedTransaction] = useState<typeof transactions[0] | null>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  const withdrawals = transactions.filter(t => t.type === 'withdrawal');
  const deposits = transactions.filter(t => t.type === 'deposit');

  const handleApprove = async () => {
    if (!selectedTransaction) return;
    setProcessing(true);
    await approveTransaction(selectedTransaction.id);
    setProcessing(false);
    setIsApproveOpen(false);
    setSelectedTransaction(null);
  };

  const handleReject = async () => {
    if (!selectedTransaction) return;
    setProcessing(true);
    await rejectTransaction(selectedTransaction.id, rejectReason);
    setProcessing(false);
    setIsRejectOpen(false);
    setSelectedTransaction(null);
    setRejectReason("");
  };

  const openApproveDialog = (tx: typeof transactions[0]) => {
    setSelectedTransaction(tx);
    setIsApproveOpen(true);
  };

  const openRejectDialog = (tx: typeof transactions[0]) => {
    setSelectedTransaction(tx);
    setIsRejectOpen(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transaction Management</h1>
          <p className="text-muted-foreground">Approve or reject deposits and withdrawals</p>
        </div>
        <Button variant="outline" size="icon" onClick={refetch}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="game-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Requests</p>
                  <p className="text-3xl font-bold">{stats.pendingCount}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="game-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Amount</p>
                  <p className="text-3xl font-bold text-game-red">{formatCurrency(stats.pendingAmount)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-game-red/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-game-red" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="game-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Processed Today</p>
                  <p className="text-3xl font-bold text-game-green">{stats.processedToday}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-game-green/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-game-green" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Transactions Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="game-card">
          <CardHeader>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pending' | 'all')}>
              <TabsList>
                <TabsTrigger value="pending" className="gap-2">
                  <Clock className="w-4 h-4" /> Pending ({pendingTransactions.length})
                </TabsTrigger>
                <TabsTrigger value="all" className="gap-2">
                  All Transactions
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Bank Account</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(activeTab === 'pending' ? pendingTransactions : transactions).map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {tx.type === 'deposit' ? (
                          <ArrowDownCircle className="w-4 h-4 text-game-green" />
                        ) : (
                          <ArrowUpCircle className="w-4 h-4 text-game-red" />
                        )}
                        <span className="capitalize">{tx.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">{tx.user_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className={`font-bold ${tx.type === 'deposit' ? 'text-game-green' : 'text-game-red'}`}>
                      {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                    </TableCell>
                    <TableCell>
                      {tx.bank_details ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building className="w-4 h-4" />
                          <span className="text-sm">{tx.bank_details}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">{tx.reference}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {tx.assigned_bank_name ? (
                        <Badge variant="outline" className="gap-1">
                          <Building className="w-3 h-3" />
                          {tx.assigned_bank_name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div>
                        <p>{formatDate(tx.created_at)}</p>
                        <p className="text-xs">{formatTime(tx.created_at)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          tx.status === 'completed' ? 'default' :
                          tx.status === 'rejected' ? 'destructive' : 'secondary'
                        }
                        className={
                          tx.status === 'completed' ? 'bg-game-green/20 text-game-green' :
                          tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : ''
                        }
                      >
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {tx.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-game-green hover:bg-game-green/80 text-white"
                            onClick={() => openApproveDialog(tx)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openRejectDialog(tx)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(activeTab === 'pending' ? pendingTransactions : transactions).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No {activeTab === 'pending' ? 'pending ' : ''}transactions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Approve Dialog */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="game-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-game-green" />
              Approve {selectedTransaction?.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this {selectedTransaction?.type}?
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User</span>
                  <span className="font-medium">{selectedTransaction.user_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className={`font-bold ${selectedTransaction.type === 'deposit' ? 'text-game-green' : 'text-game-red'}`}>
                    {formatCurrency(Number(selectedTransaction.amount))}
                  </span>
                </div>
                {selectedTransaction.bank_details && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank</span>
                    <span>{selectedTransaction.bank_details}</span>
                  </div>
                )}
              </div>
              {selectedTransaction.type === 'withdrawal' && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-500">
                    Please ensure you have processed the bank transfer before approving.
                  </p>
                </div>
              )}
              {selectedTransaction.type === 'deposit' && (
                <div className="p-4 bg-game-green/10 border border-game-green/20 rounded-lg flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-game-green shrink-0 mt-0.5" />
                  <p className="text-sm text-game-green">
                    Approving will add {formatCurrency(Number(selectedTransaction.amount))} to the user's wallet.
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button 
              className="bg-game-green hover:bg-game-green/80 text-white"
              onClick={handleApprove}
              disabled={processing}
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="game-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              Reject {selectedTransaction?.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this {selectedTransaction?.type}.
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User</span>
                  <span className="font-medium">{selectedTransaction.user_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className={`font-bold ${selectedTransaction.type === 'deposit' ? 'text-game-green' : 'text-game-red'}`}>
                    {formatCurrency(Number(selectedTransaction.amount))}
                  </span>
                </div>
              </div>
              {selectedTransaction.type === 'withdrawal' && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-500">
                    The amount will be refunded to the user's wallet.
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Rejection Reason (optional)
                </label>
                <Textarea
                  placeholder="Enter reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleReject}
              disabled={processing}
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
