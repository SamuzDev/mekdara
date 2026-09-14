import { useState } from "react";
import { Link, ArrowRight, Loader2, Sparkles, Clipboard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface UrlInputProps {
  onConvert: (url: string) => Promise<void>;
  loading: boolean;
}

export function UrlInput({ onConvert, loading }: UrlInputProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onConvert(url.trim());
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text);
    } catch {
      // clipboard access denied
    }
  };

  return (
    <form className="flex flex-col gap-3 fade-in" onSubmit={handleSubmit}>
      <div className="glass-elevated shimmer-hover glow-focus relative rounded-2xl transition-all duration-500">
        <div className="flex items-center gap-3 px-4">
          <Link className="size-4 shrink-0 text-muted-foreground/35" />
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste any URL..."
            className="h-12 border-0 bg-transparent py-3 pl-0 text-sm placeholder:text-muted-foreground/25 focus-visible:ring-0 focus-visible:ring-offset-0"
            required
            disabled={loading}
            aria-label="URL of the page to convert"
          />
          {url && (
            <button
              type="button"
              onClick={handlePaste}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground/30 transition-colors hover:bg-muted/30 hover:text-muted-foreground/60"
              aria-label="Paste from clipboard"
            >
              <Clipboard className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading || !url.trim()}
        className="group h-11 rounded-xl bg-primary text-primary-foreground font-medium transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_0_20px_oklch(0.65_0.2_265/0.15)] active:scale-[0.98]"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Converting...
          </>
        ) : (
          <>
            <Sparkles className="size-4 transition-transform group-hover:scale-110" />
            Convert to Markdown
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </Button>

      {!url && (
        <p className="text-center text-[11px] text-muted-foreground/25">
          Press Enter to convert
        </p>
      )}
    </form>
  );
}
