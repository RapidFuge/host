// pages/_app.tsx
import { SessionProvider } from "next-auth/react";
import { AppProps } from "next/app";
import { ProgressProvider } from "@bprogress/next/pages";
import "../styles/globals.css";
import "prismjs/themes/prism-okaidia.css";

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
      </SessionProvider>
    </ProgressProvider>
  );
}

export default MyApp;
