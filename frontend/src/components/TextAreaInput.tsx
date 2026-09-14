import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface TextAreaInputProps {
  onConvert: (content: string) => Promise<void>;
  loading: boolean;
  placeholder?: string;
  label?: string;
  buttonText?: string;
}

export function TextAreaInput({
  onConvert,
  loading,
  placeholder = "Paste your content here...",
  label = "Content to convert",
  buttonText = "Convert",
}: TextAreaInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const textarea = form.querySelector("textarea");
    if (textarea?.value.trim()) onConvert(textarea.value.trim());
  };

  return (
    <form className="flex flex-col gap-3 fade-in" onSubmit={handleSubmit}>
      <div className="glass-elevated glow-focus rounded-2xl transition-all duration-500">
        <Textarea
          placeholder={placeholder}
          className="min-h-[180px] border-0 bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground/25 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
          disabled={loading}
          aria-label={label}
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
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
            {buttonText}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </Button>
    </form>
  );
}
