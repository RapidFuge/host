import { useState } from "react";
import { getSession, GetSessionParams } from "next-auth/react";
import Header from "@components/Header";
import Footer from "@components/Footer";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { GetServerSidePropsContext } from "next";
import { getBase } from "@lib";
import { toast } from "sonner";
import { shorteners as validShorteners } from "@lib/generators"; // Assuming shorteners array is from here
import { LoaderCircle, Link as LinkIcon } from "lucide-react";

export default function ShortenerPage({ userShortener }: { userShortener: string }) {
  const [url, setUrl] = useState("");
  const [tag, setTag] = useState("");
  const [shortener, setShortenerType] = useState(userShortener);
  const [isLoading, setIsLoading] = useState(false); // Added loading state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // Set loading to true

    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "shorten-url": url
        },
        body: JSON.stringify({ tag, shortener })
      });

      const data = await response.json();
      setIsLoading(false); // Set loading to false

      if (response.ok && data.success) { // Check for data.success
        toast.success(<Link href={data.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{data.url}</Link>, { duration: Infinity })
        setUrl(""); // Clear input on success
        setTag("");   // Clear tag on success
      } else {
        toast.error(data.error.message || data.message || "An error occurred while shortening the URL.");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (_err: any) {
      setIsLoading(false); // Set loading to false on error
      toast.error("An error occurred while shortening the URL.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-white bg-black">
      <NextSeo title="RAPID HOST - URL Shortener" description="Shorten your URLs quickly and easily" />
      <Header />
      <main className="flex-grow flex items-center justify-center text-center px-4">
        <form onSubmit={handleSubmit} className="p-4 rounded-md shadow-md w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-6">URL Shortener</h1>
          <div className="mb-4">
            <label htmlFor="url" className="block text-sm font-semibold mb-1 text-left">Enter URL to Shorten</label>
            <input
              type="url"
              id="url"
              name="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full px-4 py-2 border border-neutral-700 bg-black rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="tag" className="block text-sm font-semibold mb-1 text-left">Custom Tag (Optional)</label>
            <input
              type="text"
              id="tag"
              name="tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-700 bg-black rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Leave blank for random ID"
              disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="shortenerType" className="block text-sm font-semibold mb-1 text-left">ID Generator (if no custom tag)</label>
            <select
              id="shortenerType"
              value={shortener}
              onChange={(e) => setShortenerType(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-700 bg-black rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              {validShorteners.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full px-4 py-2 font-semibold rounded focus:outline-none transition-colors flex items-center justify-center ${isLoading ? "bg-neutral-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <LoaderCircle className="animate-spin mr-2 w-5 h-5" />
                Shortening URL
              </span>
            ) : (
              <span className="flex items-center">
                <LinkIcon className="mr-2 w-5 h-5" />
                Shorten URL
              </span>
            )}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}

export async function getServerSideProps(context: GetSessionParams & GetServerSidePropsContext) {
  const session = await getSession(context);
  if (!session || !session.user) {
    const callbackUrl = encodeURIComponent(context.resolvedUrl || "/shortener");
    return { redirect: { destination: `/login?cbU=${callbackUrl}`, permanent: false } };
  }

  const baseUrl = getBase(context.req);
  let userShortener = "random"; // Default

  try {
    const userResponse = await fetch(`${baseUrl}/api/users/${session.user.username}`, {
      headers: { Authorization: session.user.token ?? "" },
    });
    if (userResponse.ok) {
      const userData = await userResponse.json();
      if (userData.success && userData.user && userData.user.shortener) {
        userShortener = userData.user.shortener;
      }
    } else {
      console.warn(`Failed to fetch user shortener preference for ${session.user.username}, status: ${userResponse.status}`);
    }
  } catch (error) {
    console.error("Error fetching user shortener preference in getServerSideProps:", error);
  }
  return { props: { userShortener } };
}