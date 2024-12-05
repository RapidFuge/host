/* eslint-disable @next/next/no-img-element */
import Header from "@components/Header";
import Footer from "@components/Footer";
import Link from "next/link";
import { NextSeo } from "next-seo";
import { useState, useEffect } from "react";
import CountUp from "react-countup";

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
        description="Rapid Host. a network for ShareX. AKA an image host."
        canonical="https://i.rapidfuge.xyz"
      />
      <Header />

      <section className="flex-grow flex text-gray-600 body-font">
        <div className="max-w-5xl pt-28 md:pt-52 pb-24 mx-auto">
          <h1 className="text-6xl lg:text-8xl md:text-7xl text-center lh-6 ld-04 font-black text-white mb-6">
            RAPID HOST
          </h1>
          <h2 className="text-2xl font-semibold lh-6 ld-04 pb-11 text-gray-300 text-center">
            Rapid Host. a network for ShareX. AKA a file/image host.
          </h2>
          <div className="ml-6 text-center">
            <Link
              href="/upload"
              className="tr04 w-full ml-4 px-4 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 focus:outline-none"
            >
              Upload files
            </Link>
            <Link
              href="/shorten"
              className="tr04 w-full ml-4 px-4 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 focus:outline-none"
            >
              Shorten URLs
            </Link>
          </div>

          <div className="mt-16 text-center">
            <div className="mb-1">
              <h2 className="text-xl font-bold text-gray-400">
                About this instance
              </h2>
            </div>

            <div className="flex flex-col lg:flex-row lg:justify-between lg:space-x-8 space-y-8 lg:space-y-0">
              <div className="flex flex-col items-center">
                <div className="text-sm text-gray-400">VERSION</div>
                <div className="text-lg text-gray-300 font-bold">
                  {process.env.APP_VERSION}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="text-sm text-gray-400">UPTIME</div>
                <div
                  className={`text-lg font-bold ${
                    loading
                      ? "animate-pulse text-gray-300 w-48 mx-auto h-6"
                      : "text-gray-300"
                  }`}
                >
                  {loading ? (
                    "Loading..."
                  ) : (
                    <CountUp end={uptime}>
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
                  className={`text-lg font-bold ${
                    loading
                      ? "animate-pulse text-gray-300 w-48 mx-auto h-6"
                      : "text-gray-300"
                  }`}
                >
                  {loading ? "Loading..." : <CountUp end={uploads} />}
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
