import Header from "@components/Header";
import Footer from "@components/Footer";
import { NextSeo } from "next-seo";
import Link from "next/link";

export default function Contact() {
  return (
    <div className="flex flex-col min-h-screen text-black bg-black">
      <NextSeo
        title="RAPID HOST - 404"
        description="Uh ohhhhh"
        canonical="https://i.rapidfuge.xyz/404"
      />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center text-center px-4">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl text-white">
            404 – Unavailable
          </h1>
          <p className="mt-4 text-gray-400">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link
            href="/"
            className="inline-block mt-6 px-6 py-3 font-bold text-center text-white border border-gray-500 rounded-md hover:bg-white hover:text-black transition-colors"
          >
            Return Home
          </Link>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
