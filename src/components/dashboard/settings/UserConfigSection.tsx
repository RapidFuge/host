/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { DashboardUser } from "@pages/dashboard";
import { shorteners } from "@lib/generators";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import { Copy, CopyCheck, Download } from "lucide-react";
import { toast } from "sonner";
import { Button, Input, Select, Toggle, Card } from "@components/ui";

interface UserConfigSectionProps {
  loggedInUser: DashboardUser;
  selectedUser: string;
  baseUrl: string;
}

interface SelectedUserDetails extends DashboardUser {
  shortener?: shorteners;
  embedImageDirectly?: boolean;
  customEmbedDescription?: string | null;
  defaultFileExpiration?: string;
}

export default function UserConfigSection({
  loggedInUser,
  selectedUser,
  baseUrl,
}: UserConfigSectionProps) {
  const isDeletable = loggedInUser.isAdmin
    ? process.env.NEXT_PUBLIC_PREVENT_ROOT_DELETION !== "true" || selectedUser.toLowerCase() !== "root"
    : loggedInUser.username === selectedUser;

  const [userDetails, setUserDetails] = useState<SelectedUserDetails | null>(null);
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedGenerator, setSelectedGenerator] = useState<shorteners | undefined>(undefined);
  const [embedDirectly, setEmbedDirectly] = useState<boolean>(false);
  const [customDescription, setCustomDescription] = useState<string>("");
  const [initialCustomDescription, setInitialCustomDescription] = useState<string>("");
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [defaultFileExpiration, setDefaultFileExpiration] = useState<string>("never");
  const [copiedApiToken, setCopiedApiToken] = useState<boolean>(false);
  const router = useRouter();
  const { update: updateSession } = useSession();
  const expirationOptions = [
    { value: "never", label: "Never" },
    { value: "1h", label: "1 Hour" },
    { value: "6h", label: "6 Hours" },
    { value: "1d", label: "1 Day" },
    { value: "1w", label: "1 Week" },
    { value: "30d", label: "1 Month" },
    { value: "90d", label: "3 Months" },
    { value: "1y", label: "1 Year" },
  ];

  const canEditSelectedUser = loggedInUser.isAdmin || loggedInUser.username === selectedUser;

  const fetchUserDetails = useCallback(async () => {
    if (!selectedUser) return;
    setIsLoadingUserDetails(true);
    try {
      const response = await fetch(`/api/users/${selectedUser}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "Failed to fetch user details." }));
        throw errData.error || errData.message || "Failed to fetch user details.";
      }
      const data = await response.json();
      if (data.success && data.user) {
        setUserDetails(data.user);
        setSelectedGenerator(data.user.shortener);
        setEmbedDirectly(data.user.embedImageDirectly === true);
        setCustomDescription(data.user.customEmbedDescription || "");
        setInitialCustomDescription(data.user.customEmbedDescription || "");
        setDefaultFileExpiration(data.user.defaultFileExpiration || "never");
      } else {
        throw data.message || "User data not found in response.";
      }
    } catch (err: any) {
      toast.error(err.message || err || "Failed to fetch user details.");
      setUserDetails(null);
    } finally {
      setIsLoadingUserDetails(false);
    }
  }, [selectedUser]);

  useEffect(() => { fetchUserDetails(); }, [fetchUserDetails]);

  const handleDownloadConfig = (isLink: boolean) => {
    const downloadUrl = new URL(`${baseUrl}/api/users/${selectedUser}/configuration`);
    downloadUrl.searchParams.append("link", String(isLink));
    window.open(downloadUrl.toString(), "_blank");
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match.");
    if (!canEditSelectedUser) return toast.error("Not authorized.");
    try {
      const response = await fetch(`/api/users/${selectedUser}/configuration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw data.error || data.message || "Failed to update password.";
      toast.success(data.message || "Password updated!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleResetToken = async () => {
    if (!canEditSelectedUser) return toast.error("Not authorized.");
    toast(`Reset API token? This action is irreversible.`, {
      duration: 10000,
      action: {
        label: "Reset",
        onClick: async () => {
          setCopiedApiToken(false);
          try {
            const response = await fetch(`/api/users/${selectedUser}/configuration`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ resetToken: true }),
            });
            const data = await response.json();
            if (!response.ok) throw data.error || data.message || "Failed to reset token.";
            toast.success(data.message || "Token reset!");
            if (data.newToken && userDetails) {
              setUserDetails((prev) => prev ? { ...prev, token: data.newToken } : null);
              if (loggedInUser.username === selectedUser) {
                try {
                  await updateSession({ token: data.newToken });
                  setTimeout(() => toast.success("Session updated with new token!"), 500);
                } catch (sessionError) {
                  console.error("Failed to update session:", sessionError);
                  toast.warning("Token reset, but session update failed. Please log in again.");
                  setTimeout(() => signOut({ callbackUrl: "/login" }), 2000);
                }
              }
            }
          } catch (err: any) {
            toast.error(err.message);
          }
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  };

  const handleCopyApiToken = (tokenToCopy: string | undefined) => {
    if (!tokenToCopy) return toast.error("No token.");
    navigator.clipboard.writeText(tokenToCopy)
      .then(() => {
        setCopiedApiToken(true);
        setTimeout(() => setCopiedApiToken(false), 2000);
      })
      .catch(() => toast.error("Copy failed."));
  };

  const handleGeneratorChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditSelectedUser || !selectedGenerator) return toast.error("Cannot update.");
    try {
      const response = await fetch(`/api/users/${selectedUser}/configuration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortener: selectedGenerator }),
      });
      const data = await response.json();
      if (!response.ok) throw data.error || data.message || "Failed to update generator.";
      toast.success(data.message || "Generator updated!");
      if (userDetails) setUserDetails((prev) => prev ? { ...prev, shortener: selectedGenerator } : null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEmbedPreferenceChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPreference = e.target.checked;
    if (!canEditSelectedUser || userDetails === null) return toast.error("Cannot update.");
    setEmbedDirectly(newPreference);
    try {
      const response = await fetch(`/api/users/${selectedUser}/configuration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedImageDirectly: newPreference }),
      });
      const data = await response.json();
      if (!response.ok) {
        setEmbedDirectly(userDetails.embedImageDirectly || false);
        throw data.error || data.message || "Update failed.";
      }
      setUserDetails((prev) => prev ? { ...prev, embedImageDirectly: newPreference } : null);
      toast.success(data.message || "Embed preference updated!");
    } catch (err: any) {
      setEmbedDirectly(userDetails.embedImageDirectly || false);
      toast.error(err.message);
    }
  };

  const handleCustomDescriptionChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditSelectedUser || userDetails === null) return toast.error("Not authorized.");
    if (customDescription === initialCustomDescription) return;
    try {
      const response = await fetch(`/api/users/${selectedUser}/configuration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customEmbedDescription: customDescription.trim() === "" ? null : customDescription.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw data.error || data.message || "Update failed.";
      setUserDetails((prev) => prev ? { ...prev, customEmbedDescription: customDescription.trim() === "" ? null : customDescription.trim() } : null);
      setInitialCustomDescription(customDescription.trim());
      toast.success(data.message || "Description updated!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDefaultExpirationChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditSelectedUser) return toast.error("Not authorized.");
    if (defaultFileExpiration === (userDetails?.defaultFileExpiration || "never")) return;
    try {
      const response = await fetch(`/api/users/${selectedUser}/configuration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultFileExpiration }),
      });
      const data = await response.json();
      if (!response.ok) throw data.error || data.message || "Update failed.";
      setUserDetails((prev) => prev ? { ...prev, defaultFileExpiration } : null);
      toast.success(data.message || "Default expiration updated!");
    } catch (err: any) {
      toast.error(err.message);
      setDefaultFileExpiration(userDetails?.defaultFileExpiration || "never");
    }
  };

  const handleDeleteUser = async () => {
    if (!isDeletable || (!loggedInUser.isAdmin && loggedInUser.username !== selectedUser)) return toast.error("Not authorized or deletion prevented.");
    const label = loggedInUser.username === selectedUser ? "your account" : `user "${selectedUser}"`;
    toast(`Are you sure you want to delete ${label}?`, {
      duration: 10000,
      action: {
        label: "Confirm",
        onClick: () => {
          toast(`SECOND CONFIRMATION: Delete ${label}?`, {
            duration: 10000,
            action: {
              label: "Confirm",
              onClick: async () => {
                try {
                  const response = await fetch(`/api/users/${selectedUser}`, { method: "DELETE" });
                  const data = await response.json();
                  if (!response.ok) throw data.error || data.message || "Delete failed.";
                  toast.success(`User ${selectedUser} deleted.`);
                  if (loggedInUser.username === selectedUser) signOut({ callbackUrl: "/login" });
                  else router.reload();
                } catch (err: any) {
                  toast.error(err.message);
                }
              },
            },
            cancel: { label: "Cancel", onClick: () => {} },
          });
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  };

  if (isLoadingUserDetails)
    return <p className="p-4 text-[var(--text-muted)]">Loading settings...</p>;
  if (!userDetails && !loggedInUser.isAdmin && loggedInUser.username !== selectedUser)
    return <p className="p-4 text-[var(--text-muted)]">No permission to view settings.</p>;
  if (!userDetails)
    return <p className="p-4 text-[var(--text-muted)]">User details not found.</p>;

  return (
    <div className="space-y-4">
      <Card padding="md">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
          ShareX Config
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => handleDownloadConfig(false)} icon={<Download className="w-3.5 h-3.5" />}>
            File Upload
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleDownloadConfig(true)} icon={<Download className="w-3.5 h-3.5" />}>
            URL Shorten
          </Button>
        </div>
      </Card>

      {canEditSelectedUser && (
        <>
          <Card padding="md">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
              Account
            </h3>

            <form onSubmit={handlePasswordChange} className="mb-6">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Change Password</p>
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  required
                  minLength={3}
                />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  required
                  minLength={3}
                />
              </div>
              <Button type="submit" size="sm">Update password</Button>
            </form>

            <div className="mb-6">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-2">API Token</p>
              <Button variant="secondary" size="sm" onClick={() => { setCopiedApiToken(false); setIsTokenModalOpen(true); }}>
                Manage API Token
              </Button>
              <p className="text-xs text-[var(--text-muted)] mt-1">Used for API auth with upload tools.</p>
            </div>

            <form onSubmit={handleGeneratorChange} className="mb-6">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-2">ID Generator</p>
              <div className="flex gap-3 items-end">
                <Select
                  options={shorteners.map((gen) => ({ value: gen, label: gen.charAt(0).toUpperCase() + gen.slice(1) }))}
                  value={selectedGenerator || userDetails.shortener || ""}
                  onChange={(e) => setSelectedGenerator(e.target.value as shorteners)}
                />
                <Button type="submit" size="sm">Update</Button>
              </div>
            </form>

            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Image Embedding</p>
              <Toggle
                checked={embedDirectly}
                onChange={handleEmbedPreferenceChange}
                label="Embed full media directly"
              />
              <p className="text-xs text-[var(--text-muted)] mt-2 ml-12">
                If on, images/videos embed directly. Otherwise, detailed info embeds.
              </p>
            </div>

            <form onSubmit={handleCustomDescriptionChange} className="pt-4 border-t border-[var(--border-subtle)] mt-4">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Custom Embed Description</p>
              <p className="text-xs text-[var(--text-muted)] mb-2">Used when embedding is off or for non-media. Blank for default.</p>
              <textarea
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Max 250 chars"
                maxLength={250}
                className="w-full p-3 bg-surface-secondary border border-[var(--border-subtle)] rounded-md text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] h-20 resize-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
              <div className="mt-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={customDescription === initialCustomDescription}
                >
                  Save
                </Button>
              </div>
            </form>

            <form onSubmit={handleDefaultExpirationChange} className="pt-4 border-t border-[var(--border-subtle)] mt-4">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Default File Expiration</p>
              <p className="text-xs text-[var(--text-muted)] mb-2">Default for all new uploads.</p>
              <div className="flex gap-3 items-end">
                <Select
                  options={expirationOptions}
                  value={defaultFileExpiration}
                  onChange={(e) => setDefaultFileExpiration(e.target.value)}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={defaultFileExpiration === (userDetails?.defaultFileExpiration || "never")}
                >
                  Save
                </Button>
              </div>
            </form>
          </Card>

          {isDeletable &&
            ((loggedInUser.username === selectedUser && !loggedInUser.isAdmin) ||
              (loggedInUser.isAdmin && loggedInUser.username !== selectedUser) ||
              (loggedInUser.isAdmin && loggedInUser.username === selectedUser && selectedUser.toLowerCase() !== "root" && process.env.NEXT_PUBLIC_PREVENT_ROOT_DELETION !== "true")) && (
            <div className="p-4 rounded-md border border-red-500/20 bg-red-500/5">
              <h3 className="text-sm font-semibold text-red-400 mb-2">Delete Account</h3>
              <p className="text-xs text-[var(--text-muted)] mb-3">This action is irreversible.</p>
              <Button variant="danger" size="sm" onClick={handleDeleteUser}>
                Delete {loggedInUser.username === selectedUser ? "My Account" : selectedUser}
              </Button>
            </div>
          )}
        </>
      )}

      {isTokenModalOpen && userDetails && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsTokenModalOpen(false); }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md glass-strong rounded-md border border-[var(--border-default)] shadow-2xl">
            <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border-subtle)]">
              <h4 className="text-base font-semibold text-[var(--text-primary)]">
                API Token
              </h4>
              <button
                onClick={() => setIsTokenModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl leading-none p-1 transition-colors"
              >
                &times;
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs text-[var(--text-muted)] mb-1">Current token for {userDetails.username}</p>
              <div className="flex items-center gap-2 p-3 bg-surface-secondary rounded-md border border-[var(--border-subtle)]">
                <span className="font-mono text-xs truncate flex-grow select-all text-[var(--text-primary)]" title={userDetails.token || "No token"}>
                  {userDetails.token || "N/A"}
                </span>
                {userDetails.token && (
                  <button
                    onClick={() => handleCopyApiToken(userDetails.token)}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {copiedApiToken ? <CopyCheck className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[var(--border-subtle)]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetToken}
                >
                  Reset token
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setIsTokenModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
