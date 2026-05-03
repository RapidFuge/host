import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import Header from "@components/Header";
import Footer from "@components/Footer";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { toast } from "sonner";
import { Button, Input, Card } from "@components/ui";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    setIsLoading(false);

    if (res?.error) {
      toast.error(res.error || "Invalid credentials");
    } else {
      const callbackUrl = (router.query.cbU as string) || "/dashboard";
      router.push(callbackUrl);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <NextSeo title="Rapid Host - Login" description="Login to Rapid Host" />
      <Header />
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-sm" padding="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">
              Welcome back
            </h1>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              Sign in to your account
            </p>
            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="username"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
            <Button
              type="submit"
              loading={isLoading}
              className="w-full"
              size="lg"
            >
              Sign in
            </Button>
          </form>
          <p className="mt-6 text-sm text-center text-[var(--text-muted)]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-blue-400 hover:text-blue-300 transition-colors">
              Sign up
            </Link>
          </p>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
