// Mock data for UI prototype

export interface User {
  id: string;
  phone: string;
  email?: string;
  name: string;
  balance: number;
  referralCode: string;
  referredBy?: string;
  createdAt: string;
  isAdmin?: boolean;
  status?: 'active' | 'blocked';
  totalDeposits?: number;
  totalWithdrawals?: number;
  totalBets?: number;
}

export interface GameRound {
  id: string;
  roundNumber: number;
  duration: 1 | 3 | 5; // minutes
  result?: 'red' | 'green' | 'violet';
  startTime: string;
  endTime: string;
  status: 'betting' | 'locked' | 'completed';
  totalBets?: number;
  totalAmount?: number;
}

export interface Bet {
  id: string;
  roundId: string;
  userId: string;
  color: 'red' | 'green' | 'violet';
  amount: number;
  won: boolean | null;
  payout: number | null;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userName?: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'referral_bonus';
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: string;
  reference?: string;
  bankDetails?: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  bonus: number;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  totalPayouts: number;
  pendingWithdrawals: number;
  todayBets: number;
  todayRevenue: number;
  profitMargin: number;
}

// Mock current user
export const mockUser: User = {
  id: 'user_1',
  phone: '+91 98765 43210',
  email: 'player@example.com',
  name: 'Lucky Player',
  balance: 2500,
  referralCode: 'LUCKY2024',
  createdAt: '2024-01-15T10:00:00Z',
};

// Mock game history
export const mockGameHistory: GameRound[] = [
  { id: 'g1', roundNumber: 2024010150, duration: 1, result: 'green', startTime: '2024-01-15T10:49:00Z', endTime: '2024-01-15T10:50:00Z', status: 'completed', totalBets: 150, totalAmount: 45000 },
  { id: 'g2', roundNumber: 2024010149, duration: 1, result: 'red', startTime: '2024-01-15T10:48:00Z', endTime: '2024-01-15T10:49:00Z', status: 'completed', totalBets: 180, totalAmount: 52000 },
  { id: 'g3', roundNumber: 2024010148, duration: 1, result: 'violet', startTime: '2024-01-15T10:47:00Z', endTime: '2024-01-15T10:48:00Z', status: 'completed', totalBets: 120, totalAmount: 38000 },
  { id: 'g4', roundNumber: 2024010147, duration: 1, result: 'green', startTime: '2024-01-15T10:46:00Z', endTime: '2024-01-15T10:47:00Z', status: 'completed', totalBets: 200, totalAmount: 61000 },
  { id: 'g5', roundNumber: 2024010146, duration: 1, result: 'red', startTime: '2024-01-15T10:45:00Z', endTime: '2024-01-15T10:46:00Z', status: 'completed', totalBets: 165, totalAmount: 48000 },
  { id: 'g6', roundNumber: 2024010145, duration: 1, result: 'green', startTime: '2024-01-15T10:44:00Z', endTime: '2024-01-15T10:45:00Z', status: 'completed', totalBets: 140, totalAmount: 42000 },
  { id: 'g7', roundNumber: 2024010144, duration: 1, result: 'red', startTime: '2024-01-15T10:43:00Z', endTime: '2024-01-15T10:44:00Z', status: 'completed', totalBets: 155, totalAmount: 47000 },
  { id: 'g8', roundNumber: 2024010143, duration: 1, result: 'violet', startTime: '2024-01-15T10:42:00Z', endTime: '2024-01-15T10:43:00Z', status: 'completed', totalBets: 130, totalAmount: 40000 },
  { id: 'g9', roundNumber: 2024010142, duration: 1, result: 'green', startTime: '2024-01-15T10:41:00Z', endTime: '2024-01-15T10:42:00Z', status: 'completed', totalBets: 175, totalAmount: 53000 },
  { id: 'g10', roundNumber: 2024010141, duration: 1, result: 'red', startTime: '2024-01-15T10:40:00Z', endTime: '2024-01-15T10:41:00Z', status: 'completed', totalBets: 160, totalAmount: 49000 },
];

// Mock user bets
export const mockBets: Bet[] = [
  { id: 'b1', roundId: 'g1', userId: 'user_1', color: 'green', amount: 100, won: true, payout: 200, createdAt: '2024-01-15T10:49:30Z' },
  { id: 'b2', roundId: 'g2', userId: 'user_1', color: 'green', amount: 50, won: false, payout: 0, createdAt: '2024-01-15T10:48:30Z' },
  { id: 'b3', roundId: 'g3', userId: 'user_1', color: 'violet', amount: 100, won: true, payout: 450, createdAt: '2024-01-15T10:47:30Z' },
  { id: 'b4', roundId: 'g4', userId: 'user_1', color: 'red', amount: 200, won: false, payout: 0, createdAt: '2024-01-15T10:46:30Z' },
  { id: 'b5', roundId: 'g5', userId: 'user_1', color: 'red', amount: 150, won: true, payout: 300, createdAt: '2024-01-15T10:45:30Z' },
];

// Mock transactions
export const mockTransactions: Transaction[] = [
  { id: 't1', userId: 'user_1', type: 'win', amount: 200, status: 'completed', createdAt: '2024-01-15T10:50:00Z', reference: 'Round #2024010150' },
  { id: 't2', userId: 'user_1', type: 'bet', amount: -100, status: 'completed', createdAt: '2024-01-15T10:49:30Z', reference: 'Round #2024010150' },
  { id: 't3', userId: 'user_1', type: 'deposit', amount: 1000, status: 'completed', createdAt: '2024-01-15T10:30:00Z', reference: 'Razorpay #RP12345' },
  { id: 't4', userId: 'user_1', type: 'referral_bonus', amount: 100, status: 'completed', createdAt: '2024-01-15T10:00:00Z', reference: 'Referred: Ravi K.' },
  { id: 't5', userId: 'user_1', type: 'withdrawal', amount: -500, status: 'pending', createdAt: '2024-01-14T18:00:00Z', reference: 'Bank: HDFC ****1234' },
];

// Mock referrals
export const mockReferrals: Referral[] = [
  { id: 'r1', referrerId: 'user_1', referredUserId: 'user_2', bonus: 100, createdAt: '2024-01-15T10:00:00Z' },
  { id: 'r2', referrerId: 'user_1', referredUserId: 'user_3', bonus: 100, createdAt: '2024-01-14T15:00:00Z' },
  { id: 'r3', referrerId: 'user_1', referredUserId: 'user_4', bonus: 100, createdAt: '2024-01-13T12:00:00Z' },
];

// Admin mock data
export const mockAllUsers: User[] = [
  { id: 'user_1', phone: '+91 98765 43210', email: 'player@example.com', name: 'Lucky Player', balance: 2500, referralCode: 'LUCKY2024', createdAt: '2024-01-15T10:00:00Z', status: 'active', totalDeposits: 15000, totalWithdrawals: 8000, totalBets: 120 },
  { id: 'user_2', phone: '+91 87654 32109', name: 'Ravi Kumar', balance: 1500, referralCode: 'RAVI2024', referredBy: 'LUCKY2024', createdAt: '2024-01-15T10:00:00Z', status: 'active', totalDeposits: 10000, totalWithdrawals: 5000, totalBets: 85 },
  { id: 'user_3', phone: '+91 76543 21098', name: 'Priya Sharma', balance: 3200, referralCode: 'PRIYA2024', referredBy: 'LUCKY2024', createdAt: '2024-01-14T15:00:00Z', status: 'active', totalDeposits: 20000, totalWithdrawals: 12000, totalBets: 150 },
  { id: 'user_4', phone: '+91 65432 10987', name: 'Amit Patel', balance: 800, referralCode: 'AMIT2024', referredBy: 'LUCKY2024', createdAt: '2024-01-13T12:00:00Z', status: 'blocked', totalDeposits: 5000, totalWithdrawals: 3500, totalBets: 45 },
  { id: 'user_5', phone: '+91 54321 09876', name: 'Neha Singh', balance: 5000, referralCode: 'NEHA2024', createdAt: '2024-01-12T09:00:00Z', status: 'active', totalDeposits: 25000, totalWithdrawals: 15000, totalBets: 200 },
  { id: 'user_6', phone: '+91 43210 98765', name: 'Vikram Joshi', balance: 12500, referralCode: 'VIKRAM2024', createdAt: '2024-01-11T08:00:00Z', status: 'active', totalDeposits: 50000, totalWithdrawals: 30000, totalBets: 350 },
  { id: 'user_7', phone: '+91 32109 87654', name: 'Anjali Verma', balance: 750, referralCode: 'ANJALI2024', referredBy: 'NEHA2024', createdAt: '2024-01-10T14:00:00Z', status: 'active', totalDeposits: 3000, totalWithdrawals: 1500, totalBets: 30 },
  { id: 'user_8', phone: '+91 21098 76543', name: 'Rohit Mehta', balance: 0, referralCode: 'ROHIT2024', createdAt: '2024-01-09T11:00:00Z', status: 'blocked', totalDeposits: 2000, totalWithdrawals: 2000, totalBets: 25 },
];

export const mockPendingWithdrawals: Transaction[] = [
  { id: 'w1', userId: 'user_1', userName: 'Lucky Player', type: 'withdrawal', amount: 500, status: 'pending', createdAt: '2024-01-15T18:00:00Z', reference: 'Bank: HDFC ****1234', bankDetails: 'HDFC Bank, A/c: ****1234, IFSC: HDFC0001234' },
  { id: 'w2', userId: 'user_3', userName: 'Priya Sharma', type: 'withdrawal', amount: 1000, status: 'pending', createdAt: '2024-01-15T17:30:00Z', reference: 'Bank: ICICI ****5678', bankDetails: 'ICICI Bank, A/c: ****5678, IFSC: ICIC0005678' },
  { id: 'w3', userId: 'user_5', userName: 'Neha Singh', type: 'withdrawal', amount: 2000, status: 'pending', createdAt: '2024-01-15T16:00:00Z', reference: 'Bank: SBI ****9012', bankDetails: 'SBI Bank, A/c: ****9012, IFSC: SBIN0009012' },
  { id: 'w4', userId: 'user_6', userName: 'Vikram Joshi', type: 'withdrawal', amount: 5000, status: 'pending', createdAt: '2024-01-15T15:00:00Z', reference: 'Bank: Axis ****3456', bankDetails: 'Axis Bank, A/c: ****3456, IFSC: UTIB0003456' },
  { id: 'w5', userId: 'user_7', userName: 'Anjali Verma', type: 'withdrawal', amount: 300, status: 'pending', createdAt: '2024-01-15T14:30:00Z', reference: 'Bank: PNB ****7890', bankDetails: 'PNB Bank, A/c: ****7890, IFSC: PUNB0007890' },
];

export const mockAdminStats: AdminStats = {
  totalUsers: 5234,
  activeUsers: 1847,
  totalRevenue: 12500000,
  totalPayouts: 9800000,
  pendingWithdrawals: 8800,
  todayBets: 4521,
  todayRevenue: 450000,
  profitMargin: 21.6,
};

// Chart data for admin analytics
export const mockRevenueChartData = [
  { date: 'Jan 9', revenue: 320000, payouts: 250000 },
  { date: 'Jan 10', revenue: 380000, payouts: 290000 },
  { date: 'Jan 11', revenue: 420000, payouts: 340000 },
  { date: 'Jan 12', revenue: 390000, payouts: 310000 },
  { date: 'Jan 13', revenue: 480000, payouts: 380000 },
  { date: 'Jan 14', revenue: 520000, payouts: 420000 },
  { date: 'Jan 15', revenue: 450000, payouts: 360000 },
];

export const mockBetDistribution = [
  { color: 'Red', value: 42, fill: 'hsl(0 80% 55%)' },
  { color: 'Green', value: 38, fill: 'hsl(142 76% 45%)' },
  { color: 'Violet', value: 20, fill: 'hsl(270 80% 55%)' },
];

export const mockUserGrowthData = [
  { date: 'Jan 9', users: 4850 },
  { date: 'Jan 10', users: 4920 },
  { date: 'Jan 11', users: 5010 },
  { date: 'Jan 12', users: 5080 },
  { date: 'Jan 13', users: 5140 },
  { date: 'Jan 14', users: 5190 },
  { date: 'Jan 15', users: 5234 },
];

// Helper functions
export const getColorClass = (color: 'red' | 'green' | 'violet') => {
  switch (color) {
    case 'red': return 'bg-game-red';
    case 'green': return 'bg-game-green';
    case 'violet': return 'bg-game-violet';
  }
};

export const getColorMultiplier = (color: 'red' | 'green' | 'violet') => {
  return color === 'violet' ? 4.5 : 2;
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatTime = (date: string) => {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};
