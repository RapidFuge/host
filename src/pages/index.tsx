// /index.tsx
/* eslint-disable @next/next/no-img-element */
import Header from "@components/Header";
import Footer from "@components/Footer";
import Link from "next/link";
import { NextSeo } from "next-seo";
import { useState, useEffect } from "react";
import CountUp from "react-countup";
import { Upload, Link as LinkIcon } from "lucide-react";

export default function Home() {
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
  }, []);

  return (
    <div className="text-black bg-black flex flex-col min-h-screen">
      <NextSeo
        title="RAPID HOST"
        description="Rapid Host. File Hosting & URL Shortening Service"
      />
      <Header />

      <section className="flex-grow flex text-gray-600 body-font">
        <div className="max-w-5xl pt-28 md:pt-52 pb-24 mx-auto">
          <h1 className="text-6xl lg:text-8xl md:text-7xl text-center lh-6 ld-04 font-black text-white mb-6">
            RAPID HOST
          </h1>
          <h2 className="text-2xl font-semibold lh-6 ld-04 pb-11 text-gray-300 text-center">
            Rapid Host. File Hosting & URL Shortening Service
          </h2>

          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href="/upload"
              className="flex items-center justify-center tr04 px-6 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 focus:outline-none w-auto text-center"
            >
              <Upload className="mr-2 w-5 h-5" strokeWidth={2.5} />{" "}
              Upload files
            </Link>
            <Link
              href="/shorten"
              className="flex items-center justify-center tr04 px-6 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 focus:outline-none w-auto text-center"
            >
              <LinkIcon className="mr-2 w-5 h-5" strokeWidth={2.5} />{" "}
              Shorten URLs
            </Link>
          </div>

          <div className="mt-16 text-center">
            <div className="mb-1">
              <h2 className="text-xl font-bold text-gray-400">
                About this instance
              </h2>
            </div>

            <div className="flex flex-col lg:flex-row lg:justify-between lg:space-x-0 lg:gap-8 space-y-8 lg:space-y-0 pt-4">
              <div className="flex flex-col items-center">
                <div className="text-sm text-gray-400">VERSION</div>
                <div className="text-lg text-gray-300 font-bold">
                  {process.env.APP_VERSION}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="text-sm text-gray-400">UPTIME</div>
                <div
                  className={`text-lg font-bold ${loading
                    ? "animate-pulse text-gray-300 w-48 mx-auto h-6 bg-gray-700 rounded"
                    : "text-gray-300"
                    }`}
                >
                  {loading ? (
                    ""
                  ) : (
                    <CountUp end={uptime} delay={0}>
                      {({ countUpRef }) => (
                        <div>
                          <span ref={countUpRef} /> Hour(s)
                        </div>
                      )}
                    </CountUp>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="text-sm text-gray-400">UPLOADS</div>
                <div
                  className={`text-lg font-bold ${loading
                    ? "animate-pulse text-gray-300 w-48 mx-auto h-6 bg-gray-700 rounded"
                    : "text-gray-300"
                    }`}
                >
                  {loading ? "" : <CountUp end={uploads} delay={0} />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
