import { useState } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Lock, KeyRound, Copy, Check, Trash2, RefreshCw, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface UserProfilePopoverProps {
  apiKey: string | null;
  onSaveApiKey: (key: string) => void;
  onClearApiKey: () => void;
}

function generateKey(): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return "mk_" + Array.from(array, (b) => b.toString(36).padStart(2, "0")).join("");
}

export function UserProfilePopover({ apiKey, onSaveApiKey, onClearApiKey }: UserProfilePopoverProps) {
  const { data: session } = useSession();
  const [mode, setMode] = useState<"idle" | "set-password" | "change-password">("idle");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  if (!session?.user) return null;

  const hasPassword = Boolean((session.user as Record<string, unknown>).credentialId);

  const initials = session.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

  const resetForm = () => {
    setMode("idle");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setShowNewPassword(false);
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to set password");
      toast.success("Password set successfully");
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to change password");
      toast.success("Password changed successfully");
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = async () => {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleGenerateKey = () => {
    const key = generateKey();
    onSaveApiKey(key);
    toast.success("API key generated");
  };

  return (
    <DropdownMenu onOpenChange={(open) => { if (!open) resetForm(); }}>
      <DropdownMenuTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground outline-none">
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name ?? "User"}
            className="size-5 rounded-full object-cover ring-1 ring-border/30"
          />
        ) : (
          <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-medium text-primary">
            {initials}
          </div>
        )}
        {session.user.name ?? "User"}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 p-0 overflow-hidden">
        {/* Profile Header */}
        <div className="px-4 py-3.5 flex items-center gap-3">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name ?? "User"}
              className="size-10 rounded-full object-cover ring-2 ring-border/30"
            />
          ) : (
            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{session.user.name}</p>
            <p className="text-xs text-muted-foreground/50 truncate">{session.user.email}</p>
          </div>
        </div>

        <DropdownMenuSeparator className="bg-border/15" />

        {/* Password Section — only the applicable option */}
        <div className="px-4 py-3">
          {mode === "idle" ? (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] text-muted-foreground/40 uppercase tracking-wider font-medium">Password</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMode(hasPassword ? "change-password" : "set-password")}
                className="rounded-lg border-border/25 text-[11px] h-7 w-full justify-start"
              >
                <Lock className="size-3 mr-1.5" />
                {hasPassword ? "Change Password" : "Set Password"}
              </Button>
            </div>
          ) : mode === "set-password" ? (
            <form onSubmit={handleSetPassword} className="flex flex-col gap-2">
              <p className="text-[11px] font-medium text-foreground">Set Password</p>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground/25" />
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New password (8+ chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-8 rounded-lg border-border/25 bg-muted/15 pl-8 pr-8 text-[11px] placeholder:text-muted-foreground/20"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/25 hover:text-muted-foreground/50"
                >
                  {showNewPassword ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                </button>
              </div>
              <Input
                type={showNewPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-8 rounded-lg border-border/25 bg-muted/15 text-[11px] placeholder:text-muted-foreground/20"
                required
                minLength={8}
              />
              {error && <p className="text-[10px] text-destructive/80">{error}</p>}
              <div className="flex gap-1.5">
                <Button type="submit" disabled={loading} size="sm" className="rounded-lg bg-primary text-primary-foreground text-[11px] h-7 flex-1">
                  {loading ? <Loader2 className="size-3 animate-spin" /> : "Set"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={resetForm} className="rounded-lg text-[11px] h-7 text-muted-foreground/50">
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="flex flex-col gap-2">
              <p className="text-[11px] font-medium text-foreground">Change Password</p>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground/25" />
                <Input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-8 rounded-lg border-border/25 bg-muted/15 pl-8 text-[11px] placeholder:text-muted-foreground/20"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground/25" />
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New password (8+ chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-8 rounded-lg border-border/25 bg-muted/15 pl-8 pr-8 text-[11px] placeholder:text-muted-foreground/20"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/25 hover:text-muted-foreground/50"
                >
                  {showNewPassword ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                </button>
              </div>
              <Input
                type={showNewPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-8 rounded-lg border-border/25 bg-muted/15 text-[11px] placeholder:text-muted-foreground/20"
                required
                minLength={8}
              />
              {error && <p className="text-[10px] text-destructive/80">{error}</p>}
              <div className="flex gap-1.5">
                <Button type="submit" disabled={loading} size="sm" className="rounded-lg bg-primary text-primary-foreground text-[11px] h-7 flex-1">
                  {loading ? <Loader2 className="size-3 animate-spin" /> : "Change"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={resetForm} className="rounded-lg text-[11px] h-7 text-muted-foreground/50">
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>

        <DropdownMenuSeparator className="bg-border/15" />

        {/* API Key Section */}
        <div className="px-4 py-3">
          <p className="text-[11px] text-muted-foreground/40 uppercase tracking-wider font-medium mb-2">API Key</p>
          {apiKey ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 rounded-lg bg-muted/20 border border-border/20 px-2.5 py-1.5">
                <code className="flex-1 truncate font-mono text-[10px] text-muted-foreground/60">
                  {apiKey.slice(0, 10)}...{apiKey.slice(-4)}
                </code>
                <button
                  onClick={handleCopyKey}
                  className="shrink-0 rounded p-0.5 text-muted-foreground/30 transition-colors hover:text-muted-foreground/60"
                  aria-label="Copy API key"
                >
                  {copiedKey ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                </button>
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateKey}
                  className="rounded-lg border-border/25 text-[11px] h-7 flex-1"
                >
                  <RefreshCw className="size-3 mr-1" />
                  Regenerate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearApiKey}
                  className="rounded-lg border-destructive/20 text-destructive/70 hover:bg-destructive/5 text-[11px] h-7"
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateKey}
              className="rounded-lg border-border/25 text-[11px] h-7 w-full"
            >
              <KeyRound className="size-3 mr-1.5" />
              Generate API Key
            </Button>
          )}
        </div>

        <DropdownMenuSeparator className="bg-border/15" />

        {/* Sign Out */}
        <div className="p-1.5">
          <DropdownMenuItem
            onClick={() => signOut()}
            className="flex items-center gap-2 text-xs text-destructive/80 cursor-pointer rounded-lg px-3 py-2"
          >
            <LogOut className="size-3.5" />
            Sign Out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
