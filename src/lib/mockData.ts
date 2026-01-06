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
}

export interface GameRound {
  id: string;
  roundNumber: number;
  duration: 1 | 3 | 5; // minutes
  result?: 'red' | 'green' | 'violet';
  startTime: string;
  endTime: string;
  status: 'betting' | 'locked' | 'completed';
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
  type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'referral_bonus';
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: string;
  reference?: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  bonus: number;
  createdAt: string;
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
  { id: 'g1', roundNumber: 2024010150, duration: 1, result: 'green', startTime: '2024-01-15T10:49:00Z', endTime: '2024-01-15T10:50:00Z', status: 'completed' },
  { id: 'g2', roundNumber: 2024010149, duration: 1, result: 'red', startTime: '2024-01-15T10:48:00Z', endTime: '2024-01-15T10:49:00Z', status: 'completed' },
  { id: 'g3', roundNumber: 2024010148, duration: 1, result: 'violet', startTime: '2024-01-15T10:47:00Z', endTime: '2024-01-15T10:48:00Z', status: 'completed' },
  { id: 'g4', roundNumber: 2024010147, duration: 1, result: 'green', startTime: '2024-01-15T10:46:00Z', endTime: '2024-01-15T10:47:00Z', status: 'completed' },
  { id: 'g5', roundNumber: 2024010146, duration: 1, result: 'red', startTime: '2024-01-15T10:45:00Z', endTime: '2024-01-15T10:46:00Z', status: 'completed' },
  { id: 'g6', roundNumber: 2024010145, duration: 1, result: 'green', startTime: '2024-01-15T10:44:00Z', endTime: '2024-01-15T10:45:00Z', status: 'completed' },
  { id: 'g7', roundNumber: 2024010144, duration: 1, result: 'red', startTime: '2024-01-15T10:43:00Z', endTime: '2024-01-15T10:44:00Z', status: 'completed' },
  { id: 'g8', roundNumber: 2024010143, duration: 1, result: 'violet', startTime: '2024-01-15T10:42:00Z', endTime: '2024-01-15T10:43:00Z', status: 'completed' },
  { id: 'g9', roundNumber: 2024010142, duration: 1, result: 'green', startTime: '2024-01-15T10:41:00Z', endTime: '2024-01-15T10:42:00Z', status: 'completed' },
  { id: 'g10', roundNumber: 2024010141, duration: 1, result: 'red', startTime: '2024-01-15T10:40:00Z', endTime: '2024-01-15T10:41:00Z', status: 'completed' },
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
  { id: 'user_1', phone: '+91 98765 43210', email: 'player@example.com', name: 'Lucky Player', balance: 2500, referralCode: 'LUCKY2024', createdAt: '2024-01-15T10:00:00Z' },
  { id: 'user_2', phone: '+91 87654 32109', name: 'Ravi Kumar', balance: 1500, referralCode: 'RAVI2024', referredBy: 'LUCKY2024', createdAt: '2024-01-15T10:00:00Z' },
  { id: 'user_3', phone: '+91 76543 21098', name: 'Priya Sharma', balance: 3200, referralCode: 'PRIYA2024', referredBy: 'LUCKY2024', createdAt: '2024-01-14T15:00:00Z' },
  { id: 'user_4', phone: '+91 65432 10987', name: 'Amit Patel', balance: 800, referralCode: 'AMIT2024', referredBy: 'LUCKY2024', createdAt: '2024-01-13T12:00:00Z' },
  { id: 'user_5', phone: '+91 54321 09876', name: 'Neha Singh', balance: 5000, referralCode: 'NEHA2024', createdAt: '2024-01-12T09:00:00Z' },
];

export const mockPendingWithdrawals: Transaction[] = [
  { id: 'w1', userId: 'user_1', type: 'withdrawal', amount: 500, status: 'pending', createdAt: '2024-01-15T18:00:00Z', reference: 'Bank: HDFC ****1234' },
  { id: 'w2', userId: 'user_3', type: 'withdrawal', amount: 1000, status: 'pending', createdAt: '2024-01-15T17:30:00Z', reference: 'Bank: ICICI ****5678' },
  { id: 'w3', userId: 'user_5', type: 'withdrawal', amount: 2000, status: 'pending', createdAt: '2024-01-15T16:00:00Z', reference: 'Bank: SBI ****9012' },
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
