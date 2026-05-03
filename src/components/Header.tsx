import React from "react";
import Link from "next/link";
import Image from "next/image";
import { AlignJustify, X, LogIn, LogOut, LayoutDashboard, Upload, Link as LinkIcon, FileText, BookOpen } from 'lucide-react';
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";

export default function Header() {
  const [navbarOpen, setNavbarOpen] = React.useState(false);
  const { data: session } = useSession();

  const handleLogout = () => {
    toast("Are you sure you want to log out?", {
      duration: 10000,
      action: {
        label: "Log out",
        onClick: () => {
          signOut();
          toast.success("Logged out successfully");
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  const navLinks = [
    { href: "/upload", label: "Upload", icon: Upload },
    { href: "/paste", label: "Paste", icon: FileText },
    { href: "/shorten", label: "Shorten", icon: LinkIcon },
  ];

  return (
    <header className="sticky top-3 z-40 w-[calc(100%-1.5rem)] max-w-5xl mx-auto">
      <div className="glass rounded-lg shadow-lg shadow-black/20 glow-accent-subtle">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image src="/favicon.ico" alt="Rapid Host" width={24} height={24} className="w-6 h-6" />
            <span className="text-lg font-bold tracking-tight text-[var(--text-primary)] group-hover:text-blue-400 transition-colors">
              RAPID HOST
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md hover:bg-white/5 transition-all duration-200"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
            {session && (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md hover:bg-white/5 transition-all duration-200"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dash
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {session ? (
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-red-400 rounded-md hover:bg-red-500/5 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md hover:bg-white/5 transition-all duration-200"
              >
                <LogIn className="w-4 h-4" />
                Log in
              </Link>
            )}
            <Link
              href="/docs"
              className="p-2 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all duration-200"
              title="Docs"
            >
              <BookOpen className="w-4.5 h-4.5" />
            </Link>
            <Link
              href="https://github.com/rapidfuge/host"
              rel="noopener noreferrer"
              target="_blank"
              className="p-2 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            </Link>
            <button
              className="md:hidden p-2 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all duration-200"
              onClick={() => setNavbarOpen(!navbarOpen)}
            >
              {navbarOpen ? <X className="w-5 h-5" /> : <AlignJustify className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {navbarOpen && (
          <nav className="md:hidden border-t border-[var(--border-subtle)] px-3 py-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setNavbarOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md hover:bg-white/5 transition-all"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
            {session && (
              <Link
                href="/dashboard"
                onClick={() => setNavbarOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md hover:bg-white/5 transition-all"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dash
              </Link>
            )}
            <Link
              href="/docs"
              onClick={() => setNavbarOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md hover:bg-white/5 transition-all"
            >
              <BookOpen className="w-4 h-4" />
              Docs
            </Link>
            <div className="border-t border-[var(--border-subtle)] my-1" />
            {session ? (
              <button
                onClick={() => { setNavbarOpen(false); handleLogout(); }}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-red-400 rounded-md hover:bg-red-500/5 transition-all w-full"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setNavbarOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md hover:bg-white/5 transition-all"
              >
                <LogIn className="w-4 h-4" />
                Log in
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
