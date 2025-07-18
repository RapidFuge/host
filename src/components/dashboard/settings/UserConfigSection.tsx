/* eslint-disable @typescript-eslint/no-explicit-any */
// components/dashboard/settings/UserConfigSection.tsx
import { useState, useEffect, useCallback } from "react";
import { DashboardUser } from "@pages/dashboard";
import { shorteners } from "@lib/generators";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import { Copy, CopyCheck, Download, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

interface UserConfigSectionProps {
  loggedInUser: DashboardUser;
  selectedUser: string;
  // token prop (loggedInUser.token) is now passed directly in API calls where needed
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
    ? process.env.NEXT_PUBLIC_PREVENT_ROOT_DELETION !== "true" ||
    selectedUser.toLowerCase() !== "root"
    : loggedInUser.username === selectedUser;

  const [userDetails, setUserDetails] = useState<SelectedUserDetails | null>(
    null
  );
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedGenerator, setSelectedGenerator] = useState<
    shorteners | undefined
  >(undefined);
  const [embedDirectly, setEmbedDirectly] = useState<boolean>(false);
  const [customDescription, setCustomDescription] = useState<string>("");
  const [initialCustomDescription, setInitialCustomDescription] =
    useState<string>("");
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [defaultFileExpiration, setDefaultFileExpiration] =
    useState<string>("never");
  const [tokenManagementMessage, setTokenManagementMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isResettingToken, setIsResettingToken] = useState(false);
  const [copiedApiToken, setCopiedApiToken] = useState<boolean>(false); // For API token copy feedback
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

  const canEditSelectedUser =
    loggedInUser.isAdmin || loggedInUser.username === selectedUser;

  const fetchUserDetails = useCallback(async () => {
    if (!selectedUser) return;
    setIsLoadingUserDetails(true);
    try {
      const response = await fetch(`/api/users/${selectedUser}`);
      if (!response.ok) {
        const errData = await response
          .json()
          .catch(() => ({ error: "Failed to fetch user details." }));
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
      toast.error(err.message || err || "Filed to fetch user details.");
      setUserDetails(null);
    } finally {
      setIsLoadingUserDetails(false);
    }
  }, [selectedUser]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  const handleDownloadConfig = (isLink: boolean) => {
    const downloadUrl = new URL(
      `${baseUrl}/api/users/${selectedUser}/configuration`
    );
    downloadUrl.searchParams.append("link", String(isLink));
    window.open(downloadUrl.toString(), "_blank");
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error("Passwords to not match.");
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

  const openTokenModal = () => {
    setTokenManagementMessage(null);
    setCopiedApiToken(false);
    setIsTokenModalOpen(true);
  };
  const closeTokenModal = () => setIsTokenModalOpen(false);

  const handleResetToken = async () => {
    if (!canEditSelectedUser) return toast.error("Not authorized.");
    if (confirm(`Reset API token? Your Current token will be unusable and you will be logged out.`)) {
      setIsResettingToken(true);
      setTokenManagementMessage(null);
      setCopiedApiToken(false);
      try {
        const response = await fetch(`/api/users/${selectedUser}/configuration`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resetToken: true }),
        });
        const data = await response.json();
        if (!response.ok) throw data.error || data.message || "Failed to reset token.";

        setTokenManagementMessage({
          type: "success",
          text: data.message || "Token reset!",
        });

        // Update local state with new token
        if (data.newToken && userDetails) {
          setUserDetails((prev) =>
            prev ? { ...prev, token: data.newToken } : null
          );

          // If the user is resetting their own token, update the session
          if (loggedInUser.username === selectedUser) {
            try {
              // Update the NextAuth session with the new token
              console.log(data.newToken)
              await updateSession({
                token: data.newToken
              });

              // Small delay to ensure session update is processed
              setTimeout(() => {
                toast.success("Session updated with new token!");
              }, 500);

              // Optional: Force a page reload to ensure all components use the new token
              // setTimeout(() => {
              //   router.reload();
              // }, 1000);

            } catch (sessionError) {
              console.error("Failed to update session:", sessionError);
              toast.warning("Token reset successful, but session update failed. Please log in again.");
              setTimeout(() => signOut({ callbackUrl: "/login" }), 2000);
            }
          }
        }
      } catch (err: any) {
        setTokenManagementMessage({ type: "error", text: err.message });
      } finally {
        setIsResettingToken(false);
      }
    }
  };


  const handleCopyApiToken = (tokenToCopy: string | undefined) => {
    if (!tokenToCopy) {
      setTokenManagementMessage({ type: "error", text: "No token." });
      return;
    }
    navigator.clipboard
      .writeText(tokenToCopy)
      .then(() => {
        setCopiedApiToken(true);
        setTimeout(() => {
          setCopiedApiToken(false);
        }, 2000);
      })
      .catch(() =>
        setTokenManagementMessage({ type: "error", text: "Copy failed." })
      );
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
      if (userDetails) {
        setUserDetails((prev) =>
          prev ? { ...prev, shortener: selectedGenerator } : null
        );
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEmbedPreferenceChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
      setUserDetails((prev) =>
        prev ? { ...prev, embedImageDirectly: newPreference } : null
      );
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
        body: JSON.stringify({
          customEmbedDescription:
            customDescription.trim() === "" ? null : customDescription.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw data.error || data.message || "Update failed.";
      setUserDetails((prev) =>
        prev
          ? {
            ...prev,
            customEmbedDescription:
              customDescription.trim() === ""
                ? null
                : customDescription.trim(),
          }
          : null
      );
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
      setUserDetails((prev) =>
        prev ? { ...prev, defaultFileExpiration } : null
      );
      toast.success(data.message || "Default expiration updated!");
    } catch (err: any) {
      toast.error(err.message);
      setDefaultFileExpiration(userDetails?.defaultFileExpiration || "never");
    }
  };

  const handleDeleteUser = async () => {
    if (!isDeletable || (!loggedInUser.isAdmin && loggedInUser.username !== selectedUser)) return toast.error("Not authorized or deletion prevented.");
    if (confirm(`DELETE user "${selectedUser}"? IRREVERSIBLE.`)) {
      if (confirm(`SECOND CONFIRMATION: Delete user "${selectedUser}"?`)) {
        try {
          const response = await fetch(`/api/users/${selectedUser}`, {
            method: "DELETE",
          });
          const data = await response.json();
          if (!response.ok)
            throw data.error || data.message || "Delete failed.";
          toast.success(data.message || `User ${selectedUser} deleted.`);
          if (loggedInUser.username === selectedUser) signOut({ callbackUrl: "/login" });
          else router.reload();
        } catch (err: any) {
          toast.error(err.message);
        }
      }
    }
  };

  if (isLoadingUserDetails)
    return (
      <p className="p-4 text-neutral-400">Loading user configuration...</p>
    );
  if (
    !userDetails &&
    !loggedInUser.isAdmin &&
    loggedInUser.username !== selectedUser
  ) {
    return (
      <p className="p-4 text-neutral-400">No permission to view settings.</p>
    );
  }
  if (!userDetails) {
    return <p className="p-4 text-neutral-400">User details not found.</p>;
  }

  return (
    <div className="p-4 space-y-8">
      <div className="p-4 border border-neutral-800 rounded-md bg-black">
        <h3 className="text-lg font-semibold text-white mb-3">
          Download Configurations for {selectedUser}
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleDownloadConfig(false)}
            className="flex px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded text-white"
          >
            <Download className="mr-1 w-5 h-5" /> File Upload Config
          </button>
          <button
            onClick={() => handleDownloadConfig(true)}
            className="flex px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded text-white"
          >
            <Download className="mr-1 w-5 h-5" /> URL Shorten Config
          </button>
        </div>
      </div>

      {canEditSelectedUser && (
        <div className="p-4 border border-neutral-800 rounded-md bg-black">
          <h3 className="text-lg font-semibold text-white mb-4">
            Manage Account: {selectedUser}
          </h3>
          <form onSubmit={handlePasswordChange} className="mb-6 space-y-3">
            <h4 className="text-md font-semibold text-zinc-200">
              Change Password
            </h4>
            <div>
              <label className="block text-sm text-zinc-300">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full sm:w-1/2 p-2 bg-neutral-900 border border-neutral-700 rounded mt-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                minLength={3}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-300">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full sm:w-1/2 p-2 bg-neutral-900 border border-neutral-700 rounded mt-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                minLength={3}
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded text-white"
            >
              Update Password
            </button>
          </form>

          <div className="mb-6">
            <h4 className="text-md font-semibold text-zinc-200 mb-2">
              API Token
            </h4>
            <button
              onClick={openTokenModal}
              className="px-3 py-1.5 text-sm bg-yellow-600 hover:bg-yellow-700 rounded text-white"
            >
              Manage API Token
            </button>
            <p className="text-xs text-neutral-400 mt-1">
              For API auth with upload tools.
            </p>
          </div>

          <form onSubmit={handleGeneratorChange} className="mb-6 space-y-3">
            <h4 className="text-md font-semibold text-zinc-200">
              ID Generator
            </h4>
            <div>
              <label className="block text-sm text-zinc-300">
                Select (Current: {userDetails.shortener || "Default"})
              </label>
              <select
                value={selectedGenerator || userDetails.shortener || ""}
                onChange={(e) =>
                  setSelectedGenerator(e.target.value as shorteners)
                }
                className="w-full sm:w-1/2 p-2 bg-neutral-900 border border-neutral-700 rounded mt-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {shorteners.map((gen) => (
                  <option key={gen} value={gen}>
                    {gen.charAt(0).toUpperCase() + gen.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded text-white"
            >
              Update Generator
            </button>
          </form>

          <div className="mb-6 pt-4 border-t border-neutral-800 mt-6">
            <h4 className="text-md font-semibold text-zinc-200 mb-2">
              Image Embedding
            </h4>
            <label
              htmlFor="embedToggle"
              className="flex items-center cursor-pointer mb-2 relative"
            >
              <input
                type="checkbox"
                id="embedToggle"
                className="sr-only peer"
                checked={embedDirectly}
                onChange={handleEmbedPreferenceChange}
              />
              <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-zinc-300">
                Embed full media directly
              </span>
            </label>
            <p className="text-xs text-neutral-400">
              If on, only image and videos embeds. If off, or for non-images or
              non-videos, detailed info embeds.
            </p>
          </div>

          <form
            onSubmit={handleCustomDescriptionChange}
            className="pt-4 border-t border-neutral-800 mt-6"
          >
            <h4 className="text-md font-semibold text-zinc-200">
              Custom Embed Description
            </h4>
            <p className="text-xs text-neutral-400 mb-2">
              Used when &quot;Embed full media&quot; is off, or for non-images
              and non-videos. Blank for default.
            </p>
            <div>
              <textarea
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Max 250 chars or leave blank."
                maxLength={250}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded mt-1 text-white h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="mt-2 flex justify-start">
              <button
                type="submit"
                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded text-white disabled:opacity-50"
                disabled={customDescription === initialCustomDescription}
              >
                Save Description
              </button>
            </div>
          </form>

          <form
            onSubmit={handleDefaultExpirationChange}
            className="pt-4 border-t border-neutral-800 mt-6"
          >
            <h4 className="text-md font-semibold text-zinc-200">
              Default File Expiration
            </h4>
            <p className="text-xs text-neutral-400 mb-2">
              Set a default expiration time for all new uploads.
            </p>
            <div>
              <select
                value={defaultFileExpiration}
                onChange={(e) => setDefaultFileExpiration(e.target.value)}
                className="w-full sm:w-1/2 p-2 bg-neutral-900 border border-neutral-700 rounded mt-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {expirationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-2 flex justify-start">
              <button
                type="submit"
                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded text-white disabled:opacity-50"
                disabled={
                  defaultFileExpiration ===
                  (userDetails?.defaultFileExpiration || "never")
                }
              >
                Save Expiration Setting
              </button>
            </div>
          </form>
        </div>
      )}

      {isDeletable &&
        ((loggedInUser.username === selectedUser && !loggedInUser.isAdmin) ||
          (loggedInUser.isAdmin && loggedInUser.username !== selectedUser) ||
          (loggedInUser.isAdmin &&
            loggedInUser.username === selectedUser &&
            selectedUser.toLowerCase() !== "root" &&
            process.env.NEXT_PUBLIC_PREVENT_ROOT_DELETION !== "true")) && (
          <div className="p-4 border border-red-700 rounded-md bg-black mt-8">
            <h3 className="text-lg font-semibold text-red-300 mb-3">
              Delete Account
            </h3>
            <p className="text-sm text-red-200 mb-3">
              This action is irreversible.
            </p>
            <button
              onClick={handleDeleteUser}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded text-white font-semibold"
            >
              Delete{" "}
              {loggedInUser.username === selectedUser
                ? "My Account"
                : selectedUser}
            </button>
          </div>
        )}

      {isTokenModalOpen && userDetails && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-80 p-4 transition-opacity"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeTokenModal();
          }}
        >
          <div className="bg-neutral-800 border border-neutral-800 p-6 rounded-md shadow-xl w-full max-w-lg text-white">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-semibold">
                API Token for {userDetails.username}
              </h4>
              <button
                onClick={closeTokenModal}
                className="text-neutral-400 hover:text-white text-2xl leading-none p-1"
              >
                ×
              </button>
            </div>
            {tokenManagementMessage && (
              <div
                className={`p-3 mb-4 rounded text-sm ${tokenManagementMessage.type === "success"
                  ? "bg-green-700 text-green-100"
                  : "bg-red-700 text-red-100"
                  }`}
              >
                {tokenManagementMessage.text}
              </div>
            )}
            <div className="mb-4">
              <p className="text-sm text-neutral-400 mb-1">
                Current API Token:
              </p>
              <div className="flex items-center gap-2 p-2 bg-neutral-900 rounded border border-neutral-700">
                <span
                  className="font-mono text-sm truncate flex-grow select-all"
                  title={userDetails.token || "No token"}
                >
                  {userDetails.token || "N/A"}
                </span>
                {userDetails.token && (
                  <button
                    onClick={() => handleCopyApiToken(userDetails.token)}
                    title="Copy token"
                    className="p-1 text-neutral-400 hover:text-zinc-100 transition-colors"
                  >
                    {copiedApiToken ? (
                      <CopyCheck className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end items-center gap-3 mt-6 pt-4 border-t border-neutral-800">
              <button
                onClick={handleResetToken}
                disabled={isResettingToken}
                className="w-full sm:w-auto px-4 py-2 text-sm bg-yellow-600 hover:bg-yellow-700 rounded text-white font-semibold disabled:bg-neutral-700 disabled:text-neutral-400"
              >
                {isResettingToken ? (
                  <span className="flex items-center">
                    <LoaderCircle className="animate-spin mr-2 w-5 h-5" />
                    Resetting
                  </span>
                ) : (
                  "Reset Token"
                )}
              </button>
              <button
                type="button"
                onClick={closeTokenModal}
                className="w-full sm:w-auto px-4 py-2 text-sm bg-neutral-700 hover:bg-neutral-600 rounded text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
