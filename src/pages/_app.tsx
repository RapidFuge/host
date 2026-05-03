import { SessionProvider } from "next-auth/react";
import { AppProps } from "next/app";
import { Toaster } from 'sonner';
import { ProgressProvider } from "@bprogress/next/pages";
import "../styles/globals.css";

import { Prism } from "prism-react-renderer";
(typeof global !== "undefined" ? global : window).Prism = Prism;

import("prismjs/components/prism-markup-templating").then(() => {
  import("prismjs/components/prism-php");
});

import("prismjs/components/prism-lua");
import("prismjs/components/prism-java");
import("prismjs/components/prism-c");
import("prismjs/components/prism-cpp");
import("prismjs/components/prism-csharp");
import("prismjs/components/prism-python");
import("prismjs/components/prism-ruby");

import("prismjs/components/prism-rust");
import("prismjs/components/prism-swift");
import("prismjs/components/prism-kotlin");
import("prismjs/components/prism-scala");
import("prismjs/components/prism-haskell");
import("prismjs/components/prism-elixir");
import("prismjs/components/prism-erlang");
import("prismjs/components/prism-clojure");
import("prismjs/components/prism-perl");
import("prismjs/components/prism-r");
import("prismjs/components/prism-dart");
import("prismjs/components/prism-groovy");
import("prismjs/components/prism-powershell");
import("prismjs/components/prism-batch");
import("prismjs/components/prism-sql");
import("prismjs/components/prism-yaml");
import("prismjs/components/prism-toml");
import("prismjs/components/prism-ini");
import("prismjs/components/prism-docker");
import("prismjs/components/prism-makefile");
import("prismjs/components/prism-gradle");
import("prismjs/components/prism-shell-session");
import("prismjs/components/prism-json");
import("prismjs/components/prism-typescript");
import("prismjs/components/prism-jsx");
import("prismjs/components/prism-tsx");
import("prismjs/components/prism-scss");
import("prismjs/components/prism-less");
import("prismjs/components/prism-markdown");
import("prismjs/components/prism-xml-doc");
import("prismjs/components/prism-vim");

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
