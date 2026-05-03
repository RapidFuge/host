import { useState } from "react";
import type { DashboardUser } from "@pages/dashboard";
import CreateUserForm from "@components/dashboard/settings/CreateUser";
import SignUpTokensManagerModal from "@components/dashboard/settings/ManageSignUpTokens";
import UserConfigSection from "./settings/UserConfigSection";
import { Bolt } from "lucide-react";
import { Button } from "@components/ui";

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
    <div className="p-4 sm:p-5 h-full flex flex-col">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          {loggedInUser.isAdmin
            ? `Settings: ${isViewingOwnSettings ? 'root' : selectedUser}`
            : "Settings"
          }
        </h2>
      </div>
      {loggedInUser.isAdmin && isViewingOwnSettings && (
        <div className="mb-6 p-4 rounded-md bg-surface-elevated border border-[var(--border-subtle)]">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
            Admin Tools
          </h3>
          <div className="flex flex-wrap gap-3">
            <CreateUserForm />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsSignUpTokenModalOpen(true)}
              icon={<Bolt className="w-4 h-4" />}
            >
              Sign Up Tokens
            </Button>
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
