import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { useAutoGameController } from "@/hooks/useAutoGameController";

// Eager load critical routes
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

// Lazy load less critical routes
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ColorGame = lazy(() => import("./pages/games/ColorGame"));
const ParityGame = lazy(() => import("./pages/games/ParityGame"));
const BigSmallGame = lazy(() => import("./pages/games/BigSmallGame"));
const DiceGame = lazy(() => import("./pages/games/DiceGame"));
const NumberGame = lazy(() => import("./pages/games/NumberGame"));
const SpinGame = lazy(() => import("./pages/games/SpinGame"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Profile = lazy(() => import("./pages/Profile"));
const Referral = lazy(() => import("./pages/Referral"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminWithdrawals = lazy(() => import("./pages/admin/AdminWithdrawals"));
const AdminGameControl = lazy(() => import("./pages/admin/AdminGameControl"));
const AdminBankAccounts = lazy(() => import("./pages/admin/AdminBankAccounts"));
const AdminUPIAccounts = lazy(() => import("./pages/admin/AdminUPIAccounts"));
const AdminLotteryControl = lazy(() => import("./pages/admin/AdminLotteryControl"));

const queryClient = new QueryClient();

function GameControllerInitializer() {
  useAutoGameController();
  return null;
}

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <WalletProvider>
          <GameControllerInitializer />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
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
                <Route path="/profile" element={<Profile />} />
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
            </Suspense>
          </BrowserRouter>
        </WalletProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
