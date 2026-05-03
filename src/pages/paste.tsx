import React, { useState, ChangeEvent, useEffect } from "react";
import { GetServerSidePropsContext } from "next";
import { getSession, GetSessionParams } from "next-auth/react";
import { NextSeo } from "next-seo";
import { toast } from "sonner";
import { Language } from 'prism-react-renderer';

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeReact from "rehype-react";
import rehypePrismPlus from "rehype-prism-plus";
import { jsx, jsxs } from "react/jsx-runtime";

import Header from "@components/Header";
import Footer from "@components/Footer";
import Editor from "@components/Editor";
import { getBase } from "@lib";
import Link from "next/link";
import { Button, Input, Select, Toggle } from "@components/ui";

const languageOptions = [
  { value: 'plaintext', label: 'Plain Text' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'tsx', label: 'TypeScript React' },
  { value: 'jsx', label: 'JavaScript React' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'less', label: 'LESS' },
  { value: 'json', label: 'JSON' },
  { value: 'jsonc', label: 'JSON with Comments' },
  { value: 'shell', label: 'Shell' },
  { value: 'bash', label: 'Bash' },
  { value: 'sql', label: 'SQL' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'php', label: 'PHP' },
  { value: 'rust', label: 'Rust' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'lua', label: 'Lua' },
  { value: 'xml', label: 'XML' },
  { value: 'yaml', label: 'YAML' },
  { value: 'yml', label: 'YML' },
  { value: 'ini', label: 'INI' },
  { value: 'toml', label: 'TOML' },
  { value: 'batch', label: 'Batch' },
  { value: 'powershell', label: 'PowerShell' },
  { value: 'perl', label: 'Perl' },
  { value: 'r', label: 'R' },
  { value: 'dart', label: 'Dart' },
  { value: 'haskell', label: 'Haskell' },
  { value: 'erlang', label: 'Erlang' },
  { value: 'elixir', label: 'Elixir' },
  { value: 'clojure', label: 'Clojure' },
  { value: 'scala', label: 'Scala' },
  { value: 'groovy', label: 'Groovy' },
  { value: 'vim', label: 'Vim Script' },
  { value: 'dockerfile', label: 'Dockerfile' },
  { value: 'makefile', label: 'Makefile' },
  { value: 'gradle', label: 'Gradle' },
  { value: 'maven', label: 'Maven' },
];

const expirationOptions = [
  { value: "never", label: "Never" },
  { value: "1h", label: "1 Hour" },
  { value: "6h", label: "6 Hours" },
  { value: "1d", label: "1 Day" },
  { value: "1w", label: "1 Week" },
  { value: "30d", label: "1 Month" },
  { value: "90d", label: "3 Months" },
  { value: "1y", label: "1 Year" },
];

export default function PastePage({ defaultExpiration }: { defaultExpiration: string }) {
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [language, setLanguage] = useState('plaintext');
  const [isPrivate, setIsPrivate] = useState(false);
  const [expiration, setExpiration] = useState(defaultExpiration || "never");
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'write' | 'preview'>('write');
  const [renderedMarkdown, setRenderedMarkdown] = useState<React.ReactElement | null>(null);
  const [customTag, setCustomTag] = useState('');

  useEffect(() => {
    if (viewMode === 'preview' && language === 'markdown' && content) {
      (async () => {
        setRenderedMarkdown(null);
        try {
          const processor = unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkRehype, { allowDangerousHtml: true })
            .use(rehypeRaw)
            .use(rehypeSlug)
            .use(rehypePrismPlus, { ignoreMissing: true })
            .use(rehypeReact, {
              createElement: React.createElement,
              Fragment: React.Fragment,
              jsx: jsx,
              jsxs: jsxs,
            });
          const file = await processor.process(content);
          setRenderedMarkdown(file.result as React.ReactElement);
        } catch (e) {
          console.error("Error processing Markdown:", e);
          setRenderedMarkdown(<p className="text-red-400">Error rendering Markdown preview.</p>);
        }
      })();
    }
  }, [viewMode, content, language]);

  const handleUpload = async () => {
    if (!content.trim()) {
      toast.error("Content cannot be empty.");
      return;
    }
    setIsUploading(true);
    try {
      const langInfo = languageOptions.find(opt => opt.value === language);
      const ext = langInfo?.value === 'plaintext' ? 'txt' : langInfo?.value === 'markdown' ? 'md' : langInfo?.value || 'txt';

      let finalFileName: string;
      if (fileName.trim()) {
        finalFileName = fileName.includes('.') ? fileName : `${fileName}.${ext}`;
      } else {
        finalFileName = `paste.${ext}`;
      }

      const fileToUpload = new File([content], finalFileName, { type: 'text/plain' });
      const formData = new FormData();
      formData.append("files", fileToUpload);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/files");
      xhr.setRequestHeader("isPrivate", isPrivate.toString());
      xhr.setRequestHeader("keepOriginalName", (fileName.trim().length > 0).toString());
      xhr.setRequestHeader("expiresIn", expiration);
      xhr.setRequestHeader("fileType", "paste");
      xhr.onload = async () => {
        setIsUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          const result = JSON.parse(xhr.responseText);
          const pasteId = result.url.split('/').pop();

          if (customTag.trim()) {
            try {
              const tagResponse = await fetch('/api/pastes/tags', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'paste-id': pasteId,
                },
                body: JSON.stringify({ tag: customTag.trim() }),
              });

              const tagResult = await tagResponse.json();

              if (tagResponse.ok && tagResult.success) {
                toast.success(
                  <div>
                    <p>Paste created!</p>
                    <Link href={tagResult.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline block mt-1">
                      {tagResult.url}
                    </Link>
                  </div>,
                  { duration: Infinity }
                );
              } else {
                toast.success(
                  <div>
                    <p>Paste created! (Custom tag failed)</p>
                    <Link href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline block mt-1">
                      {result.url}
                    </Link>
                  </div>,
                  { duration: Infinity }
                );
                toast.error(`Custom tag creation failed: ${tagResult.error?.message || tagResult.message || 'Unknown error'}`);
              }
            } catch (_tagError) {
              toast.success(
                <div>
                  <p>Paste created! (Custom tag failed)</p>
                  <Link href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline block mt-1">
                    {result.url}
                  </Link>
                </div>,
                { duration: Infinity }
              );
              toast.error("Failed to create custom tag.");
            }
          } else {
            toast.success(
              <Link href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                {result.url}
              </Link>,
              { duration: Infinity }
            );
          }

          setContent('');
          setFileName('');
          setCustomTag('');
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            toast.error(errorData.error || `Upload failed. Status: ${xhr.status}`);
          } catch (_) {
            toast.error(`Upload failed. Status: ${xhr.status}`);
          }
        }
      };
      xhr.onerror = () => {
        setIsUploading(false);
        toast.error("Upload failed due to a network error.");
      };
      xhr.send(formData);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setIsUploading(false);
      toast.error(error.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <NextSeo title="Rapid Host - Create a Paste" description="Quickly paste and share text or code snippets." />
      <Header />

      <main className="flex-grow flex flex-col items-center w-full px-4 py-6">
        <div className="w-full max-w-4xl">
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-4">Create a paste</h1>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <Input
              placeholder="Filename (optional)"
              value={fileName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFileName(e.target.value)}
            />
            <Select
              options={languageOptions.map(opt => ({ value: opt.value, label: opt.label }))}
              value={language}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setLanguage(e.target.value)}
            />
            <Input
              placeholder="Custom tag (optional)"
              value={customTag}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomTag(e.target.value)}
            />
          </div>

          <div className="rounded-md border border-[var(--border-subtle)] overflow-hidden bg-surface-elevated">
            {language === 'markdown' && (
              <div className="flex items-center border-b border-[var(--border-subtle)] px-1">
                <button
                  onClick={() => setViewMode('write')}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors ${viewMode === 'write' ? 'text-[var(--text-primary)] border-b-2 border-blue-500' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                >
                  Write
                </button>
                <button
                  onClick={() => setViewMode('preview')}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors ${viewMode === 'preview' ? 'text-[var(--text-primary)] border-b-2 border-blue-500' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                >
                  Preview
                </button>
              </div>
            )}

            <div className="w-full h-96">
              {language === 'markdown' && viewMode === 'preview' ? (
                <div className="prose prose-sm sm:prose-base prose-invert max-w-none w-full h-full p-4 overflow-auto">
                  {renderedMarkdown || <p className="text-[var(--text-muted)]">Start writing to see the preview...</p>}
                </div>
              ) : (
                <Editor
                  value={content}
                  onChange={setContent}
                  language={language as Language}
                  placeholder="Paste your content here..."
                />
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
            <div className="flex items-center gap-4">
              <Toggle
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                label="Private"
              />
              <Select
                options={expirationOptions}
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
              />
            </div>
            <Button
              onClick={handleUpload}
              loading={isUploading}
              size="lg"
            >
              Create paste
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export async function getServerSideProps(context: GetSessionParams & GetServerSidePropsContext) {
  const session = await getSession(context);
  if (!session || !session.user) {
    const callbackUrl = encodeURIComponent(context.resolvedUrl || "/paste");
    return { redirect: { destination: `/login?cbU=${callbackUrl}`, permanent: false } };
  }
  const baseUrl = getBase(context.req);
  let defaultExpiration = "never";
  try {
    const userResponse = await fetch(`${baseUrl}/api/users/${session.user.username}`, {
      headers: { Authorization: session.user.token ?? "" },
    });
    if (userResponse.ok) {
      const userData = await userResponse.json();
      if (userData.success && userData.user && userData.user.defaultFileExpiration) {
        defaultExpiration = userData.user.defaultFileExpiration;
      }
    }
  } catch (error) {
    console.error("Error fetching user defaults in paste page:", error);
  }
  return { props: { defaultExpiration } };
}
