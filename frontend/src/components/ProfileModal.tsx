import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { data: session } = useSession();
  const [mode, setMode] = useState<"idle" | "set-password" | "change-password">("idle");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  if (!session?.user) return null;

  const initials = session.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

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
      setMode("idle");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
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
      setMode("idle");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMode("idle");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <User className="size-4 text-primary" />
            </div>
            Profile
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground/50">
            Manage your account settings
          </DialogDescription>
        </DialogHeader>

        {/* User Info */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-4 rounded-xl border border-border/20 bg-muted/10 p-4">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name ?? "User"}
                className="size-12 rounded-full object-cover ring-2 ring-border/30"
              />
            ) : (
              <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-semibold text-primary">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{session.user.name}</p>
              <p className="text-xs text-muted-foreground/50 truncate mt-0.5">{session.user.email}</p>
            </div>
          </div>
        </div>

        <div className="px-6">
          <Separator className="bg-border/20" />
        </div>

        {/* Password Section */}
        <div className="px-6 py-4">
          {mode === "idle" ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground/50">Password</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMode("set-password")}
                  className="rounded-lg border-border/25 text-xs h-8"
                >
                  <Lock className="size-3 mr-1.5" />
                  Set Password
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMode("change-password")}
                  className="rounded-lg border-border/25 text-xs h-8"
                >
                  <Lock className="size-3 mr-1.5" />
                  Change Password
                </Button>
              </div>
            </div>
          ) : mode === "set-password" ? (
            <form onSubmit={handleSetPassword} className="flex flex-col gap-3">
              <p className="text-xs font-medium text-foreground">Set Password</p>
              <p className="text-[11px] text-muted-foreground/40">
                Add a password so you can also sign in with email.
              </p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-password" className="text-xs text-muted-foreground/55">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/25" />
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="8+ characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-9 rounded-lg border-border/25 bg-muted/15 pl-9 pr-9 text-xs placeholder:text-muted-foreground/20"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/25 hover:text-muted-foreground/50"
                  >
                    {showNewPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm-password" className="text-xs text-muted-foreground/55">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/25" />
                  <Input
                    id="confirm-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-9 rounded-lg border-border/25 bg-muted/15 pl-9 text-xs placeholder:text-muted-foreground/20"
                    required
                    minLength={8}
                  />
                </div>
              </div>
              {error && <p className="text-xs text-destructive/80">{error}</p>}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={loading}
                  size="sm"
                  className="rounded-lg bg-primary text-primary-foreground text-xs h-8"
                >
                  {loading ? <Loader2 className="size-3 animate-spin" /> : "Set Password"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode("idle")}
                  className="rounded-lg text-xs h-8 text-muted-foreground/50"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
              <p className="text-xs font-medium text-foreground">Change Password</p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="current-password" className="text-xs text-muted-foreground/55">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/25" />
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-9 rounded-lg border-border/25 bg-muted/15 pl-9 pr-9 text-xs placeholder:text-muted-foreground/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/25 hover:text-muted-foreground/50"
                  >
                    {showCurrentPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-password-change" className="text-xs text-muted-foreground/55">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/25" />
                  <Input
                    id="new-password-change"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="8+ characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-9 rounded-lg border-border/25 bg-muted/15 pl-9 pr-9 text-xs placeholder:text-muted-foreground/20"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/25 hover:text-muted-foreground/50"
                  >
                    {showNewPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm-password-change" className="text-xs text-muted-foreground/55">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/25" />
                  <Input
                    id="confirm-password-change"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-9 rounded-lg border-border/25 bg-muted/15 pl-9 text-xs placeholder:text-muted-foreground/20"
                    required
                    minLength={8}
                  />
                </div>
              </div>
              {error && <p className="text-xs text-destructive/80">{error}</p>}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={loading}
                  size="sm"
                  className="rounded-lg bg-primary text-primary-foreground text-xs h-8"
                >
                  {loading ? <Loader2 className="size-3 animate-spin" /> : "Change Password"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode("idle")}
                  className="rounded-lg text-xs h-8 text-muted-foreground/50"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>

        <div className="border-t border-border/15 px-6 py-3">
          <p className="text-[10px] text-muted-foreground/25 text-center">
            Member since {new Date(session.user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
