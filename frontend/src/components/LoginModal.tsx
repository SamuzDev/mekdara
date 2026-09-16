import { useState } from "react";
import { Mail, Lock, User, Loader2, LogIn } from "lucide-react";
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
import { signIn, signUp, authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        const result = await signUp.email({ name, email, password });
        if (result.error) throw new Error(result.error.message);
      } else {
        const result = await signIn.email({ email, password });
        if (result.error) throw new Error(result.error.message);
      }
      onOpenChange(false);
      toast.success(mode === "login" ? "Welcome back!" : "Account created!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await authClient.forgetPassword({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (result.error) throw new Error(result.error.message);
      setResetSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signIn.social({ provider: "github", callbackURL: window.location.origin });
      if (result.error) throw new Error(result.error.message);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "GitHub login failed");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMode("login");
    setName("");
    setEmail("");
    setPassword("");
    setError(null);
    setResetSent(false);
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
              <LogIn className="size-4 text-primary" />
            </div>
            {mode === "forgot" ? "Reset Password" : mode === "login" ? "Sign In" : "Create Account"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground/50">
            {mode === "forgot" ? "Enter your email to receive a reset link" : mode === "login" ? "Sign in for higher limits" : "500 req/hour when signed in"}
          </DialogDescription>
        </DialogHeader>

        {mode === "forgot" && resetSent ? (
          <div className="px-6 pb-6 text-center">
            <p className="text-sm text-muted-foreground/70 mb-4">
              If that email exists, we&apos;ve sent a password reset link. Check your inbox.
            </p>
            <Button
              variant="outline"
              onClick={() => { setMode("login"); setResetSent(false); }}
              className="rounded-xl border-border/25 text-sm"
            >
              Back to Sign In
            </Button>
          </div>
        ) : mode === "forgot" ? (
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-3.5 px-6 pb-6">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reset-email" className="text-xs text-muted-foreground/55">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/25" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 rounded-xl border-border/25 bg-muted/15 pl-9 text-sm placeholder:text-muted-foreground/20"
                  required
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
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Send Reset Link"}
            </Button>

            <button
              type="button"
              onClick={() => setMode("login")}
              className="text-center text-xs text-muted-foreground/35 hover:text-muted-foreground/50 transition-colors"
            >
              Back to Sign In
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 px-6">
              {mode === "signup" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name" className="text-xs text-muted-foreground/55">Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/25" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-10 rounded-xl border-border/25 bg-muted/15 pl-9 text-sm placeholder:text-muted-foreground/20"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-xs text-muted-foreground/55">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/25" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 rounded-xl border-border/25 bg-muted/15 pl-9 text-sm placeholder:text-muted-foreground/20"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs text-muted-foreground/55">Password</Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-[11px] text-muted-foreground/35 hover:text-muted-foreground/50 transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/25" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="8+ characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 rounded-xl border-border/25 bg-muted/15 pl-9 text-sm placeholder:text-muted-foreground/20"
                    required
                    minLength={8}
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
                {loading ? <Loader2 className="size-4 animate-spin" /> : mode === "login" ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <div className="relative my-4 px-6">
              <Separator className="bg-border/20" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-[10px] text-muted-foreground/25 uppercase tracking-widest">
                or
              </span>
            </div>

            <div className="px-6 pb-6">
              <Button
                variant="outline"
                onClick={handleGithubLogin}
                disabled={loading}
                className="w-full gap-2 rounded-xl border-border/25 text-sm hover:bg-muted/25"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Continue with GitHub
              </Button>
            </div>

            <div className="border-t border-border/15 px-6 py-3 text-center text-xs text-muted-foreground/35">
              {mode === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="font-medium text-primary/70 hover:text-primary transition-colors"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="font-medium text-primary/70 hover:text-primary transition-colors"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
