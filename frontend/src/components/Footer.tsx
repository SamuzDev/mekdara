export function Footer() {
  return (
    <footer className="mt-auto pt-8">
      <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
      <div className="flex items-center justify-center gap-3 pt-4 pb-2">
        <span className="text-[11px] text-muted-foreground/35">
          Mekdara
        </span>
        <span className="text-muted-foreground/15">&middot;</span>
        <a
          href="https://github.com/samuzdev/mekdara"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-muted-foreground/35 transition-colors hover:text-muted-foreground/55"
        >
          GitHub
        </a>
        <span className="text-muted-foreground/15">&middot;</span>
        <span className="text-[11px] text-muted-foreground/35">
          Built by <span className="text-muted-foreground/50">SamuzDev</span>
        </span>
      </div>
    </footer>
  );
}
