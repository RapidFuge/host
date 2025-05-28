// components/dashboard/settings/SignUpTokensManagerModal.tsx
import { useState, useEffect, useCallback } from "react";

interface ClientSignUpToken {
  token: string;
  created: Date;
  expires: Date;
}

interface SignUpTokensManagerProps {
  adminAuthToken: string;
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
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchTokens = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/users/tokens");
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || data.message || "Failed to fetch tokens."
        );
      if (data.success && Array.isArray(data.tokens)) {
        const processedTokens: ClientSignUpToken[] = data.tokens.map(
          (t: ClientSignUpToken) => ({
            token: t.token,
            created: new Date(t.created),
            expires: new Date(t.expires),
          })
        );
        setTokens(processedTokens);
      } else {
        setTokens([]);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
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
      setMessage({ type: "error", text: "Expiration time is required." });
      return;
    }
    setIsCreating(true);
    setMessage(null);
    try {
      const response = await fetch("/api/users/tokens", {
        method: "POST",
        headers: { expires: newExpiration },
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || data.message || "Failed to create token."
        );
      setMessage({
        type: "success",
        text: `Token created: ${data.token.token}. Expires in ${data.token.expires}.`,
      });
      setNewExpiration("");
      fetchTokens();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteToken = async (tokenValue: string) => {
    if (!confirm(`Are you sure you want to delete token: ${tokenValue}?`))
      return;
    try {
      const response = await fetch(`/api/users/tokens/${tokenValue}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || data.message || "Failed to delete token."
        );
      setMessage({ type: "success", text: `Token ${tokenValue} deleted.` });
      fetchTokens();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 transition-opacity duration-300 ease-in-out"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-neutral-800 p-4 sm:p-6 rounded-md shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col text-zinc-100">
        {" "}
        {/* neutral */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">
            Manage Sign Up Tokens
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-2xl leading-none p-1"
          >
            ×
          </button>{" "}
          {/* neutral */}
        </div>
        <form
          onSubmit={handleCreateToken}
          className="mb-4 flex flex-col sm:flex-row gap-3 items-end"
        >
          <div className="flex-grow w-full sm:w-auto">
            <label
              htmlFor="modal-token-expiration"
              className="block text-sm font-medium text-zinc-300 mb-1"
            >
              New Token Expiration
            </label>
            <input
              type="text"
              id="modal-token-expiration"
              value={newExpiration}
              onChange={(e) => setNewExpiration(e.target.value)}
              placeholder='e.g., "1h", "7d"'
              className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded text-white focus:ring-blue-500 focus:border-blue-500"
            />{" "}
            {/* neutral */}
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:bg-neutral-500 h-[42px]"
            disabled={isCreating}
          >
            {isCreating ? "Creating..." : "Create Token"}
          </button>{" "}
          {/* neutral for disabled */}
        </form>
        {message && (
          <div
            className={`p-3 mb-3 rounded text-sm ${
              message.type === "success"
                ? "bg-green-700 text-green-100"
                : "bg-red-700 text-red-100"
            }`}
          >
            {message.text}
          </div>
        )}
        <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-neutral-800">
          {" "}
          {/* neutral scrollbar */}
          {isLoading && (
            <p className="text-neutral-400 text-center py-4">
              Loading tokens...
            </p>
          )}{" "}
          {/* neutral */}
          {!isLoading &&
            tokens.length === 0 &&
            !(message?.type === "error") && (
              <p className="text-neutral-400 text-center py-4">
                No sign up tokens found.
              </p>
            )}{" "}
          {/* neutral */}
          {tokens.length > 0 && (
            <div className="overflow-x-auto rounded-md">
              <table className="min-w-full divide-y divide-neutral-700 rounded-md">
                {" "}
                {/* neutral */}
                <thead className="bg-neutral-700 sticky top-0 z-10">
                  {" "}
                  {/* neutral */}
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Token
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Expires (Status)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-neutral-800 divide-y divide-neutral-600">
                  {" "}
                  {/* neutral */}
                  {tokens.map((t) => {
                    const isExpired = isTokenExpired(t.expires);
                    const expiresDisplay = t.expires.toLocaleString();
                    return (
                      <tr
                        key={t.token}
                        className={`${
                          isExpired
                            ? "opacity-60 bg-neutral-700"
                            : "hover:bg-neutral-700"
                        } transition-colors`}
                      >
                        {" "}
                        {/* neutral */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-zinc-200 break-all">
                          {t.token}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">
                          {t.created.toLocaleString()}
                        </td>
                        <td
                          className={`px-4 py-3 whitespace-nowrap text-sm ${
                            isExpired ? "text-red-400" : "text-green-400"
                          }`}
                        >
                          {expiresDisplay}{" "}
                          {isExpired ? "(Expired)" : "(Active)"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDeleteToken(t.token)}
                            className="text-red-500 hover:text-red-400 disabled:text-neutral-500 disabled:cursor-not-allowed"
                          >
                            Delete
                          </button>{" "}
                          {/* neutral for disabled */}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-700 flex justify-end">
          {" "}
          {/* neutral */}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm bg-neutral-600 hover:bg-neutral-500 rounded text-white"
          >
            Close
          </button>{" "}
          {/* neutral */}
        </div>
      </div>
    </div>
  );
}
