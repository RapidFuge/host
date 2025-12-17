// pages/_app.tsx
import { SessionProvider } from "next-auth/react";
import { AppProps } from "next/app";
import { Toaster } from 'sonner';
import { ProgressProvider } from "@bprogress/next/pages";
import "../styles/globals.css";

import { Prism } from "prism-react-renderer";
(typeof global !== "undefined" ? global : window).Prism = Prism;
import("prismjs/components/prism-lua");

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <ProgressProvider
      height="3px"
      color="#2563eb"
      options={{ showSpinner: false }}
      shallowRouting
    >
      <SessionProvider session={session}>
        <Component {...pageProps} />
        <Toaster position="top-center" richColors closeButton theme="dark" />
      </SessionProvider>
    </ProgressProvider>
  );
}

export default MyApp;
