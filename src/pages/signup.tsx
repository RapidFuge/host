import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import Header from "@components/Header";
import Footer from "@components/Footer";
import { NextSeo } from "next-seo";
import Link from "next/link";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [signUpToken, setSignUpToken] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Pass the signUpToken along with the username and password to next-auth's signIn method
    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
      signUpToken, // Include the signUpToken here
    });

    if (res?.error) {
      setError("Invalid signup token or credentials");
    } else {
      // Redirect to login page or desired page after successful signup
      router.push("/login");
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-white bg-black">
      <NextSeo
        title="RAPID HOST - Sign Up"
        description="Sign up to Rapid Host"
        canonical="https://i.rapidfuge.xyz/signup"
      />

      <Header />

      <main className="flex-grow flex items-center justify-center text-center px-4">
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-md shadow-md w-full max-w-sm"
        >
          <h1 className="text-2xl font-bold mb-6">Sign Up</h1>
          {error && (
            <div className="mb-4 p-2 text-red-500 bg-red-100 rounded">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm font-semibold mb-1"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-600 bg-black rounded text-white focus:outline-none focus:ring focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-semibold mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-600 bg-black rounded text-white focus:outline-none focus:ring focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="signUpToken"
              className="block text-sm font-semibold mb-1"
            >
              Sign Up Token
            </label>
            <input
              type="text"
              id="signUpToken"
              name="signUpToken"
              value={signUpToken}
              onChange={(e) => setSignUpToken(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-600 bg-black rounded text-white focus:outline-none focus:ring focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="tr04 w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 focus:outline-none"
          >
            Sign Up
          </button>
          <p className="mt-4 text-sm text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-500 hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </main>

      <Footer />
    </div>
  );
}
