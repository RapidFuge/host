import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import Header from "@components/Header";
import Footer from "@components/Footer";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [signUpToken, setSignUpToken] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Added loading state
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // Set loading to true

    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
      signUpToken
    });

    setIsLoading(false); // Set loading to false

    if (res?.error) {
      toast.error(res.error || "Invalid signup token or credentials");
    } else {
      router.push("/login?signedUp=true"); // Redirect to login with a success indicator
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-white bg-black">
      <NextSeo title="RAPID HOST - Sign Up" description="Sign up to Rapid Host" />
      <Header />
      <main className="flex-grow flex items-center justify-center text-center px-4">
        <form onSubmit={handleSubmit} className="p-6 rounded-md shadow-md w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-6">Sign Up</h1>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-semibold mb-1 text-left">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 border border-neutral-700 bg-black rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-semibold mb-1 text-left">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-neutral-700 bg-black rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="signUpToken" className="block text-sm font-semibold mb-1 text-left">Sign Up Token</label>
            <input
              type="text"
              id="signUpToken"
              name="signUpToken"
              value={signUpToken}
              onChange={(e) => setSignUpToken(e.target.value)}
              required
              className="w-full px-4 py-2 border border-neutral-700 bg-black rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full px-4 py-2 font-semibold rounded focus:outline-none transition-colors flex items-center justify-center ${isLoading ? "bg-neutral-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <LoaderCircle className="animate-spin mr-2 w-5 h-5" />
                Signing up
              </span>
            ) : (
              "Sign Up"
            )}
          </button>
          <p className="mt-4 text-sm text-neutral-400">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:underline">Log in</Link>
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
}