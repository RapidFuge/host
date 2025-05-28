// components/dashboard/LinksComponent.tsx
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface ShortenedLink {
  id: string;
  url: string;
  created: string | Date;
  owner: string;
}

interface LinksComponentProps {
  username: string | null;
  token: string;
  baseUrl: string;
}

export default function LinksComponent({
  username,
  baseUrl,
}: LinksComponentProps) {
  const [links, setLinks] = useState<ShortenedLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    if (!username) {
      setLinks([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const apiUrl = `/api/users/${username}/links`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: `HTTP error ${response.status}` }));
        throw new Error(errorData.message || `Failed to fetch links.`);
      }
      const data = await response.json();
      if (data.success) {
        setLinks(data.links);
      } else {
        throw new Error(
          data.message || "API returned success=false while fetching links"
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
      setLinks([]);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleRefresh = () => {
    fetchLinks();
  };

  const handleDeleteLink = async (linkTag: string) => {
    if (!username) return;
    if (
      !window.confirm(
        `Are you sure you want to delete the link with tag "${linkTag}"?`
      )
    )
      return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/url/${linkTag}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP error ${response.status} while deleting.`,
        }));
        throw new Error(
          errorData.error || errorData.message || `Failed to delete link.`
        );
      }
      const responseData = await response.json();
      if (!responseData.success) {
        throw new Error(
          responseData.message || "API reported failure during delete."
        );
      }
      fetchLinks();
      alert(responseData.message || "Link deleted successfully!");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Delete failed:", err);
      setError(`Delete failed: ${err.message}`);
      alert(`Error deleting link: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => alert("Short URL copied to clipboard!"))
      .catch(() => alert("Failed to copy URL."));
  };

  if (!username && !isLoading) {
    return (
      <div className="p-4 text-center text-neutral-400">
        Select a user to view their links.
      </div>
    );
  } // neutral

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h2 className="text-2xl font-semibold text-white">
          {username ? `Links: ${username}` : "Links"}
        </h2>
        <button
          onClick={handleRefresh}
          disabled={isLoading || !username}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-neutral-500 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {" "}
          {/* neutral for disabled */}
          {isLoading ? "Refreshing..." : "Refresh Links"}
        </button>
      </div>
      {error && (
        <div className="bg-red-700 border border-red-600 text-red-100 p-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}
      {isLoading && links.length === 0 && (
        <div className="text-center py-10 text-neutral-400">
          Loading links...
        </div>
      )}{" "}
      {!isLoading && !error && links.length === 0 && username && (
        <div className="text-center py-10 text-neutral-400">
          No links found for this user.
        </div>
      )}{" "}
      {links.length > 0 && (
        <div className="overflow-x-auto flex-grow scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-neutral-800 rounded-md">
          <table className="min-w-full divide-y divide-neutral-700 bg-neutral-800 rounded-md shadow">
            <thead className="bg-neutral-700">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider"
                >
                  Tag (Short ID)
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider"
                >
                  Short URL
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider"
                >
                  Original URL
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider"
                >
                  Created
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-700">
              {" "}
              {/* neutral */}
              {links.map((link) => {
                const shortUrl = `${baseUrl}/${link.id}`;
                return (
                  <tr
                    key={link.id}
                    className="hover:bg-neutral-700 transition-colors duration-150"
                  >
                    {" "}
                    {/* neutral hover */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-200 font-mono">
                      {link.id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <Link
                        href={shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        {shortUrl}
                      </Link>
                      <button
                        onClick={() => copyToClipboard(shortUrl)}
                        className="ml-2 p-1 text-neutral-400 hover:text-zinc-200"
                        title="Copy short URL"
                      >
                        {" "}
                        {/* neutral */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </td>
                    <td
                      className="px-4 py-3 text-sm text-zinc-300 truncate max-w-xs"
                      title={link.url}
                    >
                      <Link
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {link.url}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-400">
                      {new Date(link.created).toLocaleDateString()}
                    </td>{" "}
                    {/* neutral */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        className="text-red-400 hover:text-red-300"
                        title="Delete Link"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
