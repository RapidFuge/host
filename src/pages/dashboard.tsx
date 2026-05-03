import { useState, useEffect } from "react";
import Header from "@components/Header";
import Footer from "@components/Footer";
import { NextSeo } from "next-seo";
import { getSession, GetSessionParams } from "next-auth/react";
import { GetServerSidePropsContext } from "next";
import { getBase } from "@lib";
import { X, AlignLeft, Images, Link as LinkIcon, Settings, User } from 'lucide-react';

import GalleryComponent from "@components/dashboard/Gallery";
import LinksComponent from "@components/dashboard/Links";
import SettingsComponent from "@components/dashboard/Settings";

export interface DashboardUser {
  username: string;
  isAdmin: boolean;
  token: string;
}

interface DashboardProps {
  user: DashboardUser;
  users: { username: string }[];
}

type PageName = "Gallery" | "Links" | "Settings";

const pageConfig: { name: PageName; icon: typeof Images }[] = [
  { name: "Gallery", icon: Images },
  { name: "Links", icon: LinkIcon },
  { name: "Settings", icon: Settings },
];

export default function Dashboard({
  user: loggedInUser,
  users,
}: DashboardProps) {
  const pageBaseUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}`
      : "";
  const [activePage, setActivePage] = useState<PageName>("Gallery");
  const [selectedUser, setSelectedUser] = useState<string>(
    loggedInUser.username
  );
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleSelectUser = (username: string) => {
    setSelectedUser(username);
    if (isMobile) setSidebarOpen(false);
  };

  const handlePageChange = (page: PageName) => {
    setActivePage(page);
    if (isMobile) setSidebarOpen(false);
  };

  const renderActivePage = () => {
    switch (activePage) {
      case "Gallery":
        return <GalleryComponent username={selectedUser} isAdmin={loggedInUser.isAdmin} loggedInUsername={loggedInUser.username} />;
      case "Links":
        return (
          <LinksComponent
            username={selectedUser}
            isAdmin={loggedInUser.isAdmin}
            loggedInUsername={loggedInUser.username}
            token={loggedInUser.token}
            baseUrl={pageBaseUrl}
          />
        );
      case "Settings":
        return (
          <SettingsComponent
            loggedInUser={loggedInUser}
            selectedUser={selectedUser}
            baseUrl={pageBaseUrl}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <NextSeo
        title="Rapid Host - Dashboard"
        description="Dashboard"
      />
      <Header />
      <div className="flex flex-col lg:flex-row flex-grow px-3 sm:px-4 pt-4 lg:pt-5 pb-4 gap-4">
        {isMobile && (
          <button
            className="fixed top-[4.5rem] right-4 z-30 p-2 rounded-md bg-surface-elevated border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-lg transition-colors"
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <AlignLeft className="h-5 w-5" />}
          </button>
        )}

        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`
            ${isMobile ? "fixed top-0 left-0 z-20 h-full w-72 pt-16" : "lg:w-60 xl:w-56 shrink-0 lg:sticky lg:top-[5.5rem] lg:h-[calc(100vh-7rem)]"}
            bg-surface-secondary border-r border-b border-[var(--border-subtle)] rounded-r-lg p-4 shadow-lg
            transition-transform duration-200 ease-out
            ${isMobile ? (isSidebarOpen ? "translate-x-0" : "-translate-x-full") : ""}
            overflow-y-auto
          `}
        >
          <div className="mb-6">
            <p className="text-sm text-[var(--text-muted)]">Logged in as</p>
            <p className="text-base font-semibold text-[var(--text-primary)]">
              {loggedInUser.username}
            </p>
            {loggedInUser.isAdmin && selectedUser !== loggedInUser.username && (
              <p className="text-xs text-blue-400 mt-1">
                Viewing: {selectedUser}
              </p>
            )}
          </div>

          <nav className="space-y-1">
            {pageConfig.map(({ name, icon: Icon }) => (
              <button
                key={name}
                className={`
                  flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm font-medium transition-all duration-150
                  ${activePage === name
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 border border-transparent"
                  }
                `}
                onClick={() => handlePageChange(name)}
              >
                <Icon className="w-4 h-4" />
                {name}
              </button>
            ))}
          </nav>

          {loggedInUser.isAdmin && (
            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                View as
              </p>
              <ul className="space-y-0.5 max-h-48 overflow-y-auto">
                {[
                  loggedInUser,
                  ...users.filter((u) => u.username !== loggedInUser.username),
                ].map((userOption) => (
                  <li key={userOption.username}>
                    <button
                      className={`
                        flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-sm transition-all duration-150
                        ${selectedUser === userOption.username
                          ? "bg-blue-500/10 text-blue-400"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5"
                        }
                      `}
                      onClick={() => handleSelectUser(userOption.username)}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span className="truncate">{userOption.username}</span>
                      {userOption.username === loggedInUser.username && (
                        <span className="text-[var(--text-muted)] text-xs">(you)</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        <main className="flex-grow min-w-0">
          <div className="bg-surface-secondary border border-[var(--border-subtle)] rounded-md overflow-hidden min-h-[60vh]">
            {renderActivePage()}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export async function getServerSideProps(
  context: GetSessionParams & GetServerSidePropsContext
) {
  const session = await getSession(context);
  if (!session || !session.user) {
    const callbackUrl = encodeURIComponent(context.resolvedUrl || "/dashboard");
    return {
      redirect: { destination: `/login?cbU=${callbackUrl}`, permanent: false },
    };
  }
  const user = session.user as DashboardUser;
  if (!user.token) {
    console.warn("Warning: Auth token not found in session.user.");
  }

  let fetchedUsers: { username: string }[] = [];
  if (user.isAdmin) {
    try {
      const res = await fetch(`${getBase(context.req)}/api/users/`, {
        headers: { Authorization: user.token },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          fetchedUsers = data.users;
        } else {
          console.error(
            "Failed to fetch users (API success:false):",
            data.message
          );
        }
      } else {
        console.error(
          "Failed to fetch users (HTTP error):",
          res.status,
          await res.text()
        );
      }
    } catch (error) {
      console.error("Exception while fetching users:", error);
    }
  }
  return { props: { user, users: fetchedUsers } };
}
