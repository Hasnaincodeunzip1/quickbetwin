import { useState } from 'react';
import { useAdminBankAccounts, CreateBankAccountData } from '@/hooks/useAdminBankAccounts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building2, 
  Loader2,
  IndianRupee,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/mockData';

export default function AdminBankAccounts() {
  const { 
    bankAccounts, 
    isLoading, 
    createBankAccount, 
    updateBankAccount, 
    deleteBankAccount,
    toggleAccountStatus 
  } = useAdminBankAccounts();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<typeof bankAccounts[0] | null>(null);
  const [formData, setFormData] = useState<CreateBankAccountData>({
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    balance: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      bank_name: '',
      account_holder_name: '',
      account_number: '',
      ifsc_code: '',
      balance: 0,
    });
  };

  const handleCreate = async () => {
    if (!formData.bank_name || !formData.account_holder_name || !formData.account_number) {
      return;
    }

    setIsSubmitting(true);
    const success = await createBankAccount(formData);
    setIsSubmitting(false);

    if (success) {
      setIsCreateOpen(false);
      resetForm();
    }
  };

  const handleEdit = async () => {
    if (!editingAccount) return;

    setIsSubmitting(true);
    const success = await updateBankAccount(editingAccount.id, {
      bank_name: formData.bank_name,
      account_holder_name: formData.account_holder_name,
      account_number: formData.account_number,
      ifsc_code: formData.ifsc_code || null,
      balance: formData.balance || 0,
    });
    setIsSubmitting(false);

    if (success) {
      setIsEditOpen(false);
      setEditingAccount(null);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    await deleteBankAccount(deleteId);
    setDeleteId(null);
  };

  const openEditDialog = (account: typeof bankAccounts[0]) => {
    setEditingAccount(account);
    setFormData({
      bank_name: account.bank_name,
      account_holder_name: account.account_holder_name,
      account_number: account.account_number,
      ifsc_code: account.ifsc_code || '',
      balance: account.balance,
    });
    setIsEditOpen(true);
  };

  const totalBalance = bankAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
  const totalDeposits = bankAccounts.reduce((sum, acc) => sum + acc.total_deposits, 0);
  const totalTransactions = bankAccounts.reduce((sum, acc) => sum + acc.total_transactions, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bank Accounts</h1>
            <p className="text-muted-foreground">Manage admin bank accounts for deposits and withdrawals</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Bank Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Bank Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input
                    placeholder="e.g., HDFC Bank"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Holder Name</Label>
                  <Input
                    placeholder="e.g., John Doe"
                    value={formData.account_holder_name}
                    onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input
                    placeholder="e.g., 1234567890"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code (Optional)</Label>
                  <Input
                    placeholder="e.g., HDFC0001234"
                    value={formData.ifsc_code}
                    onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Initial Balance (₹)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <Button 
                  onClick={handleCreate} 
                  disabled={isSubmitting || !formData.bank_name || !formData.account_holder_name || !formData.account_number}
                  className="w-full"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Account'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Accounts</p>
                  <p className="text-2xl font-bold">{bankAccounts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <IndianRupee className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <ArrowDownCircle className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Deposits</p>
                  <p className="text-2xl font-bold">{totalDeposits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <ArrowUpCircle className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{totalTransactions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bank Accounts Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Bank Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : bankAccounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No bank accounts added yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bank</TableHead>
                    <TableHead>Account Holder</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Deposits</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.bank_name}</TableCell>
                      <TableCell>{account.account_holder_name}</TableCell>
                      <TableCell className="font-mono">{account.account_number}</TableCell>
                      <TableCell>{formatCurrency(account.balance)}</TableCell>
                      <TableCell>{account.total_deposits}</TableCell>
                      <TableCell>{account.total_transactions}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={account.is_active}
                            onCheckedChange={(checked) => toggleAccountStatus(account.id, checked)}
                          />
                          <Badge variant={account.is_active ? 'default' : 'secondary'}>
                            {account.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditDialog(account)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setDeleteId(account.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Bank Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Holder Name</Label>
                <Input
                  value={formData.account_holder_name}
                  onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>IFSC Code (Optional)</Label>
                <Input
                  value={formData.ifsc_code}
                  onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Balance (₹)</Label>
                <Input
                  type="number"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <Button 
                onClick={handleEdit} 
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Bank Account?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the bank account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
