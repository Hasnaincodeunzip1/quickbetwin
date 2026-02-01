import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, RefreshCw } from "lucide-react";

export function AdminHeader() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleSwitchAccount = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Logged in as <span className="font-medium text-foreground">{user?.email}</span>
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSwitchAccount}
        className="gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Switch Account
      </Button>
    </header>
  );
}
