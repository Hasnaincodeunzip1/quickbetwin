import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { useAdminUPIAccounts, CreateUPIAccountData, UPIAccount } from '@/hooks/useAdminUPIAccounts';
import { Plus, Edit, Trash2, QrCode, Smartphone, Loader2 } from 'lucide-react';

export default function AdminUPIAccounts() {
  const {
    upiAccounts,
    isLoading,
    createUPIAccount,
    updateUPIAccount,
    deleteUPIAccount,
    toggleAccountStatus,
  } = useAdminUPIAccounts();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isQRViewOpen, setIsQRViewOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<UPIAccount | null>(null);
  const [formData, setFormData] = useState<CreateUPIAccountData>({
    upi_id: '',
    holder_name: '',
    qr_code_url: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      upi_id: '',
      holder_name: '',
      qr_code_url: '',
    });
  };

  const handleAdd = async () => {
    if (!formData.upi_id.trim() || !formData.holder_name.trim()) return;
    
    setIsSubmitting(true);
    const success = await createUPIAccount(formData);
    setIsSubmitting(false);
    
    if (success) {
      setIsAddOpen(false);
      resetForm();
    }
  };

  const handleEdit = async () => {
    if (!selectedAccount || !formData.upi_id.trim() || !formData.holder_name.trim()) return;
    
    setIsSubmitting(true);
    const success = await updateUPIAccount(selectedAccount.id, formData);
    setIsSubmitting(false);
    
    if (success) {
      setIsEditOpen(false);
      setSelectedAccount(null);
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this UPI account?')) return;
    await deleteUPIAccount(id);
  };

  const openEdit = (account: UPIAccount) => {
    setSelectedAccount(account);
    setFormData({
      upi_id: account.upi_id,
      holder_name: account.holder_name,
      qr_code_url: account.qr_code_url || '',
    });
    setIsEditOpen(true);
  };

  const openQRView = (account: UPIAccount) => {
    setSelectedAccount(account);
    setIsQRViewOpen(true);
  };

  const totalTransactions = upiAccounts.reduce((sum, acc) => sum + acc.total_transactions, 0);
  const activeCount = upiAccounts.filter(acc => acc.is_active).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">UPI Accounts</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="game-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upiAccounts.length}</p>
                <p className="text-sm text-muted-foreground">Total UPI IDs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="game-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-game-green/20">
                <QrCode className="w-6 h-6 text-game-green" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Active UPI IDs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="game-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-accent/20">
                <Smartphone className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTransactions}</p>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* UPI Accounts Table */}
      <Card className="game-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>UPI Accounts</CardTitle>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add UPI ID
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New UPI Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>UPI ID</Label>
                  <Input
                    placeholder="example@paytm"
                    value={formData.upi_id}
                    onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Holder Name</Label>
                  <Input
                    placeholder="Amit Dube"
                    value={formData.holder_name}
                    onChange={(e) => setFormData({ ...formData, holder_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>QR Code URL (optional)</Label>
                  <Input
                    placeholder="https://example.com/qr-code.png"
                    value={formData.qr_code_url}
                    onChange={(e) => setFormData({ ...formData, qr_code_url: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a URL to your QR code image
                  </p>
                </div>
                <Button onClick={handleAdd} disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Add UPI Account
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : upiAccounts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No UPI accounts added yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>UPI ID</TableHead>
                  <TableHead>Holder Name</TableHead>
                  <TableHead>QR Code</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upiAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-mono">{account.upi_id}</TableCell>
                    <TableCell>{account.holder_name}</TableCell>
                    <TableCell>
                      {account.qr_code_url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openQRView(account)}
                        >
                          <QrCode className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">No QR</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{account.total_transactions}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={account.is_active}
                          onCheckedChange={(checked) => toggleAccountStatus(account.id, checked)}
                        />
                        <Badge variant={account.is_active ? 'default' : 'secondary'}>
                          {account.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(account)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive"
                          onClick={() => handleDelete(account.id)}
                        >
                          <Trash2 className="w-4 h-4" />
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
            <DialogTitle>Edit UPI Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>UPI ID</Label>
              <Input
                placeholder="example@paytm"
                value={formData.upi_id}
                onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Account Holder Name</Label>
              <Input
                placeholder="Amit Dube"
                value={formData.holder_name}
                onChange={(e) => setFormData({ ...formData, holder_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>QR Code URL (optional)</Label>
              <Input
                placeholder="https://example.com/qr-code.png"
                value={formData.qr_code_url}
                onChange={(e) => setFormData({ ...formData, qr_code_url: e.target.value })}
              />
            </div>
            <Button onClick={handleEdit} disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update UPI Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code View Dialog */}
      <Dialog open={isQRViewOpen} onOpenChange={setIsQRViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code - {selectedAccount?.upi_id}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            {selectedAccount?.qr_code_url ? (
              <img
                src={selectedAccount.qr_code_url}
                alt={`QR Code for ${selectedAccount.upi_id}`}
                className="max-w-full max-h-[400px] rounded-lg border"
              />
            ) : (
              <p className="text-muted-foreground">No QR code available</p>
            )}
            <p className="mt-4 font-mono text-lg">{selectedAccount?.upi_id}</p>
            <p className="text-sm text-muted-foreground">{selectedAccount?.holder_name}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
