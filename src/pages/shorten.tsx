import { useState } from "react";
import { getSession, GetSessionParams } from "next-auth/react";
import Header from "@components/Header";
import Footer from "@components/Footer";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { GetServerSidePropsContext } from "next";
import { getBase } from "@lib";

export default function ShortenerPage({
  userShortener,
}: {
  userShortener: string;
}) {
  const [url, setUrl] = useState("");
  const [tag, setTag] = useState("");
  const [shortener, setShortenerType] = useState(userShortener);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Call the API to shorten the URL
      const response = await fetch("/api/url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "shorten-url": url,
        },
        body: JSON.stringify({ tag, shortener }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.url);
      } else {
        setError(data.message || "An error occurred while shortening the URL.");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (_err: any) {
      setError("An error occurred while shortening the URL.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-white bg-black">
      <NextSeo
        title="URL Shortener"
        description="Shorten your URLs quickly and easily"
        canonical="https://i.rapidfuge.xyz/shortener"
      />

      <Header />

      <main className="flex-grow flex items-center justify-center text-center px-4">
        <form
          onSubmit={handleSubmit}
          className="p-4 rounded-md shadow-md w-full max-w-sm"
        >
          <h1 className="text-2xl font-bold mb-6">URL Shortener</h1>
          {error && (
            <div className="mb-4 p-2 text-red-500 bg-red-100 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 mb-4 p-2 bg-green-100 border-l-4 border-green-500 text-green-900">
              <Link
                href={success}
                className="text-blue-500 hover:underline bg-green-100 rounded"
              >
                {success}
              </Link>
            </div>
          )}
          <div className="mb-4">
            <label htmlFor="url" className="block text-sm font-semibold mb-1">
              Enter URL
            </label>
            <input
              type="url"
              id="url"
              name="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-600 bg-black rounded text-white focus:outline-none focus:ring focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="url" className="block text-sm font-semibold mb-1">
              Custom Tag (Ignores ID Generator.)
            </label>
            <input
              type="text"
              id="tag"
              name="tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full px-4 py-2 border border-gray-600 bg-black rounded text-white focus:outline-none focus:ring focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="shortenerType"
              className="block text-sm font-semibold mb-1"
            >
              ID Generator
            </label>
            <select
              id="shortenerType"
              value={shortener}
              onChange={(e) => setShortenerType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-600 bg-black rounded text-white focus:outline-none focus:ring focus:border-blue-500"
            >
              <option value="random">Random String</option>
              <option value="timestamp">Timestamp</option>
              <option value="zws">Zero-width Space</option>
              <option value="gfycat">Gfycat</option>
              <option value="nanoid">nanoid</option>
            </select>
          </div>
          <button
            type="submit"
            className="tr04 w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 focus:outline-none"
          >
            Shorten URL
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
}

// Protect the page and fetch session data
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

  const baseUrl = getBase(context.req);

  let userShortener = "random";

  try {
    // Fetch user data from the API
    const userResponse = await fetch(
      `${baseUrl}/api/users/${session.user.username}`,
      {
        headers: {
          Authorization: session.user.token ?? "",
        },
      }
    );
    const userData = await userResponse.json();
    if (userResponse.ok && userData.user.shortener) {
      userShortener = userData.user.shortener;
      console.log();
    }
  } catch (error) {
    console.error("Error fetching data in getServerSideProps:", error);
  }
  return {
    props: {
      userShortener,
    },
  };
}
