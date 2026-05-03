import { useState } from "react";
import { getSession, GetSessionParams } from "next-auth/react";
import Header from "@components/Header";
import Footer from "@components/Footer";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { GetServerSidePropsContext } from "next";
import { getBase } from "@lib";
import { toast } from "sonner";
import { shorteners as validShorteners } from "@lib/generators";
import { Link as LinkIcon } from "lucide-react";
import { Button, Input, Select, Card } from "@components/ui";

export default function ShortenerPage({ userShortener }: { userShortener: string }) {
  const [url, setUrl] = useState("");
  const [tag, setTag] = useState("");
  const [shortener, setShortenerType] = useState(userShortener);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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
      setIsLoading(false);

      if (response.ok && data.success) {
        toast.success(<Link href={data.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{data.url}</Link>, { duration: Infinity })
        setUrl("");
        setTag("");
      } else {
        toast.error(data.error.message || data.message || "An error occurred while shortening the URL.");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (_err: any) {
      setIsLoading(false);
      toast.error("An error occurred while shortening the URL.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <NextSeo title="Rapid Host - URL Shortener" description="Shorten your URLs quickly and easily" />
      <Header />
      <main className="flex-grow flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-sm" padding="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-2">
              <h1 className="text-xl font-bold text-[var(--text-primary)]">Shorten URL</h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">Create a short link from any URL</p>
            </div>
            <Input
              label="URL to shorten"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={isLoading}
              placeholder="https://example.com/very-long-url"
            />
            <Input
              label="Custom tag (optional)"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              disabled={isLoading}
              placeholder="Leave blank for random"
            />
            <Select
              label="ID Generator"
              options={validShorteners.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
              value={shortener}
              onChange={(e) => setShortenerType(e.target.value)}
              disabled={isLoading}
            />
            <Button
              type="submit"
              loading={isLoading}
              icon={<LinkIcon className="w-4 h-4" />}
              className="w-full"
              size="lg"
            >
              Shorten URL
            </Button>
          </form>
        </Card>
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
  let userShortener = "random";

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
