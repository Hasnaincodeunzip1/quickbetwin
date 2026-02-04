import { Link, useLocation } from 'react-router-dom';
import { Home, ArrowDownCircle, ArrowUpCircle, User } from 'lucide-react';

export function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === '/dashboard') return currentPath === '/dashboard' || currentPath === '/';
    if (path === '/profile') return currentPath === '/profile' || currentPath === '/referral';
    return currentPath.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#1a1f4e] via-[#1e2761] to-[#1a1f4e] border-t border-primary/20 z-50">
      <div className="container max-w-lg mx-auto px-4">
        <div className="flex items-center justify-around py-3">
          <Link 
            to="/dashboard" 
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </Link>
          <Link 
            to="/wallet?action=deposit" 
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentPath === '/wallet' && location.search.includes('deposit') 
                ? 'text-game-green' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="relative">
              <ArrowDownCircle className="w-6 h-6 text-game-green" />
            </div>
            <span className="text-xs font-medium">Deposit</span>
          </Link>
          <Link 
            to="/wallet?action=withdraw" 
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentPath === '/wallet' && location.search.includes('withdraw') 
                ? 'text-game-red' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="relative">
              <ArrowUpCircle className="w-6 h-6 text-game-red" />
            </div>
            <span className="text-xs font-medium">Withdraw</span>
          </Link>
          <Link 
            to="/profile" 
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive('/profile') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
