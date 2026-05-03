import Header from "@components/Header";
import Footer from "@components/Footer";
import Link from "next/link";
import { NextSeo } from "next-seo";
import { useState, useEffect } from "react";
import CountUp from "react-countup";
import { Upload, Link as LinkIcon, FileText, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";


export default function Home() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [uploads, setUploads] = useState(0);
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch("/api/homeData");
      const data = await response.json();
      setUptime(data.uptime);
      setUploads(data.uploads);
      setLoading(false);
    }
    fetchData();

    async function checkVersion() {
      const response = await fetch("/api/checkVersion");
      if (response.ok) {
        const data = await response.json();
        if (!data.match && data.remoteVersion > data.localVersion) {
          toast("You are running an outdated version of Rapid Host", {
            position: 'top-right',
            duration: 10000,
            description: <span><br /><p>Local Version: {data.localVersion}</p><p>Remote Version: {data.remoteVersion}</p></span>
          });
        }
      }
    }
    checkVersion();
  }, []);

  const actions = [
    { href: "/upload", label: "Upload files", icon: Upload },
    { href: "/paste", label: "Create paste", icon: FileText },
    { href: "/shorten", label: "Shorten URL", icon: LinkIcon },
  ];

  const stats = [
    { label: "Version", value: process.env.APP_VERSION || "-" },
    { label: "Uptime", value: uptime, countUp: true, suffix: "h" },
    { label: "Uploads", value: uploads, countUp: true },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <NextSeo
        title="Rapid Host"
        description="Rapid Host. File Hosting & URL Shortening Service"
      />
      <Header />

      <section className="flex-grow flex items-center justify-center relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/[0.03] rounded-full blur-[120px]" />
        </div>
        <div className="max-w-3xl w-full px-4 py-16 sm:py-24 text-center relative">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
            RAPID HOST
          </h1>
          <p className="text-lg text-[var(--text-secondary)] mb-12 max-w-md mx-auto">
            File hosting & URL shortening. Self-hosted, simple, yours.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-16">
            {session && (
              <Link href="/dashboard" className="group">
                <div className="surface surface-hover px-5 py-4 text-center transition-all duration-200 hover:glow-accent-subtle">
                  <div className="flex items-center justify-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
                    <span className="font-semibold text-[var(--text-primary)]">Dashboard</span>
                  </div>
                </div>
              </Link>
            )}
            {actions.map((action) => (
              <Link key={action.href} href={action.href} className="group">
                <div className="surface surface-hover px-5 py-4 text-center transition-all duration-200 hover:glow-accent-subtle">
                  <div className="flex items-center justify-center gap-2">
                    <action.icon className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
                    <span className="font-semibold text-[var(--text-primary)]">{action.label}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  {stat.label}
                </div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  {loading ? (
                    <span className="inline-block w-16 h-4 bg-surface-elevated rounded animate-pulse" />
                  ) : stat.countUp ? (
                    <CountUp end={stat.value as number} delay={0}>
                      {({ countUpRef }) => (
                        <span>
                          <span ref={countUpRef} />
                          {stat.suffix || ""}
                        </span>
                      )}
                    </CountUp>
                  ) : (
                    stat.value
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
