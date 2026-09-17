import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface TokenQuota {
  limit: number;
  remaining: number;
  resetAt: number;
}

interface TokenQuotaContextType {
  quota: TokenQuota | null;
  updateQuota: (headers: Headers) => void;
  resetQuota: () => void;
  fetchQuota: () => Promise<void>;
}

const TokenQuotaContext = createContext<TokenQuotaContextType | null>(null);

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export function TokenQuotaProvider({ children }: { children: ReactNode }) {
  const [quota, setQuota] = useState<TokenQuota | null>(null);

  const updateQuota = (headers: Headers) => {
    const limit = headers.get("X-RateLimit-Limit");
    const remaining = headers.get("X-RateLimit-Remaining");
    const reset = headers.get("X-RateLimit-Reset");

    if (limit && remaining && reset) {
      setQuota({
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        resetAt: parseInt(reset, 10) * 1000,
      });
    }
  };

  const resetQuota = () => setQuota(null);

  const fetchQuota = async () => {
    try {
      const res = await fetch(`${API_BASE}/health/rate-limit`, {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.limit && data.remaining !== undefined && data.resetAt) {
          setQuota({
            limit: data.limit,
            remaining: data.remaining,
            resetAt: data.resetAt,
          });
        }
      }
    } catch {
      // Silently fail, will be updated on first conversion
    }
  };

  // Fetch initial quota on mount
  useEffect(() => {
    fetchQuota();
  }, []);

  return (
    <TokenQuotaContext.Provider value={{ quota, updateQuota, resetQuota, fetchQuota }}>
      {children}
    </TokenQuotaContext.Provider>
  );
}

export function useTokenQuota() {
  const context = useContext(TokenQuotaContext);
  if (!context) {
    throw new Error("useTokenQuota must be used within a TokenQuotaProvider");
  }
  return context;
}

export function useTokenQuotaDisplay() {
  const { quota } = useTokenQuota();

  // Default values before first fetch
  if (!quota) {
    return {
      limit: 20,
      remaining: 20,
      percentage: 100,
      resetText: "~1h",
    };
  }

  const now = Date.now();
  const resetIn = Math.max(0, quota.resetAt - now);
  const minutes = Math.ceil(resetIn / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  let resetText = "";
  if (hours > 0) {
    resetText = `${hours}h ${mins}m`;
  } else {
    resetText = `${mins}m`;
  }

  const percentage = quota.limit > 0 ? (quota.remaining / quota.limit) * 100 : 0;

  return {
    limit: quota.limit,
    remaining: quota.remaining,
    percentage,
    resetText,
  };
}