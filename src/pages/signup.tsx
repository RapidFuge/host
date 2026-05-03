import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import Header from "@components/Header";
import Footer from "@components/Footer";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { toast } from "sonner";
import { Button, Input, Card } from "@components/ui";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [signUpToken, setSignUpToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
      signUpToken
    });

    setIsLoading(false);

    if (res?.error) {
      toast.error(res.error || "Invalid signup token or credentials");
    } else {
      router.push("/login?signedUp=true");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <NextSeo title="Rapid Host - Sign Up" description="Sign up to Rapid Host" />
      <Header />
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-sm" padding="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">
              Create account
            </h1>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              You&apos;ll need a sign-up token from an admin
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
              autoComplete="new-password"
            />
            <Input
              label="Sign Up Token"
              type="text"
              value={signUpToken}
              onChange={(e) => setSignUpToken(e.target.value)}
              required
              disabled={isLoading}
            />
            <Button
              type="submit"
              loading={isLoading}
              className="w-full"
              size="lg"
            >
              Create account
            </Button>
          </form>
          <p className="mt-6 text-sm text-center text-[var(--text-muted)]">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
              Sign in
            </Link>
          </p>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
