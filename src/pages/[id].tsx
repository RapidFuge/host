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
import { LoaderCircle, Download, Trash2 } from "lucide-react";
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
  const langMap: { [key: string]: string } = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    py: "python",
    md: "markdown",
    html: "markup",
    css: "css",
    json: "json",
    java: "java",
    c: "c",
    cpp: "cpp",
    cs: "csharp",
    go: "go",
    rb: "ruby",
    php: "php",
    swift: "swift",
    sh: "bash",
    yaml: "yaml",
    yml: "yaml",
    lua: "lua",
    pl: "perl",
  };
  return (langMap[extension?.toLowerCase() || ""] || "clike") as Language;
};

const TEXT_BASED_EXTENSIONS = new Set([
  "txt",
  "md",
  "markdown",
  "js",
  "ts",
  "jsx",
  "tsx",
  "json",
  "html",
  "css",
  "xml",
  "svg",
  "py",
  "java",
  "c",
  "cpp",
  "h",
  "cs",
  "go",
  "rb",
  "php",
  "swift",
  "sh",
  "yaml",
  "yml",
  "ini",
  "cfg",
  "toml",
  "lua",
  "pl",
  "sql",
  "ejs",
  "bat",
  "vb",
  "haml",
  "hs",
  "ex",
  "desktop"
]);

const markdownComponents = {
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const { href, children, ...rest } = props;
    if (href && (href.startsWith("/") || href.startsWith("#"))) {
      return (
        <Link href={href} {...rest} className="text-blue-400 hover:underline">
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...rest}
        className="text-blue-400 hover:underline"
      >
        {children}
      </a>
    );
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
  const [markdownContent, setMarkdownContent] =
    useState<React.ReactElement | null>(null);
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
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkRehype, { allowDangerousHtml: true })
            .use(rehypeRaw)
            .use(rehypeSlug)
            .use(rehypePrismPlus, {
              ignoreMissing: true,
              showLineNumbers: false,
            })
            .use(rehypeReact, {
              createElement: React.createElement,
              Fragment: React.Fragment,
              components: markdownComponents,
              jsx: jsx,
              jsxs: jsxs,
            });
          const file = await processor.process(rawFileContent);
          setMarkdownContent(file.result as React.ReactElement);
        } catch (e) {
          console.error("Error processing Markdown:", e);
          setMarkdownContent(
            React.createElement("p", null, "Error rendering Markdown.")
          );
        }
      })();
    }
  }, [fileData, rawFileContent]);

  let seoConfig = {};
  if (error) {
    seoConfig = {
      title: "Error - RapidHost",
      description: error,
      noindex: true,
      nofollow: true,
    };
  } else if (!fileData) {
    seoConfig = {
      title: "File Not Found - RapidHost",
      description: "The requested file could not be found.",
      noindex: true,
      nofollow: true,
    };
  } else {
    const {
      id,
      name,
      mimetype,
      size,
      owner,
      isPrivate,
      ownerEmbedPreference,
      ownerCustomDescription,
    } = fileData;
    const isImage = mimetype?.startsWith("image/");
    const isVideo = mimetype?.startsWith("video/");
    const pageFullUrl = `${baseUrl}/${id}`;

    if (isImage && ownerEmbedPreference) {
      seoConfig = {
        // title: name,
        noindex: isPrivate,
        nofollow: isPrivate,
        canonical: pageFullUrl,
        openGraph: {
          type: "image.png",
          // url: pageFullUrl,
          // title: name,
          images: [
            {
              url: fileUrl,
              type: mimetype,
            },
          ],
        },
        twitter: {
          cardType: "summary_large_image",
        },
      };
    } else if (isVideo && ownerEmbedPreference) {
      seoConfig = {
        noindex: isPrivate,
        nofollow: isPrivate,
        canonical: pageFullUrl,
        openGraph: {
          type: "video.other",
          // url: pageFullUrl,
          // title: name,
          videos: [
            {
              url: fileUrl,
              type: mimetype,
            },
          ],
        },
        twitter: {
          cardType: "summary_large_image",
        },
      };
    } else {
      let finalEmbedDescription = `Size: ${size ? filesize(size) : "N/A"
        } | Type: ${mimetype}${owner ? ` | Uploaded by: ${owner}` : ""}`;
      if (ownerCustomDescription && ownerCustomDescription.trim() !== "") {
        finalEmbedDescription = ownerCustomDescription;
      }

      seoConfig = {
        title: name,
        description: finalEmbedDescription,
        canonical: pageFullUrl,
        noindex: isPrivate,
        nofollow: isPrivate,
        openGraph: {
          url: pageFullUrl,
          type: isVideo ? "video.other" : "article",
          title: name || "View File",
          description: finalEmbedDescription,
          ...(isImage && {
            images: [
              {
                url: fileUrl,
                type: mimetype,
              },
            ],
          }),
          ...(isVideo && {
            videos: [
              {
                url: fileUrl,
                type: mimetype,
              },
            ],
          }),
        },
        twitter: {
          cardType: isImage || isVideo ? "summary_large_image" : "summary",
        },
      };
    }
  }

  if (error) {
    return (
      <>
        {" "}
        <NextSeo {...seoConfig} /> <Header />{" "}
        <div className="flex flex-col flex-grow bg-black text-zinc-100 items-center justify-center p-4">
          {" "}
          <h1 className="text-2xl text-red-400">Error</h1>{" "}
          <p className="text-zinc-300 mt-2">{error}</p>{" "}
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-neutral-700 text-white rounded hover:bg-neutral-600 transition-colors"
          >
            Go Back
          </button>{" "}
        </div>{" "}
        <Footer />{" "}
      </>
    );
  }
  if (!fileData) {
    return (
      <>
        {" "}
        <NextSeo title="File Not Found" noindex nofollow /> <Header />{" "}
        <div className="flex flex-col flex-grow bg-black text-zinc-100 items-center justify-center">
          File data is missing.
        </div>{" "}
        <Footer />{" "}
      </>
    );
  }

  const { id, name, extension, mimetype, size, owner } = fileData;
  const language = getLanguage(extension);
  const isMarkdownFile =
    extension?.toLowerCase() === "md" ||
    extension?.toLowerCase() === "markdown";
  const isTextBased = extension
    ? TEXT_BASED_EXTENSIONS.has(extension.toLowerCase())
    : false;
  const syntaxThemeForRawView = themes.oneDark;

  const handleDelete = async () => {
    if (isOwner) {
      if (confirm("Delete this file? This cannot be undone.")) {
        setIsDeleting(true);
        try {
          const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
          if (!res.ok) {
            const errData = await res
              .json()
              .catch(() => ({ message: "Delete failed." }));
            throw new Error(errData.message);
          }
          // alert("File deleted.");
          router.push("/dashboard");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          alert(`Delete failed: ${err.message}`);
        } finally {
          setIsDeleting(false);
        }
      }
    }
  };

  const handleRemoveExpiry = async () => {
    if (isOwner) {
      if (isRemovingExpiry) return;
      if (confirm("Delete remove expiry? This cannot be undone.")) {
        setIsRemovingPrivacy(true);

        try {
          const res = await fetch(`/api/files/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ removeExpiry: true }),
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({ message: "Failed to update expiration." }));
            throw new Error(errData.message);
          }
          setIsExpiring(false);
          alert(`Successfully removed file expiry!`);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          alert(`Delete failed: ${err.message}`);
        } finally {
          setIsRemovingPrivacy(false);
        }
      }
    }
  }

  const handlePrivacyChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (isOwner) {
      const newIsPrivate = e.target.checked;
      if (isUpdatingPrivacy) return;

      setIsUpdatingPrivacy(true);
      setIsPrivate(newIsPrivate);

      try {
        const res = await fetch(`/api/files/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPrivate: newIsPrivate }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ message: "Failed to update privacy." }));
          throw new Error(errData.message);
        }

        alert(`Successfully set file to ${newIsPrivate ? "private" : "public"}!`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setIsPrivate(!newIsPrivate);
        alert(`Failed to update privacy: ${err.message}`);
      } finally {
        setIsUpdatingPrivacy(false);
      }
    }
  };

  const renderFileContent = () => {
    const commonPreStyles =
      "p-4 overflow-auto text-sm bg-neutral-900 rounded w-full h-full";
    const markdownDisplayStyles =
      "prose prose-sm sm:prose-base lg:prose-lg prose-invert prose-neutral max-w-none p-4 sm:p-6 bg-neutral-800 rounded w-full h-full overflow-y-auto";

    if (isMarkdownFile) {
      if (renderMarkdown && markdownContent) {
        return <div className={markdownDisplayStyles}>{markdownContent}</div>;
      } else {
        return (
          <SyntaxHighlighter
            theme={syntaxThemeForRawView}
            code={rawFileContent || ""}
            language={"markdown" as Language}
          >
            {({
              className,
              style,
              tokens,
              getLineProps,
              getTokenProps,
            }: SyntaxHighlightRenderProps) => (
              <pre
                className={`${className} ${commonPreStyles}`}
                style={{
                  ...style,
                  backgroundColor:
                    syntaxThemeForRawView.plain.backgroundColor || "#282c34",
                }}
              >
                {tokens.map((line, i) => {
                  const { key: lineKey, ...lineRestProps } = getLineProps({
                    line,
                    key: i,
                  });
                  return (
                    <div key={lineKey as React.Key} {...lineRestProps}>
                      {" "}
                      {line.map((token, k) => {
                        const { key: tokenKey, ...tokenRestProps } =
                          getTokenProps({ token, key: k });
                        return (
                          <span
                            key={tokenKey as React.Key}
                            {...tokenRestProps}
                          />
                        );
                      })}{" "}
                    </div>
                  );
                })}
              </pre>
            )}
          </SyntaxHighlighter>
        );
      }
    } else if (isTextBased && rawFileContent) {
      return (
        <SyntaxHighlighter
          theme={syntaxThemeForRawView}
          code={rawFileContent}
          language={language}
        >
          {({
            className,
            style,
            tokens,
            getLineProps,
            getTokenProps,
          }: SyntaxHighlightRenderProps) => (
            <pre
              className={`${className} ${commonPreStyles}`}
              style={{
                ...style,
                backgroundColor:
                  syntaxThemeForRawView.plain.backgroundColor || "#282c34",
              }}
            >
              {tokens.map((line, i) => {
                const { key: lineKey, ...lineRestProps } = getLineProps({
                  line,
                  key: i,
                });
                return (
                  <div key={lineKey as React.Key} {...lineRestProps}>
                    {" "}
                    {line.map((token, k) => {
                      const { key: tokenKey, ...tokenRestProps } =
                        getTokenProps({ token, key: k });
                      return (
                        <span key={tokenKey as React.Key} {...tokenRestProps} />
                      );
                    })}{" "}
                  </div>
                );
              })}
            </pre>
          )}
        </SyntaxHighlighter>
      );
    } else if (mimetype?.startsWith("image/")) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fileUrl}
          alt={name}
          className="max-w-full max-h-full object-contain rounded"
        />
      );
    } else if (mimetype?.startsWith("video/")) {
      return (
        <video
          controls
          className="max-w-full max-h-full mx-auto rounded"
          src={fileUrl}
        >
          Your browser does not support the video tag.
        </video>
      );
    } else if (mimetype?.startsWith("audio/")) {
      return (
        <audio controls className="w-full max-w-lg mx-auto mt-4" src={fileUrl}>
          Your browser does not support the audio element.
        </audio>
      );
    } else {
      return (
        <div className="p-6 bg-neutral-800 rounded text-center">
          {" "}
          <p className="text-lg text-zinc-200">
            This file type ({extension}) cannot be previewed.
          </p>{" "}
          <p className="text-sm text-zinc-400 mt-1">MIME Type: {mimetype}</p>{" "}
          <a
            href={fileUrl}
            download={name}
            className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Download {name}
          </a>{" "}
        </div>
      );
    }
  };

  const headerHeightPx = 64;
  const mainContentPaddingTop = `pt-[${headerHeightPx}px]`;
  const topBarApproxHeightPx = 100;

  return (
    <>
      <NextSeo {...seoConfig} />
      <Head>
        <title>{name}</title>
      </Head>
      <div className="flex flex-col min-h-screen bg-black text-zinc-100">
        <Header />
        <main
          className={`flex-grow flex flex-col items-center w-full px-2 py-6 sm:px-4 sm:py-8 ${mainContentPaddingTop}`}
        >
          <div className="w-full max-w-5xl">
            <div className="mb-4 p-3 sm:p-4 bg-neutral-800 rounded-md shadow-md">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                <h1
                  className="text-xl sm:text-2xl lg:text-3xl font-bold truncate mr-4 text-white"
                  title={name}
                >
                  {name}
                </h1>
                {isMarkdownFile && (
                  <button
                    onClick={() => setRenderMarkdown(!renderMarkdown)}
                    className="mt-2 sm:mt-0 px-3 py-1.5 text-xs sm:text-sm bg-neutral-700 hover:bg-neutral-600 text-zinc-200 rounded transition-colors flex-shrink-0"
                  >
                    {renderMarkdown ? "View Raw Markdown" : "Render Markdown"}
                  </button>
                )}
              </div>
              <div className="text-xs sm:text-sm text-zinc-400 mb-3">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    ID:{" "}
                    <span className="font-mono text-zinc-300 select-all">
                      {id}
                    </span>
                  </span>
                  <span>
                    Size:{" "}
                    <span className="text-zinc-300">
                      {size ? filesize(size) : "N/A"}
                    </span>
                  </span>
                  <span>
                    Type: <span className="text-zinc-300">{mimetype}</span>
                  </span>
                  <span>
                    Owner: <span className="text-zinc-300">{owner}</span>
                  </span>
                  {isExpiring && (
                    <span>
                      Expires:{" "}
                      <span className="text-zinc-300">
                        <button className="hover:underline focus:outline-none" onClick={() => setShowRelativeTime(p => !p)}>
                          {showRelativeTime
                            ? formatTimeRemaining(fileData.expiresAt ?? "")
                            : new Date(fileData.expiresAt ?? 0).toLocaleString()
                          }
                        </button>
                      </span>
                    </span>
                  )}
                  {isPrivate && (
                    <span className="text-yellow-400 font-semibold">
                      (Private File)
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm border-t border-neutral-700 pt-3 mt-3">
                {isTextBased && rawFileContent && (
                  <Link
                    href={`/${id}?raw=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    title="View Raw File"
                  >
                    Raw
                  </Link>
                )}
                <Link
                  href={fileUrl}
                  download={name}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center"
                  title="Download File"
                >
                  <Download
                    className="mr-2 w-3 h-3"
                  />{" "}
                  Download
                </Link>
                {isAuthenticated && isOwner && (
                  <>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className={`px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}`}
                      title="Delete File"
                    >
                      {isDeleting ? (
                        <>
                          <LoaderCircle
                            className="animate-spin mr-2 w-4 h-4"
                          />{" "}
                          Deleting
                        </>
                      ) : (
                        <>
                          <Trash2
                            className="mr-2 w-3 h-3"
                          />{" "}
                          Delete
                        </>
                      )}
                    </button>

                    <label htmlFor="privacyToggle" className="flex items-center cursor-pointer relative ml-auto" title="Toggle file privacy">
                      <input type="checkbox" id="privacyToggle" className="sr-only peer" checked={isPrivate} onChange={handlePrivacyChange} disabled={isUpdatingPrivacy} />
                      <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ml-2 text-sm font-medium text-zinc-300">
                        Private
                      </span>
                    </label>

                    {isExpiring && (
                      <button
                        onClick={handleRemoveExpiry}
                        disabled={isRemovingExpiry}
                        className={`px-3 py-1.5 bg-neutral-700 text-white rounded hover:bg-neutral-600 transition-colors flex ${isRemovingExpiry ? "opacity-50 cursor-not-allowed" : ""}`}
                        title="Remove Expiry"
                      >
                        {isRemovingExpiry ? (
                          <>
                            <LoaderCircle
                              className="animate-spin mr-2 w-4 h-4"
                            />{" "}
                            Removing Expiry
                          </>
                        ) : (
                          "Remove Expiry"
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="bg-neutral-800 rounded-lg shadow-xl overflow-hidden">
              <div
                className={`min-h-[300px] max-h-[calc(100vh-${headerHeightPx}px-${topBarApproxHeightPx}px-70px)] sm:max-h-[calc(100vh-${headerHeightPx}px-${topBarApproxHeightPx}px-80px)] bg-neutral-900 ${isMarkdownFile || (isTextBased && rawFileContent)
                  ? ""
                  : "flex justify-center items-center p-1 sm:p-2"
                  }`}
              >
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

  if (!reqId) {
    return { notFound: true };
  }

  try {
    const shortUrlCheckResponse = await fetch(
      `${pageBaseUrl}/api/url/${reqId}`
    );
    if (shortUrlCheckResponse.ok) {
      const targetData = await shortUrlCheckResponse.json();
      if (targetData?.link?.url) {
        return {
          redirect: { destination: targetData.link.url, permanent: false },
        };
      }
    }
  } catch (e) {
    console.warn(`Short URL check failed for ${reqId}:`, e);
  }

  const fileInfoReqHeaders: HeadersInit = { getInfo: "true" };
  if (session?.user.token) {
    fileInfoReqHeaders["Authorization"] = session.user.token;
  }

  const fileInfoResponse = await fetch(`${pageBaseUrl}/api/files/${reqId}`, {
    headers: fileInfoReqHeaders,
  });

  if (!fileInfoResponse.ok) {
    if (fileInfoResponse.status === 401 || fileInfoResponse.status === 403) {
      if (!session) {
        const callbackUrl = encodeURIComponent(resolvedUrl || `/${reqId}`);
        return {
          redirect: {
            destination: `/login?cbU=${callbackUrl}`,
            permanent: false,
          },
        };
      }
      const errorMsg = "Access Denied.";
      return {
        props: {
          error: errorMsg,
          fileData: null,
          rawFileContent: null,
          isAuthenticated: !!session,
          isOwner: false,
          fileUrl: "",
          baseUrl: pageBaseUrl,
        },
      };
    }
    return { notFound: true };
  }

  type RawApiFileData = {
    id: string;
    fileName: string;
    publicFileName?: string;
    extension?: string;
    size: number;
    owner: string;
    isPrivate: boolean;
    expiresAt?: Date;
    ownerEmbedPreference?: boolean;
    ownerCustomDescription?: string | null;
  };
  const rawApiFileData: RawApiFileData = await fileInfoResponse.json();

  if (
    !rawApiFileData?.id ||
    !rawApiFileData.fileName ||
    typeof rawApiFileData.size !== "number"
  ) {
    const errorMsg = "Invalid API data.";
    return {
      props: {
        error: errorMsg,
        fileData: null,
        rawFileContent: null,
        isAuthenticated: !!session,
        isOwner: false,
        fileUrl: "",
        baseUrl: pageBaseUrl,
      },
    };
  }

  let derivedMimetype;
  if (rawApiFileData.extension === "ts" || rawApiFileData.extension === "tsx")
    derivedMimetype = "text/typescript";
  else if (rawApiFileData.extension === "mp4") derivedMimetype = "video/mp4";
  else if (rawApiFileData.extension === "desktop") derivedMimetype = "text/plain";
  else if (rawApiFileData.extension === "md") derivedMimetype = "text/markdown";
  else
    derivedMimetype =
      mime.lookup(rawApiFileData.fileName) || "application/octet-stream";

  const fileData: FileData = {
    id: rawApiFileData.id,
    name: rawApiFileData.publicFileName ? rawApiFileData.publicFileName : rawApiFileData.extension
      ? `${rawApiFileData.id}.${rawApiFileData.extension}`
      : rawApiFileData.id,
    extension: rawApiFileData.extension || null,
    mimetype: derivedMimetype,
    size: rawApiFileData.size,
    owner: rawApiFileData.owner,
    isPrivate: rawApiFileData.isPrivate,
    expiresAt: rawApiFileData.expiresAt ? new Date(rawApiFileData.expiresAt).toISOString() : null,
    ownerEmbedPreference:
      rawApiFileData.ownerEmbedPreference === undefined
        ? false
        : rawApiFileData.ownerEmbedPreference,
    ownerCustomDescription: rawApiFileData.ownerCustomDescription,
  };

  const { raw, r, download, d } = query;
  if (raw || r || download || d) {
    const rawFileAuthHeaders: HeadersInit = {};
    if (session?.user.token) {
      rawFileAuthHeaders["Authorization"] = session.user.token;
    }
    const rawFileResponse = await fetch(
      `${pageBaseUrl}/api/files/${fileData.id}`,
      { headers: rawFileAuthHeaders }
    );
    if (!rawFileResponse.ok || !rawFileResponse.body) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found.");
      return { props: {} };
    }
    res.writeHead(200, {
      "Content-Type": fileData.mimetype,
      "Content-Disposition": `${download || d ? "attachment" : "inline"
        }; filename="${fileData.name}"`,
    });
    try {
      for await (const chunk of rawFileResponse.body as unknown as AsyncIterable<Uint8Array>) {
        res.write(chunk);
      }
      res.end();
    } catch (streamError) {
      console.error("Stream error:", streamError);
      if (!res.writableEnded) {
        res.end();
      }
    }
    return { props: {} };
  }

  let rawFileContent: string | null = null;
  if (
    fileData.extension &&
    TEXT_BASED_EXTENSIONS.has(fileData.extension.toLowerCase())
  ) {
    const textContentAuthHeaders: HeadersInit = {};
    if (session?.user.token) {
      textContentAuthHeaders["Authorization"] = session.user.token;
    }
    const fileContentResponse = await fetch(
      `${pageBaseUrl}/api/files/${fileData.id}`,
      { headers: textContentAuthHeaders }
    );
    if (fileContentResponse.ok) {
      rawFileContent = await fileContentResponse.text();
    } else {
      console.warn(
        `Could not fetch content for ${fileData.id}. Status: ${fileContentResponse.status}`
      );
    }
  }

  if (fileData.isPrivate && !session) {
    const callbackUrl = encodeURIComponent(resolvedUrl || `/${fileData.id}`);
    return {
      redirect: { destination: `/login?cbU=${callbackUrl}`, permanent: false },
    };
  }

  const isAuthenticated = !!session;
  const isOwner = isAuthenticated && session?.user.username === fileData.owner;

  return {
    props: {
      fileData,
      rawFileContent,
      isAuthenticated,
      isOwner,
      fileUrl: `${pageBaseUrl}/api/files/${fileData.id}`,
      baseUrl: pageBaseUrl,
      error: null,
    },
  };
}
