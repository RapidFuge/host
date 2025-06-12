// components/dashboard/SettingsComponent.tsx
import { useState } from "react";
import type { DashboardUser } from "@pages/dashboard";
import CreateUserForm from "@components/dashboard/settings/CreateUser";
import SignUpTokensManagerModal from "@components/dashboard/settings/ManageSignUpTokens";
import UserConfigSection from "./settings/UserConfigSection";
import { Bolt } from "lucide-react";

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
          {isViewingOwnSettings ? ("Settings") : (`Settings: ${selectedUser}`)}
        </h2>
      </div>
      {loggedInUser.isAdmin && isViewingOwnSettings && (
        <div className="p-4">
          <div className="flex flex-wrap gap-4 items-start p-4 border border-neutral-700 rounded-md bg-neutral-850">
            <h3 className="text-lg font-semibold text-white w-full mb-2">
              Admin Tools
            </h3>{" "}
            <CreateUserForm />
            <button
              onClick={() => setIsSignUpTokenModalOpen(true)}
              className="flex bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded transition-colors"
            >
              <Bolt className="mr-2 w-5 h-5" strokeWidth={2.5} />
              Manage Sign Up Tokens
            </button>
          </div>
        </div>
      )}
      <UserConfigSection
        loggedInUser={loggedInUser}
        selectedUser={selectedUser}
        baseUrl={baseUrl}
      />
      {loggedInUser.isAdmin && (
        <SignUpTokensManagerModal
          isOpen={isSignUpTokenModalOpen}
          onClose={() => setIsSignUpTokenModalOpen(false)}
        />
      )}
    </div>
  );
}
