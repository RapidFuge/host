// components/dashboard/SettingsComponent.tsx
import { useState } from "react";
import type { DashboardUser } from "@pages/dashboard";
import CreateUserForm from "@components/dashboard/settings/CreateUser";
import SignUpTokensManagerModal from "@components/dashboard/settings/ManageSignUpTokens";
import UserConfigSection from "./settings/UserConfigSection";

interface SettingsComponentProps {
  loggedInUser: DashboardUser;
  selectedUser: string;
  baseUrl: string;
}

export default function SettingsComponent({
  loggedInUser,
  selectedUser,
  baseUrl,
}: SettingsComponentProps) {
  const isViewingOwnSettings = loggedInUser.username === selectedUser;
  const [isSignUpTokenModalOpen, setIsSignUpTokenModalOpen] = useState(false);

  return (
    <div className="p-4 h-full flex flex-col text-zinc-100">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white">
          Settings{" "}
          {isViewingOwnSettings
            ? "(Your Account)"
            : `(Viewing: ${selectedUser})`}
        </h2>
      </div>
      {loggedInUser.isAdmin && (
        <div className="mb-8">
          <div className="flex flex-wrap gap-4 items-start p-4 border border-neutral-700 rounded-lg bg-neutral-850">
            {" "}
            {/* neutral */}
            <h3 className="text-lg font-semibold text-white w-full mb-2">
              Admin Tools
            </h3>{" "}
            {/* Added mb-2 */}
            <CreateUserForm token={loggedInUser.token} />
            <button
              onClick={() => setIsSignUpTokenModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition-colors"
            >
              Manage Sign Up Tokens
            </button>
          </div>
        </div>
      )}
      <UserConfigSection
        loggedInUser={loggedInUser}
        selectedUser={selectedUser}
        token={loggedInUser.token}
        baseUrl={baseUrl}
      />
      {loggedInUser.isAdmin && (
        <SignUpTokensManagerModal
          adminAuthToken={loggedInUser.token}
          isOpen={isSignUpTokenModalOpen}
          onClose={() => setIsSignUpTokenModalOpen(false)}
        />
      )}
    </div>
  );
}
