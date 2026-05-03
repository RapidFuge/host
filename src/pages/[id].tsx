import { GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import { useRouter } from "next/router";
import { NextSeo } from "next-seo";
import React, { useState, useEffect } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeReact from "rehype-react";
import rehypePrismPlus from "rehype-prism-plus";
import { LoaderCircle, Download, Trash2, Edit3 } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";

import {
  Highlight as SyntaxHighlighter,
  themes,
  Language,
  LineInputProps,
  TokenInputProps,
} from "prism-react-renderer";

import { filesize } from "filesize";
import mime from "mime-types";

import { formatTimeRemaining, getBase } from "@lib";
import Header from "@components/Header";
import Footer from "@components/Footer";
import Link from "next/link";
import Head from "next/head";
import { toast } from "sonner";
import { Button, Toggle } from "@components/ui";

interface FileData {
  id: string;
  name: string;
  publicFileName?: string;
  extension?: string | null;
  mimetype: string;
  size: number;
  owner: string;
  isPrivate: boolean;
  expiresAt?: string | null;
  fileType?: 'file' | 'paste';
  ownerEmbedPreference?: boolean;
  ownerCustomDescription?: string | null;
}

interface FilePageProps {
  fileData: FileData | null;
  rawFileContent: string | null;
  isAuthenticated: boolean;
  isOwner: boolean;
  fileUrl: string;
  baseUrl: string;
  error?: string;
}

interface SyntaxHighlightRenderProps {
  className: string;
  style: React.CSSProperties;
  tokens: Array<Array<{ content: string; types: string[] }>>;
  getLineProps: (input: LineInputProps) => Record<string, unknown>;
  getTokenProps: (input: TokenInputProps) => Record<string, unknown>;
}

const getLanguage = (extension?: string | null): Language => {
  const ext = extension?.toLowerCase() || "";
  const langMap: { [key: string]: string } = {
    txt: "plain text", log: "plain text", env: "plain text", cfg: "plain text",
    js: "javascript", jsx: "jsx", mjs: "javascript", cjs: "javascript",
    ts: "typescript", tsx: "tsx", mts: "typescript", cts: "typescript",
    py: "python", pyw: "python", pyi: "python",
    md: "markdown", markdown: "markdown", mdx: "markdown",
    html: "markup", htm: "markup",
    css: "css", scss: "scss", sass: "scss", less: "less",
    json: "json", jsonc: "json", json5: "json",
    java: "java", jar: "java",
    c: "c", h: "c", cpp: "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp", hxx: "cpp",
    cs: "csharp", vb: "vbnet",
    go: "go", mod: "go",
    rb: "ruby", erb: "ruby",
    php: "php", phtml: "php",
    swift: "swift",
    sh: "bash", bash: "bash", zsh: "bash", fish: "bash",
    yaml: "yaml", yml: "yaml",
    lua: "lua",
    pl: "perl", pm: "perl",
    sql: "sql", mysql: "sql", pgsql: "sql",
    rs: "rust", toml: "toml",
    kt: "kotlin", kts: "kotlin",
    xml: "xml", svg: "xml", xsd: "xml", xsl: "xml",
    ini: "ini", conf: "ini",
    bat: "batch", cmd: "batch",
    ps1: "powershell", psm1: "powershell",
    r: "r", R: "r",
    dart: "dart",
    hs: "haskell", lhs: "haskell",
    erl: "erlang", hrl: "erlang",
    ex: "elixir", exs: "elixir",
    clj: "clojure", cljs: "clojure",
    scala: "scala",
    groovy: "groovy", gradle: "groovy",
    vim: "vim",
    dockerfile: "docker", docker: "docker",
    makefile: "makefile", mk: "makefile",
    maven: "xml",
    vue: "markup", svelte: "markup",
    tf: "hcl", hcl: "hcl",
    proto: "protobuf",
    graphql: "graphql", gql: "graphql",
    wasm: "wasm",
    desktop: "ini",
  };
  return (langMap[ext] || "clike") as Language;
};

const TEXT_BASED_EXTENSIONS = new Set([
  "txt", "log", "env", "cfg", "conf",
  "md", "markdown", "mdx",
  "js", "mjs", "cjs", "ts", "mts", "cts", "jsx", "tsx",
  "json", "jsonc", "json5",
  "html", "htm", "css", "scss", "sass", "less",
  "xml", "svg", "xsd", "xsl",
  "py", "pyw", "pyi",
  "java", "c", "h", "cpp", "cc", "cxx", "hpp", "hxx",
  "cs", "vb",
  "go", "mod",
  "rb", "erb",
  "php", "phtml",
  "swift",
  "sh", "bash", "zsh", "fish",
  "yaml", "yml",
  "ini", "toml", "cfg",
  "lua",
  "pl", "pm",
  "sql",
  "rs",
  "kt", "kts",
  "ps1", "psm1",
  "bat", "cmd",
  "r",
  "dart",
  "hs", "lhs",
  "erl", "hrl",
  "ex", "exs",
  "clj", "cljs",
  "scala",
  "groovy", "gradle",
  "vim",
  "dockerfile",
  "makefile", "mk",
  "vue", "svelte",
  "proto", "graphql", "gql",
  "tf", "hcl",
  "desktop",
  "ejs", "haml",
]);

const BROWSER_PREVIEWABLE_EXTENSIONS = new Set(["pdf"]);

const markdownComponents = {
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const { href, children, ...rest } = props;
    if (href && (href.startsWith("/") || href.startsWith("#"))) {
      return <Link href={href} {...rest} className="text-blue-400 hover:underline">{children}</Link>;
    }
    return <a href={href} target="_blank" rel="noopener noreferrer" {...rest} className="text-blue-400 hover:underline">{children}</a>;
  },
};

export default function FileViewerPage({
  fileData,
  rawFileContent,
  isAuthenticated,
  isOwner,
  fileUrl,
  baseUrl,
  error,
}: FilePageProps) {
  const router = useRouter();
  const [renderMarkdown, setRenderMarkdown] = useState(true);
  const [markdownContent, setMarkdownContent] = useState<React.ReactElement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPrivate, setIsPrivate] = useState(fileData?.isPrivate || false);
  const [showRelativeTime, setShowRelativeTime] = useState(true);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [isExpiring, setIsExpiring] = useState(!!fileData?.expiresAt);
  const [isRemovingExpiry, setIsRemovingPrivacy] = useState(false);

  useEffect(() => {
    if (fileData?.extension?.toLowerCase() === "md" && rawFileContent) {
      (async () => {
        try {
          const processor = unified()
            .use(remarkParse).use(remarkGfm)
            .use(remarkRehype, { allowDangerousHtml: true }).use(rehypeRaw).use(rehypeSlug)
            .use(rehypePrismPlus, { ignoreMissing: true })
            .use(rehypeReact, { createElement: React.createElement, Fragment: React.Fragment, components: markdownComponents, jsx, jsxs });
          const file = await processor.process(rawFileContent);
          setMarkdownContent(file.result as React.ReactElement);
        } catch (e) {
          console.error("Error processing Markdown:", e);
          setMarkdownContent(React.createElement("p", null, "Error rendering Markdown."));
        }
      })();
    }
  }, [fileData, rawFileContent]);

  let seoConfig = {};
  if (error) {
    seoConfig = { title: "Rapid Host - Error", description: error, noindex: true, nofollow: true };
  } else if (!fileData) {
    seoConfig = { title: "Rapid Host - File Not Found", description: "The requested file could not be found.", noindex: true, nofollow: true };
  } else {
    const { id, name, mimetype, size, owner, isPrivate, ownerEmbedPreference, ownerCustomDescription } = fileData;
    const isImage = mimetype?.startsWith("image/");
    const isVideo = mimetype?.startsWith("video/");
    const pageFullUrl = `${baseUrl}/${id}`;

    if ((isImage || isVideo) && ownerEmbedPreference) {
      seoConfig = {
        noindex: isPrivate, nofollow: isPrivate, canonical: pageFullUrl,
        openGraph: {
          type: isImage ? "image.png" : "video.other",
          ...(isImage ? { images: [{ url: fileUrl, type: mimetype }] } : {}),
          ...(isVideo ? { videos: [{ url: fileUrl, type: mimetype }] } : {}),
        },
        twitter: { cardType: "summary_large_image" },
      };
    } else {
      let finalEmbedDescription = `Size: ${size ? filesize(size) : "N/A"} | Type: ${mimetype}${owner ? ` | Uploaded by: ${owner}` : ""}`;
      if (ownerCustomDescription && ownerCustomDescription.trim() !== "") finalEmbedDescription = ownerCustomDescription;
      seoConfig = {
        title: name, description: finalEmbedDescription, canonical: pageFullUrl, noindex: isPrivate, nofollow: isPrivate,
        openGraph: {
          url: pageFullUrl, type: isVideo ? "video.other" : "article", title: name || "View File", description: finalEmbedDescription,
          ...(isImage ? { images: [{ url: fileUrl, type: mimetype }] } : {}),
          ...(isVideo ? { videos: [{ url: fileUrl, type: mimetype }] } : {}),
        },
        twitter: { cardType: isImage || isVideo ? "summary_large_image" : "summary" },
      };
    }
  }

  if (error) {
    return (
      <>
        <NextSeo {...seoConfig} />
        <Header />
        <div className="flex flex-col flex-grow items-center justify-center p-4">
          <h1 className="text-xl text-red-400 font-semibold">Error</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={() => router.back()}>Go back</Button>
        </div>
        <Footer />
      </>
    );
  }
  if (!fileData) {
    return (
      <>
        <NextSeo title="File Not Found" noindex nofollow />
        <Header />
        <div className="flex flex-col flex-grow items-center justify-center text-[var(--text-muted)]">
          File data is missing.
        </div>
        <Footer />
      </>
    );
  }

  const { id, name, extension, mimetype, size, owner } = fileData;
  const language = getLanguage(extension);
  const isMarkdownFile = extension?.toLowerCase() === "md" || extension?.toLowerCase() === "markdown";
  const isTextBased = extension ? TEXT_BASED_EXTENSIONS.has(extension.toLowerCase()) : false;
  const syntaxThemeForRawView = themes.oneDark;

  const handleDelete = async () => {
    if (isOwner) {
      toast("Delete this file? This cannot be undone.", {
        duration: 10000,
        action: {
          label: "Delete",
          onClick: async () => {
            setIsDeleting(true);
            try {
              const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
              if (!res.ok) { const errData = await res.json().catch(() => ({ message: "Delete failed." })); throw new Error(errData.message); }
              toast.success("File deleted.");
              router.push("/dashboard");
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) { toast.error(err.message); } finally { setIsDeleting(false); }
          },
        },
        cancel: { label: "Cancel", onClick: () => {} },
      });
    }
  };

  const handleRemoveExpiry = async () => {
    if (isOwner) {
      if (isRemovingExpiry) return;
      toast("Remove expiry?", {
        duration: 10000,
        action: {
          label: "Confirm",
          onClick: async () => {
            setIsRemovingPrivacy(true);
            try {
              const res = await fetch(`/api/files/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ removeExpiry: true }) });
              if (!res.ok) { const errData = await res.json().catch(() => ({ message: "Failed." })); throw errData.message || errData || "Failed."; }
              setIsExpiring(false);
              toast.success("Expiry removed!");
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) { toast.error(err.message || err); } finally { setIsRemovingPrivacy(false); }
          },
        },
        cancel: { label: "Cancel", onClick: () => {} },
      });
    }
  };

  const handlePrivacyChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isOwner) {
      const newIsPrivate = e.target.checked;
      if (isUpdatingPrivacy) return;
      setIsUpdatingPrivacy(true);
      setIsPrivate(newIsPrivate);
      try {
        const res = await fetch(`/api/files/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPrivate: newIsPrivate }) });
        if (!res.ok) { const errData = await res.json().catch(() => ({ message: "Failed." })); throw errData.message || errData || "Failed."; }
        toast.success(`File set to ${newIsPrivate ? "private" : "public"}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) { setIsPrivate(!newIsPrivate); toast.error(`Failed: ${err.message}`); } finally { setIsUpdatingPrivacy(false); }
    }
  };

  const renderFileContent = () => {
    const preClasses = "p-4 overflow-auto text-sm bg-surface-primary rounded-md w-full h-full";

    if (isMarkdownFile) {
      if (renderMarkdown && markdownContent) {
        return <div className="prose prose-sm sm:prose-base lg:prose-lg prose-invert prose-neutral max-w-none p-4 sm:p-6 bg-surface-elevated rounded-md w-full h-full overflow-y-auto">{markdownContent}</div>;
      }
    }

    if (isTextBased && rawFileContent) {
      return (
        <SyntaxHighlighter theme={syntaxThemeForRawView} code={isMarkdownFile ? (rawFileContent || "") : rawFileContent} language={isMarkdownFile ? ("markdown" as Language) : language}>
          {({ className, style, tokens, getLineProps, getTokenProps }: SyntaxHighlightRenderProps) => (
            <pre className={`${className} ${preClasses}`} style={{ ...style, backgroundColor: syntaxThemeForRawView.plain.backgroundColor || "#282c34" }}>
              {tokens.map((line, i) => {
                const { key: lineKey, ...lineRestProps } = getLineProps({ line, key: i });
                return (
                  <div key={lineKey as React.Key} {...lineRestProps}>
                    {line.map((token, k) => {
                      const { key: tokenKey, ...tokenRestProps } = getTokenProps({ token, key: k });
                      return <span key={tokenKey as React.Key} {...tokenRestProps} />;
                    })}
                  </div>
                );
              })}
            </pre>
          )}
        </SyntaxHighlighter>
      );
    }

    if (mimetype?.startsWith("image/")) {
      return <img src={fileUrl} alt={name} className="max-w-full max-h-full object-contain rounded-md" />;
    }
    if (mimetype?.startsWith("video/")) {
      return <video controls className="max-w-full max-h-full mx-auto rounded-md" src={fileUrl}>Your browser does not support the video tag.</video>;
    }
    if (mimetype?.startsWith("audio/")) {
      return <audio controls className="w-full max-w-lg mx-auto mt-4" src={fileUrl}>Your browser does not support the audio element.</audio>;
    }
    if (extension && BROWSER_PREVIEWABLE_EXTENSIONS.has(extension.toLowerCase())) {
      return <iframe src={fileUrl} title={name} className="w-full aspect-[8.5/11] border-none rounded-md" />;
    }
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-[var(--text-secondary)]">This file type ({extension}) cannot be previewed.</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">MIME: {mimetype}</p>
        <a href={fileUrl} download={name} className="mt-4 inline-block px-5 py-2 text-sm rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors">
          Download {name}
        </a>
      </div>
    );
  };

  return (
    <>
      <NextSeo {...seoConfig} />
      <Head><title>{name}</title></Head>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex flex-col items-center w-full px-3 sm:px-4 py-6 sm:py-8">
          <div className="w-full max-w-5xl">
            <div className="mb-4 p-4 rounded-md bg-surface-elevated border border-[var(--border-subtle)]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                <h1 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] break-all min-w-0" title={name}>
                  {name}
                </h1>
                {isMarkdownFile && (
                  <button
                    onClick={() => setRenderMarkdown(!renderMarkdown)}
                    className="text-xs px-3 py-1.5 rounded-md bg-surface-hover text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
                  >
                    {renderMarkdown ? "View Raw" : "Render Markdown"}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)] mb-3">
                <span>ID: <span className="font-mono text-[var(--text-secondary)]">{id}</span></span>
                <span>Size: <span className="text-[var(--text-secondary)]">{size ? filesize(size) : "N/A"}</span></span>
                <span>Type: <span className="text-[var(--text-secondary)]">{mimetype}</span></span>
                <span>Owner: <span className="text-[var(--text-secondary)]">{owner}</span></span>
                {isExpiring && (
                  <span>Expires: <button className="text-[var(--text-secondary)] hover:underline" onClick={() => setShowRelativeTime(p => !p)}>
                    {showRelativeTime ? formatTimeRemaining(fileData.expiresAt ?? "") : new Date(fileData.expiresAt ?? 0).toLocaleString()}
                  </button></span>
                )}
                {isPrivate && <span className="text-yellow-400/80 font-medium">Private</span>}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--border-subtle)]">
                {isTextBased && rawFileContent && (
                  <Link href={`/${id}?raw=true`} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs rounded-md bg-surface-hover text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    Raw
                  </Link>
                )}
                <Link href={fileUrl} download={name}
                  className="px-3 py-1.5 text-xs rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors flex items-center gap-1.5">
                  <Download className="w-3 h-3" /> Download
                </Link>
                {isAuthenticated && isOwner && fileData.fileType === 'paste' && (
                  <Link href={`/edit-paste/${id}`}
                    className="px-3 py-1.5 text-xs rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors flex items-center gap-1.5">
                    <Edit3 className="w-3 h-3" /> Edit
                  </Link>
                )}
                {isAuthenticated && isOwner && (
                  <>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className={`px-3 py-1.5 text-xs rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors flex items-center gap-1.5 ${isDeleting ? "opacity-50" : ""}`}
                    >
                      {isDeleting ? <LoaderCircle className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      Delete
                    </button>
                    <div className="ml-auto">
                      <Toggle
                        id="privacyToggle"
                        checked={isPrivate}
                        onChange={handlePrivacyChange}
                        label="Private"
                      />
                    </div>
                    {isExpiring && (
                      <button
                        onClick={handleRemoveExpiry}
                        disabled={isRemovingExpiry}
                        className={`px-3 py-1.5 text-xs rounded-md bg-surface-hover text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors ${isRemovingExpiry ? "opacity-50" : ""}`}
                      >
                        {isRemovingExpiry ? <LoaderCircle className="w-3 h-3 animate-spin mr-1 inline" /> : ""}
                        Remove Expiry
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="rounded-md bg-surface-elevated border border-[var(--border-subtle)] overflow-hidden">
              <div className={`bg-surface-primary ${isMarkdownFile || (isTextBased && rawFileContent) || (extension && BROWSER_PREVIEWABLE_EXTENSIONS.has(extension.toLowerCase())) ? "" : "flex justify-center items-center p-4 min-h-[300px]"}`}>
                {isMarkdownFile || (isTextBased && rawFileContent) ? (
                  renderFileContent()
                ) : (
                  <div className="w-full h-full flex justify-center items-center">
                    {renderFileContent()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { params, req, res, query, resolvedUrl } = context;
  const session = await getSession({ req });
  const reqId = params?.id as string;
  const pageBaseUrl = getBase(req);

  if (!reqId) return { notFound: true };

  let resolvedId = reqId;

  try {
    const pasteTagCheckResponse = await fetch(`${pageBaseUrl}/api/pastes/tags/${reqId}`);
    if (pasteTagCheckResponse.ok) {
      const targetData = await pasteTagCheckResponse.json();
      if (targetData?.pasteTag?.pasteId) resolvedId = targetData.pasteTag.pasteId;
    }

    if (reqId === resolvedId && !reqId.includes('.')) {
      const shortUrlCheckResponse = await fetch(`${pageBaseUrl}/api/links/${reqId}`);
      if (shortUrlCheckResponse.ok) {
        const targetData = await shortUrlCheckResponse.json();
        if (targetData?.link?.url) return { redirect: { destination: targetData.link.url, permanent: false } };
      }
    }
  } catch (e) {
    console.warn(`Tag/Link check failed for ${reqId}:`, e);
  }

  const fileInfoReqHeaders: HeadersInit = { getInfo: "true" };
  if (session?.user.token) fileInfoReqHeaders["Authorization"] = session.user.token;

  const fileInfoResponse = await fetch(`${pageBaseUrl}/api/files/${resolvedId}`, { headers: fileInfoReqHeaders });

  if (!fileInfoResponse.ok) {
    if (fileInfoResponse.status === 401 || fileInfoResponse.status === 403) {
      if (!session) {
        const callbackUrl = encodeURIComponent(resolvedUrl || `/${reqId}`);
        return { redirect: { destination: `/login?cbU=${callbackUrl}`, permanent: false } };
      }
      return { props: { error: "Access Denied.", fileData: null, rawFileContent: null, isAuthenticated: !!session, isOwner: false, fileUrl: "", baseUrl: pageBaseUrl } };
    }
    return { notFound: true };
  }

  type RawApiFileData = {
    id: string; fileName: string; publicFileName?: string; extension?: string;
    size: number; owner: string; isPrivate: boolean; expiresAt?: Date;
    fileType?: 'file' | 'paste'; ownerEmbedPreference?: boolean; ownerCustomDescription?: string | null;
  };
  const rawApiFileData: RawApiFileData = await fileInfoResponse.json();

  if (!rawApiFileData?.id || !rawApiFileData.fileName || typeof rawApiFileData.size !== "number") {
    return { props: { error: "Invalid API data.", fileData: null, rawFileContent: null, isAuthenticated: !!session, isOwner: false, fileUrl: "", baseUrl: pageBaseUrl } };
  }

  const extToMime: { [key: string]: string } = {
    txt: "text/plain", log: "text/plain", env: "text/plain", cfg: "text/plain", conf: "text/plain",
    md: "text/markdown", markdown: "text/markdown",
    js: "text/javascript", mjs: "text/javascript", cjs: "text/javascript",
    ts: "text/typescript", tsx: "text/typescript", mts: "text/typescript",
    jsx: "text/jsx",
    html: "text/html", htm: "text/html",
    css: "text/css", scss: "text/x-scss", less: "text/x-less",
    json: "application/json", jsonc: "application/json",
    py: "text/x-python", pyw: "text/x-python", pyi: "text/x-python",
    java: "text/x-java",
    c: "text/x-c", h: "text/x-c", cpp: "text/x-c++", cc: "text/x-c++", hpp: "text/x-c++",
    cs: "text/x-csharp",
    go: "text/x-go",
    rb: "text/x-ruby",
    php: "text/x-php",
    swift: "text/x-swift",
    sh: "text/x-sh", bash: "text/x-sh", zsh: "text/x-sh",
    yaml: "text/yaml", yml: "text/yaml",
    lua: "text/x-lua",
    pl: "text/x-perl",
    sql: "text/x-sql",
    rs: "text/x-rust",
    kt: "text/x-kotlin",
    xml: "text/xml", svg: "image/svg+xml",
    ini: "text/x-ini", toml: "text/x-toml",
    bat: "text/x-bat", cmd: "text/x-bat",
    ps1: "text/x-powershell",
    r: "text/x-r",
    dart: "text/x-dart",
    hs: "text/x-haskell",
    erl: "text/x-erlang",
    ex: "text/x-elixir",
    clj: "text/x-clojure",
    scala: "text/x-scala",
    groovy: "text/x-groovy",
    vim: "text/x-vim",
    dockerfile: "text/x-dockerfile",
    makefile: "text/x-makefile",
    mp4: "video/mp4", webm: "video/webm", mkv: "video/x-matroska",
    mp3: "audio/mpeg", ogg: "audio/ogg", wav: "audio/wav", flac: "audio/flac",
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp",
    pdf: "application/pdf",
    zip: "application/zip", tar: "application/x-tar", gz: "application/gzip",
  };
  const ext = rawApiFileData.extension?.toLowerCase() || "";
  const derivedMimetype = extToMime[ext] || mime.lookup(rawApiFileData.fileName) || "application/octet-stream";

  const fileData: FileData = {
    id: rawApiFileData.id,
    name: rawApiFileData.publicFileName ? rawApiFileData.publicFileName : rawApiFileData.extension ? `${rawApiFileData.id}.${rawApiFileData.extension}` : rawApiFileData.id,
    extension: rawApiFileData.extension || null,
    mimetype: derivedMimetype,
    size: rawApiFileData.size,
    owner: rawApiFileData.owner,
    isPrivate: rawApiFileData.isPrivate,
    expiresAt: rawApiFileData.expiresAt ? new Date(rawApiFileData.expiresAt).toISOString() : null,
    fileType: rawApiFileData.fileType,
    ownerEmbedPreference: rawApiFileData.ownerEmbedPreference === undefined ? false : rawApiFileData.ownerEmbedPreference,
    ownerCustomDescription: rawApiFileData.ownerCustomDescription ?? null,
  };

  const { raw, r, download, d } = query;
  if (raw || r || download || d) {
    const rawFileAuthHeaders: HeadersInit = {};
    if (session?.user.token) rawFileAuthHeaders["Authorization"] = session.user.token;
    const rawFileResponse = await fetch(`${pageBaseUrl}/api/files/${fileData.id}`, { headers: rawFileAuthHeaders });
    if (!rawFileResponse.ok || !rawFileResponse.body) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found.");
      return { props: {} };
    }
    res.writeHead(200, {
      "Content-Type": fileData.mimetype,
      "Content-Disposition": `${download || d ? "attachment" : "inline"}; filename="${fileData.name}"`,
    });
    try {
      for await (const chunk of rawFileResponse.body as unknown as AsyncIterable<Uint8Array>) { res.write(chunk); }
      res.end();
    } catch (streamError) {
      console.error("Stream error:", streamError);
      if (!res.writableEnded) res.end();
    }
    return { props: {} };
  }

  let rawFileContent: string | null = null;
  if (fileData.extension && TEXT_BASED_EXTENSIONS.has(fileData.extension.toLowerCase())) {
    const textContentAuthHeaders: HeadersInit = {};
    if (session?.user.token) textContentAuthHeaders["Authorization"] = session.user.token;
    const fileContentResponse = await fetch(`${pageBaseUrl}/api/files/${fileData.id}`, { headers: textContentAuthHeaders });
    if (fileContentResponse.ok) rawFileContent = await fileContentResponse.text();
    else console.warn(`Could not fetch content for ${fileData.id}. Status: ${fileContentResponse.status}`);
  }

  if (fileData.isPrivate && !session) {
    const callbackUrl = encodeURIComponent(resolvedUrl || `/${fileData.id}`);
    return { redirect: { destination: `/login?cbU=${callbackUrl}`, permanent: false } };
  }

  return {
    props: {
      fileData, rawFileContent,
      isAuthenticated: !!session,
      isOwner: !!session && session?.user.username === fileData.owner,
      fileUrl: `${pageBaseUrl}/api/files/${fileData.id}`,
      baseUrl: pageBaseUrl,
      error: null,
    },
  };
}
