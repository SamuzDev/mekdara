import { useState } from "react";
import { Copy, Check, Trash2, KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentKey: string | null;
  onSave: (key: string) => void;
  onClear: () => void;
}

function generateKey(): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return "mk_" + Array.from(array, (b) => b.toString(36).padStart(2, "0")).join("");
}

export function ApiKeyModal({ open, onOpenChange, currentKey, onSave, onClear }: ApiKeyModalProps) {
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    setNewKey(generateKey());
  };

  const handleCopy = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (newKey) {
      onSave(newKey);
      setNewKey(null);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setNewKey(null);
      }}
    >
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <KeyRound className="size-4 text-primary" />
            </div>
            API Key
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground/50">
            {currentKey
              ? "Manage your API key for higher rate limits"
              : "Generate an API key for 200 req/hour"}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5">
          {currentKey ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl bg-muted/20 border border-border/20 px-3.5 py-2.5">
                <code className="flex-1 truncate font-mono text-xs text-muted-foreground/70">
                  {currentKey.slice(0, 12)}...{currentKey.slice(-4)}
                </code>
                <button
                  onClick={() => handleCopy(currentKey)}
                  className="shrink-0 rounded-md p-1 text-muted-foreground/30 transition-colors hover:bg-muted/30 hover:text-muted-foreground/60"
                  aria-label="Copy API key"
                >
                  {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                </button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onClear()}
                  className="flex-1 gap-1.5 rounded-xl border-destructive/20 text-destructive/70 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30"
                >
                  <Trash2 className="size-3.5" />
                  Remove
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 rounded-xl border-border/25"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : newKey ? (
            <div className="space-y-3 fade-in">
              <div className="flex items-center gap-2 rounded-xl bg-muted/20 border border-border/20 px-3.5 py-2.5">
                <code className="flex-1 break-all font-mono text-xs text-foreground/80">
                  {newKey}
                </code>
                <button
                  onClick={() => handleCopy(newKey)}
                  className="shrink-0 rounded-md p-1 text-muted-foreground/30 transition-colors hover:bg-muted/30 hover:text-muted-foreground/60"
                  aria-label="Copy API key"
                >
                  {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground/35">
                Copy this key now. It won&apos;t be shown again.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Save Key
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewKey(null)}
                  className="rounded-xl border-border/25"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground/50">
                An API key gives you 200 requests per hour instead of 20.
                The key is stored in your browser&apos;s localStorage only.
              </p>
              <Button
                onClick={handleGenerate}
                className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Generate API Key
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
