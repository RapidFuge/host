// pages/[id].tsx
import { GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import { useRouter } from "next/router";
import { NextSeo } from "next-seo";
import { useState, useEffect } from "react";
import { remark } from "remark";
import html from "remark-html";
import {
  Highlight,
  themes,
  Language,
  LineInputProps,
  TokenInputProps,
} from "prism-react-renderer";
import { filesize } from "filesize";
import mime from "mime-types";

import { getBase } from "@lib";
import Header from "@components/Header";
import Footer from "@components/Footer";

// ... (interfaces and getLanguage, TEXT_BASED_EXTENSIONS remain the same) ...
interface FileData {
  id: string;
  name: string;
  extension: string;
  mimetype: string;
  size: number;
  owner: string;
  isPrivate: boolean;
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

interface HighlightRenderProps {
  className: string;
  style: React.CSSProperties;
  tokens: Array<Array<{ content: string; types: string[] }>>;
  getLineProps: (input: LineInputProps) => Record<string, unknown>;
  getTokenProps: (input: TokenInputProps) => Record<string, unknown>;
}

const getLanguage = (extension: string): Language => {
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
]);

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
  const [processedMarkdownHtml, setProcessedMarkdownHtml] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (
      fileData?.extension?.toLowerCase() === "md" &&
      rawFileContent &&
      renderMarkdown
    ) {
      remark()
        .use(html)
        .process(rawFileContent)
        .then((file) => setProcessedMarkdownHtml(file.toString()))
        .catch(() =>
          setProcessedMarkdownHtml("<p>Error rendering Markdown.</p>")
        );
    }
  }, [fileData, rawFileContent, renderMarkdown]);

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
    const { id, name, mimetype, size, owner, isPrivate } = fileData;
    const isImage = mimetype?.startsWith("image/");
    const pageFullUrl = `${baseUrl}/${id}`;
    const embedDescription = `Size: ${
      size ? filesize(size) : "N/A"
    } | Type: ${mimetype}${owner ? ` | Uploaded by: ${owner}` : ""}`;
    seoConfig = {
      title: `${name || "View File"} - RapidHost`,
      description: `View file: ${name}. ${embedDescription}`,
      canonical: pageFullUrl,
      noindex: isPrivate,
      nofollow: isPrivate,
      openGraph: {
        url: pageFullUrl,
        site_name: "RapidHost",
        type: isImage ? "image.png" : "article",
        title: name || "View File",
        description: isImage ? name : embedDescription,
        images: isImage
          ? [{ url: fileUrl, alt: name, type: mimetype }]
          : undefined,
      },
      twitter: { cardType: isImage ? "summary_large_image" : "summary" },
    };
  }

  if (error) {
    return (
      <>
        <NextSeo {...seoConfig} /> <Header />
        <div className="flex flex-col flex-grow bg-black text-zinc-100 items-center justify-center p-4">
          <h1 className="text-2xl text-red-400">Error</h1>
          <p className="text-zinc-300 mt-2">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-neutral-700 text-white rounded hover:bg-neutral-600 transition-colors" // neutral
          >
            Go Back
          </button>
        </div>
        <Footer />
      </>
    );
  }
  if (!fileData) {
    return (
      <>
        <NextSeo {...seoConfig} /> <Header />
        <div className="flex flex-col flex-grow bg-black text-zinc-100 items-center justify-center">
          File not found or not accessible.
        </div>
        <Footer />
      </>
    );
  }

  const { id, name, extension, mimetype, size, isPrivate, owner } = fileData;
  const language = getLanguage(extension);
  const isMarkdown =
    extension?.toLowerCase() === "md" ||
    extension?.toLowerCase() === "markdown";
  const isTextBased = extension
    ? TEXT_BASED_EXTENSIONS.has(extension.toLowerCase())
    : false;
  const syntaxTheme = themes.vsDark; // Using oneDark theme

  const handleDelete = async () => {
    if (isOwner) {
      if (
        confirm(
          "Are you sure you want to delete this file? This action cannot be undone."
        )
      ) {
        try {
          const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
          if (!res.ok) {
            const errData = await res
              .json()
              .catch(() => ({ message: "Failed to delete file." }));
            throw new Error(errData.message);
          }
          alert("File deleted successfully.");
          router.push("/dashboard");
        } catch (err: any) {
          alert(`Failed to delete the file: ${err.message}`);
        }
      }
    }
  };

  const renderFileContent = () => {
    const commonPreStyles =
      "p-4 overflow-auto text-sm bg-neutral-900 rounded w-full h-full"; // neutral-900 for pre background
    const commonArticleStyles =
      "prose prose-sm sm:prose-base lg:prose-lg prose-invert max-w-none mx-auto p-4 bg-neutral-800 rounded w-full h-full overflow-y-auto"; // prose-invert with neutral-800

    if (isMarkdown) {
      if (renderMarkdown && processedMarkdownHtml) {
        return (
          <article
            className={commonArticleStyles}
            dangerouslySetInnerHTML={{ __html: processedMarkdownHtml }}
          />
        );
      } else {
        return (
          <Highlight
            theme={syntaxTheme}
            code={rawFileContent || ""}
            language={language}
          >
            {({
              className,
              style,
              tokens,
              getLineProps,
              getTokenProps,
            }: HighlightRenderProps) => (
              <pre
                className={`${className} ${commonPreStyles}`}
                style={{
                  ...style,
                  backgroundColor:
                    syntaxTheme.plain.backgroundColor || "#282c34",
                }}
              >
                {tokens.map((line, i) => {
                  const lineProps = getLineProps({ line, key: i });
                  return (
                    <div key={i} {...lineProps}>
                      {" "}
                      {line.map((token, key) => {
                        const tokenProps = getTokenProps({ token, key });
                        return <span key={key} {...tokenProps} />;
                      })}{" "}
                    </div>
                  );
                })}
              </pre>
            )}
          </Highlight>
        );
      }
    } else if (isTextBased && rawFileContent) {
      return (
        <Highlight
          theme={syntaxTheme}
          code={rawFileContent}
          language={language}
        >
          {({
            className,
            style,
            tokens,
            getLineProps,
            getTokenProps,
          }: HighlightRenderProps) => (
            <pre
              className={`${className} ${commonPreStyles}`}
              style={{
                ...style,
                backgroundColor: syntaxTheme.plain.backgroundColor || "#282c34",
              }}
            >
              {tokens.map((line, i) => {
                const lineProps = getLineProps({ line, key: i });
                return (
                  <div key={i} {...lineProps}>
                    {" "}
                    {line.map((token, key) => {
                      const tokenProps = getTokenProps({ token, key });
                      return <span key={key} {...tokenProps} />;
                    })}{" "}
                  </div>
                );
              })}
            </pre>
          )}
        </Highlight>
      );
    } else if (mimetype?.startsWith("image/")) {
      return (
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
          {/* neutral-800 */}
          <p className="text-lg text-zinc-200">
            This file type ({extension}) cannot be previewed directly.
          </p>
          <p className="text-sm text-zinc-400 mt-1">MIME Type: {mimetype}</p>
          {/* Colored download button for this fallback case */}
          <a
            href={fileUrl}
            download={name}
            className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Download {name}
          </a>
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
      <div className="flex flex-col min-h-screen bg-black text-zinc-100">
        <Header />
        <main
          className={`flex-grow flex flex-col items-center w-full px-2 py-6 sm:px-4 sm:py-8 ${mainContentPaddingTop}`}
        >
          <div className="w-full max-w-5xl">
            <div className="mb-4 p-3 sm:p-4 bg-neutral-800 rounded-md shadow-md">
              {" "}
              {/* neutral-800 */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                <h1
                  className="text-xl sm:text-2xl lg:text-3xl font-bold truncate mr-4 text-white"
                  title={name}
                >
                  {name}
                </h1>
                {isMarkdown && (
                  <button
                    onClick={() => setRenderMarkdown(!renderMarkdown)}
                    className="mt-2 sm:mt-0 px-3 py-1.5 text-xs sm:text-sm bg-neutral-700 hover:bg-neutral-600 text-zinc-200 rounded transition-colors flex-shrink-0" // neutral button
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
                  {isPrivate && (
                    <span className="text-yellow-400 font-semibold">
                      (Private File)
                    </span>
                  )}
                </div>
              </div>
              {/* Action Buttons with distinct colors */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm border-t border-neutral-700 pt-3 mt-3">
                {" "}
                {/* neutral border */}
                {isTextBased && rawFileContent && (
                  <a
                    href={`${fileUrl}?raw=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    title="View Raw File"
                  >
                    Raw
                  </a>
                )}
                <a
                  href={fileUrl}
                  download={name}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  title="Download File"
                >
                  Download
                </a>
                {isAuthenticated && isOwner && (
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    title="Delete File"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            <div className="bg-neutral-800 rounded-lg shadow-xl overflow-hidden">
              {" "}
              {/* neutral-800 */}
              <div
                className={`min-h-[300px] max-h-[calc(100vh-${headerHeightPx}px-${topBarApproxHeightPx}px-70px)] sm:max-h-[calc(100vh-${headerHeightPx}px-${topBarApproxHeightPx}px-80px)] bg-neutral-900 ${
                  // neutral-900
                  isMarkdown || (isTextBased && rawFileContent)
                    ? "overflow-y-auto"
                    : "flex justify-center items-center p-1 sm:p-2"
                }`}
              >
                {isMarkdown || (isTextBased && rawFileContent) ? (
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

// getServerSideProps remains the same
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
      const errorMsg =
        "Access Denied: You may not have permission to view this file.";
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
    extension: string;
    size: number;
    owner: string;
    isPrivate: boolean;
  };
  const rawApiFileData: RawApiFileData = await fileInfoResponse.json();

  if (
    !rawApiFileData?.id ||
    !rawApiFileData.fileName ||
    typeof rawApiFileData.size !== "number"
  ) {
    const errorMsg = "Invalid or incomplete file data received from API.";
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

  const derivedMimetype =
    mime.lookup(rawApiFileData.fileName) || "application/octet-stream";
  const fileData: FileData = {
    id: rawApiFileData.id,
    name: rawApiFileData.fileName,
    extension: rawApiFileData.extension,
    mimetype: derivedMimetype,
    size: rawApiFileData.size,
    owner: rawApiFileData.owner,
    isPrivate: rawApiFileData.isPrivate,
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
      res.end("File not found or unable to stream.");
      return { props: {} };
    }
    res.writeHead(200, {
      "Content-Type": fileData.mimetype,
      "Content-Disposition": `${
        download || d ? "attachment" : "inline"
      }; filename="${fileData.name}"`,
    });
    try {
      for await (const chunk of rawFileResponse.body as unknown as AsyncIterable<Uint8Array>) {
        res.write(chunk);
      }
      res.end();
    } catch (streamError) {
      console.error("Streaming error:", streamError);
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
        `Could not fetch text content for ${fileData.id} for preview. Status: ${fileContentResponse.status}`
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
