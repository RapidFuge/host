import Header from "@components/Header";
import Footer from "@components/Footer";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { Button } from "@components/ui";

export default function Custom404() {
  return (
    <div className="flex flex-col min-h-screen">
      <NextSeo title="Rapid Host - 404" description="Page not found" />
      <Header />
      <main className="flex-grow flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-7xl font-bold text-[var(--text-muted)] opacity-40 mb-4">404</p>
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Page not found
          </h1>
          <p className="text-sm text-[var(--text-muted)] mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Link href="/">
            <Button variant="secondary">Return home</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
