import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { useAutoGameController } from "@/hooks/useAutoGameController";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import ColorGame from "./pages/games/ColorGame";
import ParityGame from "./pages/games/ParityGame";
import BigSmallGame from "./pages/games/BigSmallGame";
import DiceGame from "./pages/games/DiceGame";
import NumberGame from "./pages/games/NumberGame";
import SpinGame from "./pages/games/SpinGame";
import Wallet from "./pages/Wallet";
import History from "./pages/History";
import Referral from "./pages/Referral";
import NotFound from "./pages/NotFound";
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import AdminGameControl from "./pages/admin/AdminGameControl";
import AdminBankAccounts from "./pages/admin/AdminBankAccounts";
import AdminUPIAccounts from "./pages/admin/AdminUPIAccounts";
import AdminLotteryControl from "./pages/admin/AdminLotteryControl";

const queryClient = new QueryClient();

function GameControllerInitializer() {
  useAutoGameController();
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <WalletProvider>
          <GameControllerInitializer />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Game Routes */}
              <Route path="/game" element={<ColorGame />} />
              <Route path="/game/color" element={<ColorGame />} />
              <Route path="/game/parity" element={<ParityGame />} />
              <Route path="/game/bigsmall" element={<BigSmallGame />} />
              <Route path="/game/dice" element={<DiceGame />} />
              <Route path="/game/number" element={<NumberGame />} />
              <Route path="/game/spin" element={<SpinGame />} />
              
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/history" element={<History />} />
              <Route path="/referral" element={<Referral />} />
              
{/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="withdrawals" element={<AdminWithdrawals />} />
                <Route path="bank-accounts" element={<AdminBankAccounts />} />
                <Route path="upi-accounts" element={<AdminUPIAccounts />} />
                <Route path="game-control" element={<AdminGameControl />} />
                <Route path="lottery" element={<AdminLotteryControl />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </WalletProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
