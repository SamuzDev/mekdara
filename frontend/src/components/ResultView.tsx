import { useState, useEffect } from "react";
import { Copy, Check, FileText, Code, Download, FileCode } from "lucide-react";
import Markdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ResultViewProps {
  markdown: string;
  tokens: { markdown: number; raw: number } | null;
  title?: string;
  loading?: boolean;
}

export function ResultView({ markdown, tokens, title, loading }: ResultViewProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    toast.success("Copied to clipboard");
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = title ? `${title.slice(0, 50).replace(/[^a-z0-9]/gi, "-").toLowerCase()}.md` : "mekdara-output.md";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("File downloaded");
  };

  if (loading) {
    return (
      <div className="glass-elevated rounded-2xl overflow-hidden fade-in">
        <div className="flex items-center gap-3 border-b border-border/20 px-5 py-3">
          <div className="skeleton size-7 rounded-lg" />
          <div className="skeleton h-4 w-40 rounded" />
        </div>
        <div className="p-6 space-y-3">
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-4/5 rounded" />
          <div className="skeleton h-3 w-3/5 rounded" />
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-2/3 rounded" />
        </div>
      </div>
    );
  }

  if (!markdown) {
    return (
      <div className="glass flex flex-col items-center justify-center gap-3 rounded-2xl py-14 text-center fade-in">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-border/25 bg-muted/8">
          <FileText className="size-5 text-muted-foreground/18" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground/35">Output appears here</p>
          <p className="mt-0.5 text-xs text-muted-foreground/18">Convert a URL or upload a file to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-elevated rounded-2xl overflow-hidden border-gradient fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/20 px-5 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <FileCode className="size-3 text-primary" />
          </div>
          <span className="truncate text-sm font-medium text-foreground/75">
            {title ?? "Converted Output"}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {tokens && (
            <Badge
              variant="secondary"
              className="rounded-md border-border/20 bg-muted/25 font-mono text-[10px] px-2 py-0.5"
            >
              {tokens.markdown.toLocaleString()} tokens
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleDownload}
            className="text-muted-foreground/40 hover:text-foreground"
            aria-label="Download markdown file"
          >
            <Download className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleCopy}
            className="text-muted-foreground/40 hover:text-foreground"
            aria-label="Copy to clipboard"
          >
            {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          </Button>
        </div>
      </div>

      {/* Tabs + Content */}
      <Tabs defaultValue="preview" className="p-0">
        <TabsList
          variant="line"
          className="w-full justify-start rounded-none border-b border-border/15 px-5"
        >
          <TabsTrigger value="preview" className="gap-1.5 text-xs">
            <FileText className="size-3" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="raw" className="gap-1.5 text-xs">
            <Code className="size-3" />
            Raw
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="max-h-[500px] overflow-y-auto p-6">
          <div
            className="prose prose-invert prose-sm max-w-none
              prose-headings:text-foreground prose-headings:font-semibold prose-headings:tracking-tight
              prose-p:text-muted-foreground/65 prose-li:text-muted-foreground/65
              prose-code:text-primary/85 prose-code:bg-muted/35 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-code:font-mono
              prose-pre:bg-muted/25 prose-pre:border prose-pre:border-border/25 prose-pre:rounded-xl
              prose-strong:text-foreground/85
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-hr:border-border/25"
          >
            <Markdown>{markdown}</Markdown>
          </div>
        </TabsContent>

        <TabsContent value="raw" className="max-h-[500px] overflow-y-auto">
          <pre className="p-6 font-mono text-[12px] leading-relaxed text-muted-foreground/55 whitespace-pre-wrap break-words">
            {markdown}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
}
