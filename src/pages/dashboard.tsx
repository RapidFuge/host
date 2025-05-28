// pages/dashboard.tsx
import { useState } from "react";
import Header from "@components/Header";
import Footer from "@components/Footer";
import { NextSeo } from "next-seo";
import { getSession, GetSessionParams } from "next-auth/react";
import { GetServerSidePropsContext } from "next";
import { getBase } from "@lib";

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

export default function Dashboard({
  user: loggedInUser,
  users,
}: DashboardProps) {
  const pageBaseUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}`
      : "";
  const [activePage, setActivePage] = useState<
    "Gallery" | "Links" | "Settings"
  >("Gallery");
  const [selectedUser, setSelectedUser] = useState<string>(
    loggedInUser.username
  );
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const handleSelectUser = (username: string) => {
    setSelectedUser(username);
    if (isSidebarOpen && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const renderActivePage = () => {
    switch (activePage) {
      case "Gallery":
        return <GalleryComponent username={selectedUser} />;
      case "Links":
        return (
          <LinksComponent
            username={selectedUser}
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
    <div className="flex flex-col min-h-screen bg-black text-zinc-100">
      <NextSeo
        title="RAPID HOST - Dashboard"
        description="Le fancy dashboard"
        canonical="https://i.rapidfuge.xyz/dashboard"
      />
      <Header />
      <div className="flex flex-col lg:flex-row flex-grow px-2 sm:px-4 pt-4 lg:pt-6 pb-4 gap-4">
        <button
          className="lg:hidden fixed top-[calc(theme(spacing.16)+2.2rem)] right-4 z-30 bg-neutral-700 text-zinc-100 p-2 rounded hover:bg-neutral-600 shadow-lg" // neutral
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
          aria-expanded={isSidebarOpen}
        >
          {isSidebarOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          )}
        </button>
        <aside
          className={`fixed lg:sticky top-16 lg:top-[calc(theme(spacing.16)+1.5rem)] left-0 z-20 h-[calc(100vh-4rem)] lg:h-auto w-3/4 sm:w-1/2 lg:w-64 xl:w-1/5 bg-neutral-900 border border-neutral-700 p-4 rounded-lg shadow-lg space-y-4 transition-transform duration-300 ease-in-out ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          } lg:max-h-[calc(100vh-theme(spacing.16)-3rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-neutral-800`} // neutral
        >
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-white">
              Hello, {loggedInUser.username}!
            </h1>
            {loggedInUser.isAdmin && selectedUser !== loggedInUser.username && (
              <p className="text-sm text-yellow-400 mt-1">
                Viewing: {selectedUser}
              </p>
            )}
          </div>
          <nav className="space-y-2">
            {(["Gallery", "Links", "Settings"] as const).map((pageName) => (
              <button
                key={pageName}
                className={`w-full px-4 py-2.5 rounded text-left transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  activePage === pageName
                    ? "bg-blue-600 border border-blue-500 text-white shadow-md"
                    : "bg-neutral-700 hover:bg-neutral-600 border border-transparent hover:border-neutral-500 text-zinc-200"
                }`} // neutral for non-active
                onClick={() => {
                  setActivePage(pageName);
                  if (isSidebarOpen && window.innerWidth < 1024)
                    setSidebarOpen(false);
                }}
              >
                {pageName}
              </button>
            ))}
          </nav>
          {loggedInUser.isAdmin && (
            <div className="mt-8 pt-4 border-t border-neutral-700">
              {" "}
              {/* neutral border */}
              <h2 className="text-lg font-semibold mb-3 text-zinc-300">
                Admin: View As
              </h2>
              <ul className="space-y-1.5 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-neutral-800 pr-1">
                {" "}
                {/* neutral scrollbar */}
                {[
                  loggedInUser,
                  ...users.filter((u) => u.username !== loggedInUser.username),
                ].map((userOption) => (
                  <li key={userOption.username}>
                    <button
                      className={`w-full px-3 py-2 rounded text-left text-sm transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-blue-400 ${
                        selectedUser === userOption.username
                          ? "bg-blue-500 border border-blue-400 text-white font-medium"
                          : "bg-neutral-600 hover:bg-neutral-500 border border-transparent hover:border-neutral-500 text-zinc-200"
                      }`} // neutral for non-active
                      onClick={() => handleSelectUser(userOption.username)}
                    >
                      {userOption.username}
                      {userOption.username === loggedInUser.username &&
                        " (You)"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
        <main className="flex-grow bg-neutral-900 rounded-lg shadow-lg lg:ml-0 w-full overflow-hidden">
          {" "}
          {/* neutral */}
          <div
            className={`h-full ${
              isSidebarOpen && window.innerWidth < 1024
                ? "mt-12 lg:mt-0"
                : "mt-0"
            }`}
          >
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
      }); // Ensure correct auth header if needed
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
