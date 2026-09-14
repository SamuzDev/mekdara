export function Header() {
  return (
    <header className="flex flex-col items-center gap-4 text-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-primary/15 blur-xl" />
        <div className="relative flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
          <svg
            className="size-7 text-primary"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M8 22V10h2.5l3.5 5 3.5-5H21v12h-2.5v-7.5L15 19.5l-3.5-5V22H8z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Mekdara
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground/60">
          Convert any web page or document to clean Markdown
          <br className="hidden sm:block" />
          optimized for LLM context windows
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {["URL", "PDF", "DOCX", "CSV", "HTML"].map((fmt) => (
          <span
            key={fmt}
            className="inline-flex items-center rounded-full border border-border/40 bg-muted/20 px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground/50 uppercase transition-colors hover:border-primary/20 hover:text-muted-foreground/70"
          >
            {fmt}
          </span>
        ))}
      </div>
    </header>
  );
}
