import { useState } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Wallet,
  User,
  Building
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { mockPendingWithdrawals, formatCurrency, formatDate, formatTime, Transaction } from "@/lib/mockData";
import { toast } from "sonner";

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState(mockPendingWithdrawals);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Transaction | null>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const totalPending = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0);

  const handleApprove = () => {
    if (!selectedWithdrawal) return;
    
    setWithdrawals(prev => prev.map(w => 
      w.id === selectedWithdrawal.id ? { ...w, status: 'completed' as const } : w
    ));
    toast.success(`Withdrawal of ${formatCurrency(selectedWithdrawal.amount)} approved`);
    setIsApproveOpen(false);
    setSelectedWithdrawal(null);
  };

  const handleReject = () => {
    if (!selectedWithdrawal) return;
    
    setWithdrawals(prev => prev.map(w => 
      w.id === selectedWithdrawal.id ? { ...w, status: 'rejected' as const } : w
    ));
    toast.success(`Withdrawal rejected`);
    setIsRejectOpen(false);
    setSelectedWithdrawal(null);
    setRejectReason("");
  };

  const openApproveDialog = (withdrawal: Transaction) => {
    setSelectedWithdrawal(withdrawal);
    setIsApproveOpen(true);
  };

  const openRejectDialog = (withdrawal: Transaction) => {
    setSelectedWithdrawal(withdrawal);
    setIsRejectOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Withdrawal Requests</h1>
        <p className="text-muted-foreground">Manage user withdrawal requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="game-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Requests</p>
                  <p className="text-3xl font-bold text-foreground">{pendingCount}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="game-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pending Amount</p>
                  <p className="text-3xl font-bold text-game-red">{formatCurrency(totalPending)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-game-red/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-game-red" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="game-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Processed Today</p>
                  <p className="text-3xl font-bold text-game-green">12</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-game-green/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-game-green" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Withdrawals Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="game-card">
          <CardHeader>
            <CardTitle>All Withdrawal Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Bank Details</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">
                          {withdrawal.userName || 'Unknown User'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-game-red">
                      {formatCurrency(withdrawal.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building className="w-4 h-4" />
                        <span className="text-sm">{withdrawal.reference}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div>
                        <p>{formatDate(withdrawal.createdAt)}</p>
                        <p className="text-xs">{formatTime(withdrawal.createdAt)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          withdrawal.status === 'completed' ? 'default' :
                          withdrawal.status === 'rejected' ? 'destructive' : 'secondary'
                        }
                        className={
                          withdrawal.status === 'completed' ? 'bg-game-green/20 text-game-green' :
                          withdrawal.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : ''
                        }
                      >
                        {withdrawal.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {withdrawal.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-game-green hover:bg-game-green/80 text-white"
                            onClick={() => openApproveDialog(withdrawal)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openRejectDialog(withdrawal)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
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
              Approve Withdrawal
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this withdrawal request?
            </DialogDescription>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User</span>
                  <span className="font-medium text-foreground">{selectedWithdrawal.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-game-red">{formatCurrency(selectedWithdrawal.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank</span>
                  <span className="text-foreground">{selectedWithdrawal.reference}</span>
                </div>
              </div>
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-500">
                  Please ensure you have processed the bank transfer before approving this request.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-game-green hover:bg-game-green/80 text-white"
              onClick={handleApprove}
            >
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
              Reject Withdrawal
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this withdrawal request.
            </DialogDescription>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User</span>
                  <span className="font-medium text-foreground">{selectedWithdrawal.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-game-red">{formatCurrency(selectedWithdrawal.amount)}</span>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Rejection Reason
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
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleReject}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
