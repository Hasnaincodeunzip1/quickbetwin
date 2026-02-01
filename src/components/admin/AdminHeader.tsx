import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RefreshCw } from "lucide-react";

export function AdminHeader() {
  const navigate = useNavigate();
  const { logout, user, profile } = useAuth();

  const handleSwitchAccount = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  const displayName = profile?.name || user?.email?.split("@")[0] || "Admin";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{displayName}</span>
          <span className="text-xs text-muted-foreground">Administrator</span>
        </div>
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
