import { useState, useRef, useCallback } from "react";
import { Upload, File, X, ArrowRight, Loader2, Sparkles, FileText, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onConvert: (file: File) => Promise<void>;
  loading: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return FileText;
  if (["docx", "doc"].includes(ext ?? "")) return FileText;
  if (["png", "jpg", "jpeg", "gif", "svg"].includes(ext ?? "")) return FileImage;
  return File;
}

function getFileType(name: string): string {
  return name.split(".").pop()?.toUpperCase() ?? "FILE";
}

export function FileUpload({ onConvert, loading }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (f) setFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0] ?? null);
  }, []);

  const Icon = file ? getFileIcon(file.name) : Upload;

  return (
    <div className="flex flex-col gap-3 fade-in">
      <div
        className={cn(
          "glass-elevated flex flex-col items-center gap-3 rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer",
          dragOver
            ? "border-primary/30 shadow-[0_0_40px_oklch(0.65_0.2_265/0.08)] scale-[1.01]"
            : "hover:border-muted-foreground/10",
          file && "p-5"
        )}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        aria-label="Upload file"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf,.docx,.doc,.csv,.tsv,.txt,.md,.json,.xml,.yaml,.yml"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          disabled={loading}
        />

        {file ? (
          <div className="flex w-full items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="size-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary/70 uppercase">
                  {getFileType(file.name)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground/40">{formatSize(file.size)}</p>
            </div>
            <button
              type="button"
              className="rounded-lg p-1.5 text-muted-foreground/30 transition-colors hover:bg-muted/40 hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              disabled={loading}
              aria-label="Remove file"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <>
            <div className={cn(
              "flex size-12 items-center justify-center rounded-2xl border border-border/40 bg-muted/15 transition-all duration-300",
              dragOver && "border-primary/30 bg-primary/5 scale-110"
            )}>
              <Upload className={cn(
                "size-5 text-muted-foreground/35 transition-colors",
                dragOver && "text-primary/60"
              )} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/75">
                {dragOver ? "Drop your file here" : "Drop a file here or click to browse"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/35">PDF, DOCX, CSV, TXT, and more</p>
            </div>
          </>
        )}
      </div>

      <Button
        type="button"
        disabled={loading || !file}
        onClick={() => file && onConvert(file)}
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
    </div>
  );
}
