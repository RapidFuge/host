// pages/dashboard.tsx
import { useState } from "react";
import Header from "@components/Header";
import Footer from "@components/Footer";
import { NextSeo } from "next-seo";
import { getSession, GetSessionParams } from "next-auth/react";
import { GetServerSidePropsContext } from "next";
import { getBase } from "@lib";

// Import the new Gallery component
import GalleryComponent from "@components/dashboard/Gallery"; // Path to your new component

// Links and Settings components (remain unchanged for now)
function Links() {
  return <div className="p-4">Links content goes here.</div>;
}

function Settings() {
  return <div className="p-4">Settings content goes here.</div>;
}

// Define the user type more precisely, especially including the token
interface DashboardUser {
  username: string;
  isAdmin: boolean;
  token: string; // Crucial for API calls from the client-side gallery
}

interface DashboardProps {
  user: DashboardUser;
  users: { username: string }[];
}

export default function Dashboard({
  user: loggedInUser, // Renamed to avoid confusion with selectedUser
  users,
}: DashboardProps) {
  const [activePage, setActivePage] = useState<
    "Gallery" | "Links" | "Settings"
  >("Gallery");
  // selectedUser is the username of the user whose content is being viewed
  const [selectedUser, setSelectedUser] = useState<string>(
    loggedInUser.username // Default to the logged-in user
  );
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Function to handle user selection from the admin list
  const handleSelectUser = (username: string) => {
    setSelectedUser(username);
    if (isSidebarOpen && window.innerWidth < 1024) {
      // lg breakpoint in Tailwind
      setSidebarOpen(false); // Close sidebar on mobile after selection
    }
  };

  const renderActivePage = () => {
    switch (activePage) {
      case "Gallery":
        // Pass the selectedUser's username and the loggedInUser's token
        return (
          <GalleryComponent
            username={selectedUser}
            token={loggedInUser.token}
          />
        );
      case "Links":
        // You might want to pass selectedUser and token here too if Links are user-specific
        return <Links />;
      case "Settings":
        // Settings usually pertain to the loggedInUser
        return <Settings />;
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
        {/* Sidebar Toggle for Mobile - Improved Positioning */}
        <button
          className="lg:hidden fixed top-[calc(theme(spacing.16)+0.5rem)] right-4 z-30 bg-gray-700 text-zinc-100 p-2 rounded hover:bg-gray-600 shadow-lg"
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

        {/* Sidebar Navigation */}
        <aside
          className={`fixed lg:sticky top-16 lg:top-[calc(theme(spacing.16)+1.5rem)] left-0 z-20 h-[calc(100vh-4rem)] lg:h-auto w-3/4 sm:w-1/2 lg:w-64 xl:w-1/5 bg-gray-900 border border-gray-700 p-4 rounded-lg shadow-lg space-y-4 transition-transform duration-300 ease-in-out
            ${
              isSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            }
            lg:max-h-[calc(100vh-theme(spacing.16)-3rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800`}
        >
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold">
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
                    : "bg-gray-700 hover:bg-gray-600 border border-transparent hover:border-gray-500"
                }`}
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
            <div className="mt-8 pt-4 border-t border-gray-700">
              <h2 className="text-lg font-semibold mb-3 text-zinc-300">
                Admin: View As
              </h2>
              <ul className="space-y-1.5 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-1">
                {[
                  loggedInUser,
                  ...users.filter((u) => u.username !== loggedInUser.username),
                ].map((userOption) => (
                  <li key={userOption.username}>
                    <button
                      className={`w-full px-3 py-2 rounded text-left text-sm transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-blue-400 ${
                        selectedUser === userOption.username
                          ? "bg-blue-500 border border-blue-400 text-white font-medium"
                          : "bg-gray-600 hover:bg-gray-500 border border-transparent hover:border-gray-500"
                      }`}
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

        {/* Main Content */}
        <main className="flex-grow bg-gray-900 rounded-lg shadow-lg lg:ml-0 w-full overflow-hidden">
          {/* Margin for mobile toggle button. Content area will have its own padding. */}
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
    const callbackUrl = encodeURIComponent(context.resolvedUrl || "/dashboard"); // Default to /dashboard
    return {
      redirect: {
        destination: `/login?cbU=${callbackUrl}`,
        permanent: false,
      },
    };
  }

  // Ensure the session.user object includes the token.
  // This depends on your NextAuth.js configuration (e.g., jwt callback).
  // If session.user.token is not available, you need to configure NextAuth to add it.
  const user = session.user as DashboardUser; // Cast to include token
  if (!user.token) {
    console.warn(
      "Warning: Auth token not found in session.user. API calls from client might fail."
    );
    // Potentially redirect to login or handle error if token is absolutely required by this point
    // For now, we'll proceed, but Gallery API calls will likely fail without a token.
  }

  let fetchedUsers: { username: string }[] = [];
  if (user.isAdmin) {
    try {
      const res = await fetch(`${getBase(context.req)}/api/users/`);
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

  return {
    props: {
      user, // This now includes { username, isAdmin, token, ...other session user props }
      users: fetchedUsers,
    },
  };
}
