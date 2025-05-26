// components/dashboard/settings/UserConfigSection.tsx
import { useState, useEffect, useCallback } from "react";
import { DashboardUser } from "@pages/dashboard"; // Ensure this path is correct
import { shorteners } from "@lib/generators"; // Assuming ShortenerType is exported along with shorteners array
import { useRouter } from "next/router";

interface UserConfigSectionProps {
  loggedInUser: DashboardUser;
  selectedUser: string;
  token: string; // loggedInUser's token for API calls to modify settings
  baseUrl: string;
}

interface SelectedUserDetails extends DashboardUser {
  shortener?: shorteners;
}

export default function UserConfigSection({
  loggedInUser,
  selectedUser,
  token,
  baseUrl,
}: UserConfigSectionProps) {
  const [userDetails, setUserDetails] = useState<SelectedUserDetails | null>(
    null
  );
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(false);
  const [errorUserDetails, setErrorUserDetails] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedGenerator, setSelectedGenerator] = useState<
    shorteners | undefined
  >(undefined);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenManagementMessage, setTokenManagementMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isResettingToken, setIsResettingToken] = useState(false);
  const router = useRouter();

  const canEditSelectedUser =
    loggedInUser.isAdmin || loggedInUser.username === selectedUser;

  const fetchUserDetails = useCallback(async () => {
    if (!selectedUser) return;
    setIsLoadingUserDetails(true);
    setErrorUserDetails(null);
    try {
      const response = await fetch(`/api/users/${selectedUser}`); // Uses loggedInUser's session for auth
      if (!response.ok) {
        const errData = await response
          .json()
          .catch(() => ({ error: "Failed to fetch user details." }));
        throw new Error(
          errData.error || errData.message || "Failed to fetch user details."
        );
      }
      const data = await response.json();
      if (data.success && data.user) {
        setUserDetails(data.user);
        setSelectedGenerator(data.user.shortener);
      } else {
        throw new Error(data.message || "User data not found in response.");
      }
    } catch (err: any) {
      setErrorUserDetails(err.message);
      setUserDetails(null);
    } finally {
      setIsLoadingUserDetails(false);
    }
  }, [selectedUser]); // Removed token dependency as API should use session

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  const handleDownloadConfig = (isLink: boolean) => {
    const downloadUrl = new URL(
      `${baseUrl}/api/users/${selectedUser}/configuration`
    );
    downloadUrl.searchParams.append("link", String(isLink));
    // The API /api/users/configuration needs to use header auth from the browser session for this GET request
    window.open(downloadUrl.toString(), "_blank");
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (!canEditSelectedUser) {
      alert("You are not authorized to perform this action.");
      return;
    }
    try {
      const response = await fetch(`/api/users/${selectedUser}/configuration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // Action by loggedInUser
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || data.message || "Failed to update password."
        );
      alert(data.message || "Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const openTokenModal = () => {
    setTokenManagementMessage(null);
    setIsTokenModalOpen(true);
  };
  const closeTokenModal = () => setIsTokenModalOpen(false);

  const handleResetToken = async () => {
    if (!canEditSelectedUser) {
      alert("You are not authorized.");
      return;
    }
    if (
      confirm(
        `Reset API token for ${selectedUser}? Current token will no longer work.`
      )
    ) {
      setIsResettingToken(true);
      setTokenManagementMessage(null);
      try {
        const response = await fetch(
          `/api/users/${selectedUser}/configuration`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" }, // Action by loggedInUser
            body: JSON.stringify({ resetToken: true }),
          }
        );
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.error || data.message || "Failed to reset token."
          );
        setTokenManagementMessage({
          type: "success",
          text: data.message || "Token reset successfully!",
        });
        if (data.newToken && userDetails) {
          setUserDetails((prev) =>
            prev ? { ...prev, token: data.newToken } : null
          );
        }
      } catch (err: any) {
        setTokenManagementMessage({ type: "error", text: err.message });
      } finally {
        setIsResettingToken(false);
      }
    }
  };

  const handleCopyToken = (tokenToCopy: string | undefined) => {
    if (!tokenToCopy) {
      setTokenManagementMessage({ type: "error", text: "No token to copy." });
      return;
    }
    navigator.clipboard
      .writeText(tokenToCopy)
      .then(() =>
        setTokenManagementMessage({ type: "success", text: "Token copied!" })
      )
      .catch(() =>
        setTokenManagementMessage({ type: "error", text: "Failed to copy." })
      );
    setTimeout(() => setTokenManagementMessage(null), 3000);
  };

  const handleGeneratorChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditSelectedUser || !selectedGenerator) {
      alert("Cannot update generator.");
      return;
    }
    try {
      const response = await fetch(`/api/users/${selectedUser}/configuration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // Action by loggedInUser
        body: JSON.stringify({ shortener: selectedGenerator }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || data.message || "Failed to update generator."
        );
      alert(data.message || "Generator updated successfully!");
      if (userDetails) {
        setUserDetails((prev) =>
          prev ? { ...prev, shortener: selectedGenerator } : null
        );
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteUser = async () => {
    if (!loggedInUser.isAdmin && loggedInUser.username !== selectedUser) {
      alert("Not authorized.");
      return;
    }
    if (confirm(`DELETE user "${selectedUser}"? This is IRREVERSIBLE.`)) {
      if (confirm(`SECOND CONFIRMATION: Delete user "${selectedUser}"?`)) {
        try {
          const response = await fetch(`/api/users/${selectedUser}`, {
            method: "DELETE",
          }); // Action by loggedInUser (admin)
          const data = await response.json();
          if (!response.ok)
            throw new Error(
              data.error || data.message || "Failed to delete user."
            );
          alert(data.message || `User ${selectedUser} deleted.`);
          if (loggedInUser.username === selectedUser)
            router.push("/api/auth/signout");
          else router.reload(); // Reload to update user list
        } catch (err: any) {
          alert(`Error: ${err.message}`);
        }
      }
    }
  };

  if (isLoadingUserDetails)
    return (
      <p className="p-4 text-neutral-400">Loading user configuration...</p>
    ); // neutral
  if (errorUserDetails)
    return (
      <p className="p-4 text-red-400">
        Error loading configuration: {errorUserDetails}
      </p>
    );
  if (
    !userDetails &&
    !loggedInUser.isAdmin &&
    loggedInUser.username !== selectedUser
  ) {
    return (
      <p className="p-4 text-neutral-400">
        No permission to view these settings.
      </p>
    );
  } // neutral
  if (!userDetails) {
    return <p className="p-4 text-neutral-400">User details not found.</p>;
  } // neutral

  return (
    <div className="mt-6 p-4 space-y-8">
      <div className="p-4 border border-neutral-700 rounded-lg bg-neutral-850">
        {" "}
        {/* neutral */}
        <h3 className="text-lg font-semibold text-white mb-3">
          Download Configurations for {selectedUser}
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleDownloadConfig(false)}
            className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 rounded text-white"
          >
            Download File Upload Config (.sxcu)
          </button>
          <button
            onClick={() => handleDownloadConfig(true)}
            className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 rounded text-white"
          >
            Download URL Shorten Config (.sxcu)
          </button>
        </div>
      </div>
      {canEditSelectedUser && (
        <div className="p-4 border border-neutral-700 rounded-lg bg-neutral-850">
          {" "}
          {/* neutral */}
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
                className="w-full sm:w-1/2 p-2 bg-neutral-700 border border-neutral-600 rounded mt-1 text-white"
                required
                minLength={3}
              />
            </div>{" "}
            {/* neutral */}
            <div>
              <label className="block text-sm text-zinc-300">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full sm:w-1/2 p-2 bg-neutral-700 border border-neutral-600 rounded mt-1 text-white"
                required
                minLength={3}
              />
            </div>{" "}
            {/* neutral */}
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
              className="px-3 py-1.5 text-sm bg-cyan-600 hover:bg-cyan-700 rounded text-white"
            >
              Manage API Token
            </button>
            <p className="text-xs text-neutral-400 mt-1">
              Used for API authentication with upload tools.
            </p>
          </div>{" "}
          {/* neutral */}
          <form onSubmit={handleGeneratorChange} className="mb-6 space-y-3">
            <h4 className="text-md font-semibold text-zinc-200">
              ID Generator for Files/Links
            </h4>
            <div>
              <label className="block text-sm text-zinc-300">
                Select Generator (Current: {userDetails.shortener || "Default"})
              </label>
              <select
                value={selectedGenerator || userDetails.shortener || ""}
                onChange={(e) =>
                  setSelectedGenerator(e.target.value as shorteners)
                }
                className="w-full sm:w-1/2 p-2 bg-neutral-700 border border-neutral-600 rounded mt-1 text-white"
              >
                {" "}
                {/* neutral */}
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
        </div>
      )}
      {loggedInUser.isAdmin && loggedInUser.username !== selectedUser && (
        <div className="p-4 border border-red-700 rounded-lg bg-red-900 bg-opacity-30 mt-8">
          <h3 className="text-lg font-semibold text-red-300 mb-3">
            Delete User Account: {selectedUser}
          </h3>
          <p className="text-sm text-red-200 mb-3">
            This action is irreversible and will delete all user data.
          </p>
          <button
            onClick={handleDeleteUser}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded text-white font-semibold"
          >
            Delete {selectedUser}
          </button>
        </div>
      )}
      {loggedInUser.username === selectedUser && ( // Self-delete option always available if not prevented by other logic
        <div className="p-4 border border-red-700 rounded-lg bg-red-900 bg-opacity-30 mt-8">
          <h3 className="text-lg font-semibold text-red-300 mb-3">
            Delete Your Account
          </h3>
          <p className="text-sm text-red-200 mb-3">
            This action is irreversible. All your data will be deleted.
          </p>
          <button
            onClick={handleDeleteUser}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded text-white font-semibold"
          >
            Delete My Account
          </button>
        </div>
      )}
      {isTokenModalOpen && userDetails && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-75 p-4 transition-opacity"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeTokenModal();
          }}
        >
          <div className="bg-neutral-800 p-6 rounded-lg shadow-xl w-full max-w-lg text-white">
            {" "}
            {/* neutral */}
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-semibold">
                Manage API Token for {userDetails.username}
              </h4>
              <button
                onClick={closeTokenModal}
                className="text-neutral-400 hover:text-white text-2xl leading-none p-1"
              >
                ×
              </button>
            </div>{" "}
            {/* neutral */}
            {tokenManagementMessage && (
              <div
                className={`p-3 mb-4 rounded text-sm ${
                  tokenManagementMessage.type === "success"
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
              </p>{" "}
              {/* neutral */}
              <div className="flex items-center gap-2 p-2 bg-neutral-700 rounded border border-neutral-600">
                {" "}
                {/* neutral */}
                <span
                  className="font-mono text-sm truncate flex-grow select-all"
                  title={userDetails.token || "No token set"}
                >
                  {userDetails.token
                    ? `${userDetails.token.substring(
                        0,
                        8
                      )}...${userDetails.token.substring(
                        userDetails.token.length - 4
                      )}`
                    : "N/A"}
                </span>
                {userDetails.token && (
                  <button
                    onClick={() => handleCopyToken(userDetails.token)}
                    className="p-1.5 text-zinc-300 hover:text-white bg-neutral-600 hover:bg-neutral-500 rounded text-xs"
                    title="Copy full token"
                  >
                    Copy
                  </button>
                )}{" "}
                {/* neutral */}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end items-center gap-3 mt-6 pt-4 border-t border-neutral-700">
              {" "}
              {/* neutral */}
              <button
                onClick={handleResetToken}
                className="w-full sm:w-auto px-4 py-2 text-sm bg-yellow-600 hover:bg-yellow-700 rounded text-white font-semibold disabled:bg-neutral-500"
                disabled={isResettingToken}
              >
                {isResettingToken ? "Resetting..." : "Reset Token"}
              </button>{" "}
              {/* neutral for disabled */}
              <button
                type="button"
                onClick={closeTokenModal}
                className="w-full sm:w-auto px-4 py-2 text-sm bg-neutral-600 hover:bg-neutral-500 rounded text-white"
              >
                Close
              </button>{" "}
              {/* neutral */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
