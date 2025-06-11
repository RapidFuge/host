import { useState, useEffect } from "react";
import Header from "@components/Header";
import Footer from "@components/Footer";
import { NextSeo } from "next-seo";
import { getSession, GetSessionParams } from "next-auth/react";
import { GetServerSidePropsContext } from "next";
import { getBase } from "@lib";
import { X, AlignLeft, Images, Link as LinkIcon, Settings, User } from "lucide-react";

import GalleryComponent from "@components/dashboard/Gallery";
import LinksComponent from "@components/dashboard/Links";
import SettingsComponent from "@components/dashboard/Settings";
// import AnalyticsComponent from "@components/dashboard/AnalyticsComponent";

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
    "Gallery" | "Links" | "Settings" | "Analytics"
  >("Gallery");
  const [selectedUser, setSelectedUser] = useState<string>(
    loggedInUser.username
  );
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loggedInUser.isAdmin && activePage === "Analytics") {
      setActivePage("Gallery");
    }
  }, [loggedInUser.isAdmin, activePage]);

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
      // case "Analytics":
      //   return loggedInUser.isAdmin ? <AnalyticsComponent adminToken={loggedInUser.token} /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-zinc-200">
      <NextSeo
        title="RAPID HOST - Dashboard"
        description="Le fancy dashboard"
      />
      <Header />
      <div className="flex flex-col lg:flex-row flex-grow px-2 sm:px-4 pt-4 lg:pt-6 pb-4 gap-4">
        <button
          className="lg:hidden fixed top-[calc(theme(spacing.16)+1rem)] right-4 z-30 bg-neutral-800 text-zinc-100 p-2 rounded hover:bg-neutral-700 shadow-lg"
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
          aria-expanded={isSidebarOpen}
        >
          {isSidebarOpen ? (
            <X className="h-6 w-6" />

          ) : (
            <AlignLeft className="h-6 w-6" />
          )}
        </button>
        <aside
          className={`fixed lg:sticky top-16 lg:top-[calc(theme(spacing.16)+1.5rem)] left-0 z-20 h-[calc(100vh-4rem)] lg:h-auto w-3/4 sm:w-1/2 lg:w-64 xl:w-1/5 bg-black border border-neutral-800 p-4 rounded-md shadow-lg space-y-4 transition-transform duration-300 ease-in-out ${isSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
            } lg:max-h-[calc(100vh-theme(spacing.16)-3rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-900`}
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
                className={`flex w-full px-4 py-2.5 rounded text-left transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 ${activePage === pageName
                  ? "bg-blue-600 border border-blue-500 text-white shadow-md"
                  : "bg-neutral-800 hover:bg-neutral-700 border border-transparent hover:border-neutral-700 text-zinc-200"
                  }`}
                onClick={() => {
                  setActivePage(pageName);
                  if (isSidebarOpen && window.innerWidth < 1024)
                    setSidebarOpen(false);
                }}
              >
                {pageName === "Gallery" && (
                  <Images className="mr-2 w-5 h-5" />
                )}

                {pageName === "Links" && (
                  <LinkIcon className="mr-2 w-5 h-5" />
                )}

                {pageName === "Settings" && (
                  <Settings className="mr-2 w-5 h-5" />
                )}

                {/* {pageName === "Analytics" && (
                  <Images className="mr-2 w-5 h-5" />
                )} */}
                {pageName}
              </button>
            ))}
            {/* {loggedInUser.isAdmin && (
              <button
                key="Analytics"
                className={`w-full px-4 py-2.5 rounded text-left transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  activePage === "Analytics"
                    ? "bg-blue-600 border border-blue-500 text-white shadow-md"
                    : "bg-neutral-800 hover:bg-neutral-700 border border-transparent hover:border-neutral-700 text-zinc-200"
                }`}
                onClick={() => {
                  setActivePage("Analytics");
                  if (isSidebarOpen && window.innerWidth < 1024)
                    setSidebarOpen(false);
                }}
              >
                Analytics
              </button>
            )} */}
          </nav>
          {loggedInUser.isAdmin && (
            <div className="mt-8 pt-4 border-t border-neutral-800">
              <h2 className="text-lg font-semibold mb-3 text-zinc-300">
                Admin: View As
              </h2>
              <ul className="space-y-1.5 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-900 pr-1">
                {[
                  loggedInUser,
                  ...users.filter((u) => u.username !== loggedInUser.username),
                ].map((userOption) => (
                  <li key={userOption.username}>
                    <button
                      className={`flex w-full px-3 py-2 rounded text-left text-sm transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-blue-400 ${selectedUser === userOption.username
                        ? "bg-blue-500 border border-blue-400 text-white font-medium"
                        : "bg-neutral-800 hover:bg-neutral-700 border border-transparent hover:border-neutral-700 text-zinc-200"
                        }`}
                      onClick={() => handleSelectUser(userOption.username)}
                    >
                      <User className="mr-2 w-5 h-5" />
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
        <main className="flex-grow bg-black border border-neutral-800 rounded-md shadow-lg lg:ml-0 w-full overflow-hidden">
          <div
            className={`h-full ${isSidebarOpen && window.innerWidth < 1024
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
