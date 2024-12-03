// This entire page should be rewritten and reworked.
import { useState } from "react";
import Header from "@components/Header";
import Footer from "@components/Footer";
import { NextSeo } from "next-seo";
import { getSession, GetSessionParams } from "next-auth/react";
import { GetServerSidePropsContext } from "next";
import { getBase } from "@lib";

function Gallery() {
  return <div className="p-4">Gallery content goes here.</div>;
}

function Links() {
  return <div className="p-4">Links content goes here.</div>;
}

function Settings() {
  return <div className="p-4">Settings content goes here.</div>;
}

export default function Dashboard({
  user,
  users,
}: {
  user: { username: string; isAdmin: boolean };
  users: { username: string }[];
}) {
  const [activePage, setActivePage] = useState<
    "Gallery" | "Links" | "Settings"
  >("Gallery");
  const [selectedUser, setSelectedUser] = useState<string | null>(
    user.username
  );
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const renderActivePage = () => {
    switch (activePage) {
      case "Gallery":
        return <Gallery />;
      case "Links":
        return <Links />;
      case "Settings":
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

      {/* Fixed Header */}
      <Header />

      {/* Main Content Wrapper */}
      <div className="flex flex-col lg:flex-row flex-grow px-4">
        {/* Sidebar Toggle for Mobile */}
        <button
          className="lg:hidden mb-4 bg-zinc-800 text-zinc-100 p-2 rounded hover:bg-zinc-700"
          onClick={() => setSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? "Close Menu" : "Open Menu"}
        </button>

        {/* Sidebar Navigation */}
        <aside
          className={`absolute lg:static left-0 z-10 h-full lg:h-auto w-3/4 sm:w-1/2 lg:w-1/5 bg-black border border-gray-600 p-4 rounded-lg shadow-lg space-y-4 transition-transform duration-300 ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <h1 className="text-xl font-bold mb-4 text-center">
            Hello, {selectedUser}!
          </h1>
          <nav className="space-y-4">
            <button
              className={`w-full px-4 py-2 rounded ${
                activePage === "Gallery"
                  ? "bg-zinc-700 border border-zinc-600"
                  : "bg-zinc-800 hover:bg-zinc-700"
              }`}
              onClick={() => setActivePage("Gallery")}
            >
              Gallery
            </button>
            <button
              className={`w-full px-4 py-2 rounded ${
                activePage === "Links"
                  ? "bg-zinc-700 border border-zinc-600"
                  : "bg-zinc-800 hover:bg-zinc-700"
              }`}
              onClick={() => setActivePage("Links")}
            >
              Links
            </button>
            <button
              className={`w-full px-4 py-2 rounded ${
                activePage === "Settings"
                  ? "bg-zinc-700 border border-zinc-600"
                  : "bg-zinc-800 hover:bg-zinc-700"
              }`}
              onClick={() => setActivePage("Settings")}
            >
              Settings
            </button>
          </nav>

          {/* User List */}
          {user.isAdmin && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Users</h2>
              <ul className="space-y-2">
                {users.map((user) => (
                  <li
                    key={user.username}
                    className={`px-4 py-2 rounded cursor-pointer ${
                      selectedUser === user.username
                        ? "bg-zinc-700 border border-zinc-600"
                        : "bg-zinc-800 hover:bg-zinc-700"
                    }`}
                    onClick={() => setSelectedUser(user.username)}
                  >
                    {user.username}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <section className="flex-grow bg-black rounded-lg shadow-lg lg:ml-4 p-4">
          {renderActivePage()}
        </section>
      </div>

      <Footer />
    </div>
  );
}

export async function getServerSideProps(
  context: GetSessionParams & GetServerSidePropsContext
) {
  const session = await getSession(context);

  if (!session) {
    const callbackUrl = encodeURIComponent(context.resolvedUrl || "/");
    return {
      redirect: {
        destination: `/login?cbU=${callbackUrl}`,
        permanent: false,
      },
    };
  }

  // Fetch users from API
  const res = await fetch(`${getBase(context.req)}/api/users/`, {
    headers: {
      Authorization: session.user.token,
    },
  });
  const data = await res.json();

  if (!data.success) {
    return { props: { user: session.user, users: [] } };
  }

  return {
    props: { user: session.user, users: data.users },
  };
}
