import { useState, useEffect, useCallback } from "react";
import { Copy, CopyCheck } from "lucide-react";
import { toast } from "sonner";
import { Button, Input } from "@components/ui";

interface ClientSignUpToken {
  token: string;
  created: Date;
  expires: Date;
}

interface SignUpTokensManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const isTokenExpired = (expiresDate: Date): boolean => new Date() > expiresDate;

export default function SignUpTokensManagerModal({
  isOpen,
  onClose,
}: SignUpTokensManagerProps) {
  const [tokens, setTokens] = useState<ClientSignUpToken[]>([]);
  const [newExpiration, setNewExpiration] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedTokenValue, setCopiedTokenValue] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/users/tokens");
      const data = await response.json();
      if (!response.ok) throw data.error || data.message || "Failed to fetch tokens.";
      if (data.success && Array.isArray(data.tokens)) {
        const processedTokens: ClientSignUpToken[] = data.tokens.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (t: any) => ({ token: t.token, created: new Date(t.created), expires: new Date(t.expires) })
        );
        setTokens(processedTokens);
      } else {
        setTokens([]);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || err || "Error fetching tokens");
      setTokens([]);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => { if (isOpen) fetchTokens(); }, [isOpen, fetchTokens]);

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpiration.trim()) { toast.error("Expiration time is required."); return; }
    setIsCreating(true);
    try {
      const response = await fetch("/api/users/tokens", { method: "POST", headers: { expires: newExpiration } });
      const data = await response.json();
      if (!response.ok) throw data.error || data.message || "Failed to create token.";
      toast.success(`Token created! Expires in ${data.token.expires}.`);
      setNewExpiration("");
      fetchTokens();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || err || "Failed to create token.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteToken = async (tokenValue: string) => {
    toast(`Delete token "${tokenValue}"?`, {
      duration: 10000,
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const response = await fetch(`/api/users/tokens/${tokenValue}`, { method: "DELETE" });
            const data = await response.json();
            if (!response.ok) throw data.error || data.message || "Failed to delete token.";
            toast.success(`Token deleted.`);
            fetchTokens();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (err: any) {
            toast.error(err.message || err || "Failed to delete token.");
          }
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  };

  const handleCopyToClipboard = (tokenToCopy: string) => {
    navigator.clipboard.writeText(tokenToCopy)
      .then(() => {
        toast.success("Copied!");
        setCopiedTokenValue(tokenToCopy);
        setTimeout(() => setCopiedTokenValue(null), 2000);
      })
      .catch(() => toast.error("Failed to copy."));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} />
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col glass-strong rounded-md border border-[var(--border-default)] shadow-2xl">
        <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border-subtle)]">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Sign Up Tokens</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl p-1 transition-colors">&times;</button>
        </div>

        <form onSubmit={handleCreateToken} className="px-5 py-4 flex flex-col sm:flex-row gap-3 items-end border-b border-[var(--border-subtle)]">
          <div className="flex-grow w-full sm:w-auto">
            <Input
              placeholder='Expiration (e.g. "1h", "7d")'
              value={newExpiration}
              onChange={(e) => setNewExpiration(e.target.value)}
            />
          </div>
          <Button type="submit" loading={isCreating} size="sm">
            Create token
          </Button>
        </form>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading && <p className="text-[var(--text-muted)] text-center py-4 text-sm">Loading...</p>}
          {!isLoading && tokens.length === 0 && <p className="text-[var(--text-muted)] text-center py-4 text-sm">No tokens found.</p>}
          {tokens.length > 0 && (
            <div className="overflow-x-auto rounded-md border border-[var(--border-subtle)]">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Token</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">Created</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Expires</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {tokens.map((t) => {
                    const isExpired = isTokenExpired(t.expires);
                    return (
                      <tr key={t.token} className={`${isExpired ? "opacity-40" : ""} transition-opacity`}>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[var(--text-primary)] truncate max-w-[150px]" title={t.token}>{t.token}</span>
                            <button onClick={() => handleCopyToClipboard(t.token)} className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                              {copiedTokenValue === t.token ? <CopyCheck className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-[var(--text-muted)] hidden sm:table-cell whitespace-nowrap">{t.created.toLocaleString()}</td>
                        <td className={`px-4 py-2.5 text-xs whitespace-nowrap ${isExpired ? "text-red-400" : "text-emerald-400"}`}>
                          {t.expires.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5">
                          <button onClick={() => handleDeleteToken(t.token)} className="text-xs text-red-400 hover:text-red-300 transition-colors">Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[var(--border-subtle)] flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
