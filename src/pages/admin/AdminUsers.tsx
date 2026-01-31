import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  MoreVertical, 
  Ban, 
  CheckCircle, 
  Eye,
  Wallet,
  Phone,
  Calendar,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminUsers, AdminUser } from "@/hooks/useAdminUsers";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function AdminUsers() {
  const { users, isLoading, toggleStatus, isToggling } = useAdminUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const filteredUsers = users.filter(user => 
    (user.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (user.phone || '').includes(searchQuery)
  );

  const handleToggleStatus = (userId: string, currentStatus: 'active' | 'blocked') => {
    toggleStatus(userId, currentStatus);
  };

  const handleViewDetails = (user: AdminUser) => {
    setSelectedUser(user);
    setIsDetailOpen(true);
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground">Manage all registered users</p>
      </div>

      {/* Search */}
      <Card className="game-card">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="game-card">
          <CardHeader>
            <CardTitle>All Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Total Bets</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{user.name || 'Unknown'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.phone || 'N/A'}</TableCell>
                      <TableCell className="font-medium text-primary">
                        {formatCurrency(user.balance)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.totalBets}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.status === 'active' ? 'default' : 'destructive'}
                          className={user.status === 'active' ? 'bg-game-green/20 text-game-green' : ''}
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isToggling}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(user.id, user.status)}
                              className={user.status === 'active' ? 'text-destructive' : 'text-game-green'}
                            >
                              {user.status === 'active' ? (
                                <>
                                  <Ban className="w-4 h-4 mr-2" />
                                  Block User
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Unblock User
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* User Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="game-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {(selectedUser.name || 'U').charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{selectedUser.name || 'Unknown'}</h3>
                  <Badge 
                    variant={selectedUser.status === 'active' ? 'default' : 'destructive'}
                    className={selectedUser.status === 'active' ? 'bg-game-green/20 text-game-green' : ''}
                  >
                    {selectedUser.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">Phone</span>
                  </div>
                  <p className="font-medium text-foreground">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Joined</span>
                  </div>
                  <p className="font-medium text-foreground">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Wallet className="w-4 h-4" />
                    <span className="text-sm">Balance</span>
                  </div>
                  <p className="font-medium text-primary">{formatCurrency(selectedUser.balance)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Referral Code</p>
                  <p className="font-medium text-foreground">{selectedUser.referralCode}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-secondary rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-bold text-game-green">
                    {formatCurrency(selectedUser.totalDeposits)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Deposits</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-game-red">
                    {formatCurrency(selectedUser.totalWithdrawals)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Withdrawals</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">
                    {selectedUser.totalBets}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Bets</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  className="flex-1"
                  variant={selectedUser.status === 'active' ? 'destructive' : 'default'}
                  onClick={() => {
                    handleToggleStatus(selectedUser.id, selectedUser.status);
                    setIsDetailOpen(false);
                  }}
                  disabled={isToggling}
                >
                  {selectedUser.status === 'active' ? (
                    <>
                      <Ban className="w-4 h-4 mr-2" />
                      Block User
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Unblock User
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
