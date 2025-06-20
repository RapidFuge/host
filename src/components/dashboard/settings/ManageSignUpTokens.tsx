import { useState, useEffect, useCallback } from "react";
import { Copy, CopyCheck, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

interface ClientSignUpToken {
  token: string;
  created: Date;
  expires: Date;
}

interface SignUpTokensManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const isTokenExpired = (expiresDate: Date): boolean => {
  return new Date() > expiresDate;
};

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

  useEffect(() => {
    if (isOpen) {
      fetchTokens();
    }
  }, [isOpen, fetchTokens]);

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpiration.trim()) {
      toast.error("Expiration time is required.")
      return;
    }
    setIsCreating(true);
    try {
      const response = await fetch("/api/users/tokens", { method: "POST", headers: { expires: newExpiration } });
      const data = await response.json();
      if (!response.ok) throw data.error || data.message || "Failed to create token.";
      toast.success(`Token created! Expires in ${data.token.expires}.`)
      setNewExpiration("");
      fetchTokens();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || err || "Failed to create token.")
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteToken = async (tokenValue: string) => {
    if (!confirm(`Are you sure you want to delete token: ${tokenValue}?`)) return;
    try {
      const response = await fetch(`/api/users/tokens/${tokenValue}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw data.error || data.message || "Failed to delete token.";
      toast.success(`Token ${tokenValue} deleted.`)
      fetchTokens();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || err || "Failed to delete token.");
    }
  };

  const handleCopyToClipboard = (tokenToCopy: string) => {
    navigator.clipboard.writeText(tokenToCopy)
      .then(() => {
        toast.success("Token copied successfully!");
        setCopiedTokenValue(tokenToCopy);
        setTimeout(() => {
          setCopiedTokenValue(null);
        }, 2000);
      })
      .catch(() => {
        toast.error("Failed to copy token.")
      });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4 transition-opacity"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-neutral-800 border border-neutral-800 p-4 sm:p-6 rounded-md shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col text-zinc-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Manage Sign Up Tokens</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-white text-2xl leading-none p-1">×</button>
        </div>
        <form onSubmit={handleCreateToken} className="mb-4 flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-grow w-full sm:w-auto">
            <label htmlFor="modal-token-expiration" className="block text-sm font-medium text-zinc-300 mb-1">New Token Expiration</label>
            <input type="text" id="modal-token-expiration" value={newExpiration} onChange={(e) => setNewExpiration(e.target.value)} placeholder='e.g., "1h", "7d"' className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <button type="submit" disabled={isCreating} className="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:bg-neutral-700 disabled:text-neutral-400 h-[42px]">
            {isCreating ? (
              <span className="flex items-center">
                <LoaderCircle className="animate-spin mr-2 w-5 h-5" />
                Creating
              </span>
            ) : ("Create Token")}
          </button>
        </form>
        <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-black pr-1">
          {isLoading && <p className="text-neutral-400 text-center py-4">Loading tokens...</p>}
          {!isLoading && tokens.length === 0 && <p className="text-neutral-400 text-center py-4">No sign up tokens found.</p>}
          {tokens.length > 0 && (
            <div className="overflow-x-auto rounded-md">
              <table className="min-w-full divide-y divide-neutral-700 rounded-md">
                <thead className="bg-neutral-700 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Token</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Expires (Status)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-neutral-800 divide-y divide-neutral-600">
                  {tokens.map((t) => {
                    const isExpired = isTokenExpired(t.expires);
                    const expiresDisplay = t.expires.toLocaleString();
                    return (
                      <tr key={t.token} className={`${isExpired ? "opacity-50 bg-neutral-900" : "hover:bg-neutral-800"} transition-colors`}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-zinc-200">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[150px] sm:max-w-[200px]" title={t.token}>{t.token}</span>
                            <button onClick={() => handleCopyToClipboard(t.token)} title="Copy token" className="p-1 text-neutral-400 hover:text-zinc-100 transition-colors">
                              {copiedTokenValue === t.token ? (
                                <CopyCheck className="h-4 w-4 text-green-400" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">{t.created.toLocaleString()}</td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${isExpired ? "text-red-400" : "text-green-400"}`}>{expiresDisplay} {isExpired ? "(Expired)" : "(Active)"}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <button onClick={() => handleDeleteToken(t.token)} className="text-red-500 hover:text-red-400 disabled:text-neutral-500 disabled:cursor-not-allowed">Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-800 flex justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-neutral-700 hover:bg-neutral-600 rounded text-white">Close</button>
        </div>
      </div>
    </div>
  );
}