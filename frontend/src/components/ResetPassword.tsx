import { useState, useEffect } from "react";
import { Lock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function ResetPassword() {
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) setToken(t);
    else setError("Invalid or missing reset token.");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-5">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="size-6 text-emerald-500" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Password reset</h1>
          <p className="mt-2 text-sm text-muted-foreground/60">
            Your password has been updated. You can now sign in.
          </p>
          <Button
            onClick={() => { window.location.href = "/"; }}
            className="mt-6 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold text-foreground">Reset your password</h1>
          <p className="mt-2 text-sm text-muted-foreground/60">
            Enter your new password below.
          </p>
        </div>

        {!token && !error ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground/40" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/15 bg-destructive/5 px-4 py-3 text-sm text-destructive/80 fade-in">
            <AlertCircle className="mr-2 inline size-4" />
            {error}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-password" className="text-xs text-muted-foreground/55">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/25" />
                <Input
                  id="new-password"
                  type="password"
                  placeholder="8+ characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-10 rounded-xl border-border/25 bg-muted/15 pl-9 text-sm placeholder:text-muted-foreground/20"
                  required
                  minLength={8}
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-destructive/80 fade-in">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-10 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Reset Password"}
            </Button>

            <button
              type="button"
              onClick={() => { window.location.href = "/"; }}
              className="text-center text-xs text-muted-foreground/35 hover:text-muted-foreground/50 transition-colors"
            >
              Back to Mekdara
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
