import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Header } from "./components/Header";
import { TabBar, type Tab } from "./components/TabBar";
import { UrlInput } from "./components/UrlInput";
import { FileUpload } from "./components/FileUpload";
import { TextAreaInput } from "./components/TextAreaInput";
import { ResultView } from "./components/ResultView";
import { Footer } from "./components/Footer";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { LoginModal } from "./components/LoginModal";
import { UserMenu } from "./components/UserMenu";
import { useSession } from "@/lib/auth-client";
import { KeyRound, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

function App() {
  const { data: session, isPending } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("url");
  const [markdown, setMarkdown] = useState("");
  const [tokens, setTokens] = useState<{ markdown: number; raw: number } | null>(null);
  const [title, setTitle] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ remaining: number; limit: number } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("mekdara_api_key");
    if (stored) setApiKey(stored);
  }, []);

  const headers: Record<string, string> = {};
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  const handleRateLimitHeaders = (res: Response) => {
    const limit = res.headers.get("X-RateLimit-Limit");
    const remaining = res.headers.get("X-RateLimit-Remaining");
    if (limit && remaining) {
      setRateLimitInfo({ remaining: Number(remaining), limit: Number(limit) });
    }
  };

  const resetState = () => {
    setMarkdown("");
    setTokens(null);
    setTitle(undefined);
    setError(null);
  };

  const handleSuccess = (
    data: { markdown: string; markdown_tokens: number; raw_tokens: number; title?: string; metadata?: Record<string, unknown> },
  ) => {
    setMarkdown(data.markdown);
    setTokens({ markdown: data.markdown_tokens, raw: data.raw_tokens });
    setTitle(data.title);
  };

  const handleUrlConvert = async (url: string) => {
    setLoading(true);
    resetState();
    try {
      const res = await fetch(`${API_BASE}/api/convert/url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ url }),
      });
      handleRateLimitHeaders(res);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to convert URL");
      handleSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleFileConvert = async (file: File) => {
    setLoading(true);
    resetState();
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_BASE}/api/convert/file`, {
        method: "POST",
        headers,
        body: form,
      });
      handleRateLimitHeaders(res);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to convert file");
      handleSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleHtmlConvert = async (content: string) => {
    setLoading(true);
    resetState();
    try {
      const res = await fetch(`${API_BASE}/api/convert/html`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ content }),
      });
      handleRateLimitHeaders(res);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to convert HTML");
      handleSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleTextConvert = async (content: string) => {
    setLoading(true);
    resetState();
    try {
      const res = await fetch(`${API_BASE}/api/convert/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ content }),
      });
      handleRateLimitHeaders(res);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to convert text");
      handleSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("mekdara_api_key", key);
    setShowApiKeyModal(false);
  };

  const handleClearApiKey = () => {
    setApiKey(null);
    localStorage.removeItem("mekdara_api_key");
    setRateLimitInfo(null);
  };

  const ratePercent = rateLimitInfo ? (rateLimitInfo.remaining / rateLimitInfo.limit) * 100 : 0;
  const rateColor = ratePercent > 50 ? "bg-emerald-400/70" : ratePercent > 20 ? "bg-amber-400/70" : "bg-destructive/60";

  return (
    <div className="relative min-h-dvh flex-col">
      <div className="mesh-bg" />
      <div className="noise-overlay" />
      <Toaster position="bottom-center" />
      <SpeedInsights />

      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-10 px-5 py-20 sm:px-6">
        <Header />

        {/* Tabs + Auth row */}
        <div className="flex items-center gap-3">
          <TabBar active={activeTab} onChange={setActiveTab} />
          <div className="flex items-center gap-1 shrink-0">
            {isPending ? (
              <div className="h-8 w-20 rounded-lg skeleton" />
            ) : session?.user ? (
              <UserMenu />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLoginModal(true)}
                className="gap-1.5 rounded-lg text-xs text-muted-foreground/45 hover:text-foreground hover:bg-muted/25"
              >
                <LogIn className="size-3.5" />
                Sign In
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowApiKeyModal(true)}
              className="gap-1.5 rounded-lg text-xs text-muted-foreground/45 hover:text-foreground hover:bg-muted/25"
            >
              <KeyRound className="size-3.5" />
              {apiKey ? "API Key" : "Get Key"}
            </Button>
          </div>
        </div>

        {/* Rate limit bar */}
        {rateLimitInfo && (
          <div className="flex flex-col gap-1.5 -mt-6 fade-in">
            <div className="rate-bar-track">
              <div
                className={`rate-bar-fill ${rateColor}`}
                style={{ width: `${ratePercent}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground/30">
              {rateLimitInfo.remaining}/{rateLimitInfo.limit} requests remaining
            </p>
          </div>
        )}

        {/* Tab content */}
        {activeTab === "url" && <UrlInput onConvert={handleUrlConvert} loading={loading} />}
        {activeTab === "file" && <FileUpload onConvert={handleFileConvert} loading={loading} />}
        {activeTab === "html" && (
          <TextAreaInput
            onConvert={handleHtmlConvert}
            loading={loading}
            placeholder="<h1>Paste your HTML here</h1>"
            label="HTML content to convert"
            buttonText="Convert HTML"
          />
        )}
        {activeTab === "text" && (
          <TextAreaInput
            onConvert={handleTextConvert}
            loading={loading}
            placeholder="Paste text, JSON, YAML, or any content..."
            label="Text content to convert"
            buttonText="Convert Text"
          />
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-destructive/15 bg-destructive/5 px-4 py-3 text-sm text-destructive/80 fade-in">
            {error}
          </div>
        )}

        {/* Result */}
        <ResultView markdown={markdown} tokens={tokens} title={title} loading={loading} />

        <Footer />
      </main>

      <ApiKeyModal
        open={showApiKeyModal}
        onOpenChange={setShowApiKeyModal}
        currentKey={apiKey}
        onSave={handleSaveApiKey}
        onClear={handleClearApiKey}
      />

      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
    </div>
  );
}

export default App;
