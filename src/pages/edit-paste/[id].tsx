import React, { useState, useEffect, ChangeEvent } from "react";
import { GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import { NextSeo } from "next-seo";
import { toast } from "sonner";
import { Save, Eye } from "lucide-react";
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
import { Button, Input, Select } from "@components/ui";

const languageOptions = [
  { value: 'txt', label: 'Plain Text' },
  { value: 'md', label: 'Markdown' },
  { value: 'js', label: 'JavaScript' },
  { value: 'ts', label: 'TypeScript' },
  { value: 'tsx', label: 'TypeScript React' },
  { value: 'jsx', label: 'JavaScript React' },
  { value: 'py', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'less', label: 'LESS' },
  { value: 'json', label: 'JSON' },
  { value: 'jsonc', label: 'JSON with Comments' },
  { value: 'sh', label: 'Shell' },
  { value: 'bash', label: 'Bash' },
  { value: 'sql', label: 'SQL' },
  { value: 'java', label: 'Java' },
  { value: 'cs', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'rb', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'php', label: 'PHP' },
  { value: 'rs', label: 'Rust' },
  { value: 'swift', label: 'Swift' },
  { value: 'kt', label: 'Kotlin' },
  { value: 'lua', label: 'Lua' },
  { value: 'xml', label: 'XML' },
  { value: 'yaml', label: 'YAML' },
  { value: 'yml', label: 'YML' },
  { value: 'ini', label: 'INI' },
  { value: 'toml', label: 'TOML' },
  { value: 'bat', label: 'Batch' },
  { value: 'ps1', label: 'PowerShell' },
  { value: 'pl', label: 'Perl' },
  { value: 'r', label: 'R' },
  { value: 'dart', label: 'Dart' },
  { value: 'hs', label: 'Haskell' },
  { value: 'erl', label: 'Erlang' },
  { value: 'ex', label: 'Elixir' },
  { value: 'clj', label: 'Clojure' },
  { value: 'scala', label: 'Scala' },
  { value: 'groovy', label: 'Groovy' },
  { value: 'vim', label: 'Vim Script' },
  { value: 'docker', label: 'Dockerfile' },
  { value: 'makefile', label: 'Makefile' },
  { value: 'gradle', label: 'Gradle' },
  { value: 'maven', label: 'Maven' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function EditPastePage({ pasteData }: { pasteData: any }) {
  const [content, setContent] = useState(pasteData.content || '');
  const [fileName, setFileName] = useState(pasteData.publicFileName || '');
  const [language, setLanguage] = useState(pasteData.extension || 'txt');
  const [isPrivate, setIsPrivate] = useState(pasteData.isPrivate);
  const [isUpdating, setIsUpdating] = useState(false);
  const [viewMode, setViewMode] = useState<'write' | 'preview'>('write');
  const [renderedMarkdown, setRenderedMarkdown] = useState<React.ReactElement | null>(null);
  const [existingTag, setExistingTag] = useState(pasteData.existingTag || '');
  const [newTag, setNewTag] = useState('');
  const [isManagingTag, setIsManagingTag] = useState(false);

  useEffect(() => {
    if (viewMode === 'preview' && language === 'md' && content) {
      (async () => {
        setRenderedMarkdown(null);
        try {
          const processor = unified()
            .use(remarkParse).use(remarkGfm)
            .use(remarkRehype, { allowDangerousHtml: true }).use(rehypeRaw).use(rehypeSlug)
            .use(rehypePrismPlus, { ignoreMissing: true })
            .use(rehypeReact, { createElement: React.createElement, Fragment: React.Fragment, jsx, jsxs });
          const file = await processor.process(content);
          setRenderedMarkdown(file.result as React.ReactElement);
        } catch (e) {
          console.error("Error processing Markdown:", e);
          setRenderedMarkdown(<p className="text-red-400">Error rendering Markdown preview.</p>);
        }
      })();
    }
  }, [viewMode, content, language]);

  const handleUpdate = async () => {
    if (!content.trim()) { toast.error("Content cannot be empty."); return; }
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/pastes/${pasteData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, language, fileName: fileName || undefined })
      });
      const result = await response.json();
      if (response.ok) {
        toast.success("Paste updated!");
        window.location.href = `/${pasteData.id}`;
      } else {
        toast.error(result.error || "Failed to update paste.");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTag.trim()) { toast.error("Please enter a tag name."); return; }
    setIsManagingTag(true);
    try {
      const response = await fetch('/api/pastes/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'paste-id': pasteData.id },
        body: JSON.stringify({ tag: newTag.trim() }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast.success(<div><p>Tag created!</p><Link href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline block mt-1">{result.url}</Link></div>, { duration: Infinity });
        setExistingTag(newTag.trim());
        setNewTag('');
      } else {
        toast.error(result.error?.message || result.message || "Failed to create tag.");
      }
    } catch (_error) {
      toast.error("Error creating tag.");
    } finally {
      setIsManagingTag(false);
    }
  };

  const handleUpdateTag = async () => {
    if (!newTag.trim()) { toast.error("Enter a new tag name."); return; }
    setIsManagingTag(true);
    try {
      const response = await fetch(`/api/pastes/tags/${existingTag}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: newTag.trim() }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast.success("Tag updated!");
        setExistingTag(newTag.trim());
        setNewTag('');
      } else {
        toast.error(result.error?.message || result.message || "Failed to update tag.");
      }
    } catch (_error) {
      toast.error("Error updating tag.");
    } finally {
      setIsManagingTag(false);
    }
  };

  const handleDeleteTag = async () => {
    setIsManagingTag(true);
    try {
      const response = await fetch(`/api/pastes/tags/${existingTag}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
      const result = await response.json();
      if (response.ok && result.success) {
        toast.success("Tag deleted!");
        setExistingTag('');
        setNewTag('');
      } else {
        toast.error(result.error?.message || result.message || "Failed to delete tag.");
      }
    } catch (_error) {
      toast.error("Error deleting tag.");
    } finally {
      setIsManagingTag(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <NextSeo title={`Edit Paste - ${pasteData.id}`} description="Edit your paste" />
      <Header />

      <main className="flex-grow flex flex-col items-center w-full px-4 py-6">
        <div className="w-full max-w-4xl">
          <div className="flex justify-between items-center mb-5">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Edit Paste</h1>
            <Link href={`/${pasteData.id}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
              View <Eye className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <Input placeholder="Filename (optional)" value={fileName} onChange={(e: ChangeEvent<HTMLInputElement>) => setFileName(e.target.value)} />
            <Select options={languageOptions.map(opt => ({ value: opt.value, label: opt.label }))} value={language} onChange={(e: ChangeEvent<HTMLSelectElement>) => setLanguage(e.target.value)} />
          </div>

          <div className="rounded-md border border-[var(--border-subtle)] overflow-hidden bg-surface-elevated">
            {language === 'md' && (
              <div className="flex items-center border-b border-[var(--border-subtle)] px-1">
                <button onClick={() => setViewMode('write')} className={`px-4 py-2.5 text-sm font-medium transition-colors ${viewMode === 'write' ? 'text-[var(--text-primary)] border-b-2 border-blue-500' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
                  Write
                </button>
                <button onClick={() => setViewMode('preview')} className={`px-4 py-2.5 text-sm font-medium transition-colors ${viewMode === 'preview' ? 'text-[var(--text-primary)] border-b-2 border-blue-500' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
                  Preview
                </button>
              </div>
            )}
            <div className="w-full h-96">
              {language === 'md' && viewMode === 'preview' ? (
                <div className="prose prose-sm sm:prose-base prose-invert max-w-none w-full h-full p-4 overflow-auto">
                  {renderedMarkdown || <p className="text-[var(--text-muted)]">Start writing to see the preview...</p>}
                </div>
              ) : (
                <Editor value={content} onChange={setContent} language={language as Language} placeholder="Edit your paste content here..." />
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="h-4 w-4 rounded border-[var(--border-subtle)] bg-surface-secondary text-blue-400 focus:ring-blue-500/20" />
              <span className="text-sm text-[var(--text-secondary)]">Private</span>
            </label>
            <Button onClick={handleUpdate} loading={isUpdating} icon={<Save className="w-4 h-4" />}>
              Update paste
            </Button>
          </div>

          <div className="mt-8 p-4 rounded-md bg-surface-elevated border border-[var(--border-subtle)]">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Tag Management</h2>
            {existingTag ? (
              <div className="mb-3">
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  Current: <span className="font-mono text-xs bg-surface-hover px-2 py-0.5 rounded">{existingTag}</span>
                </p>
                <div className="flex gap-2">
                  <Link href={`/${existingTag}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" size="sm">View tag</Button>
                  </Link>
                  <Button variant="danger" size="sm" onClick={() => { if (window.confirm(`Delete tag "${existingTag}"?`)) handleDeleteTag(); }}>
                    Delete tag
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)] mb-3">No custom tag set.</p>
            )}
            <div className="flex gap-2">
              <Input
                placeholder={existingTag ? "New tag name" : "Tag name"}
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
              />
              <Button
                onClick={existingTag ? handleUpdateTag : handleCreateTag}
                loading={isManagingTag}
                size="sm"
              >
                {existingTag ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { params, req } = context;
  const pasteId = params?.id as string;
  const session = await getSession({ req });

  if (!pasteId) return { notFound: true };
  if (!session || !session.user) {
    const callbackUrl = encodeURIComponent(context.resolvedUrl || `/edit-paste/${pasteId}`);
    return { redirect: { destination: `/login?cbU=${callbackUrl}`, permanent: false } };
  }

  const baseUrl = getBase(req);

  try {
    const pasteResponse = await fetch(`${baseUrl}/api/pastes/${pasteId}`, { headers: { Authorization: session.user.token ?? "" } });
    if (!pasteResponse.ok) {
      if (pasteResponse.status === 404) return { notFound: true };
      else if (pasteResponse.status === 403) return { redirect: { destination: `/login?cbU=${encodeURIComponent(context.resolvedUrl || `/edit-paste/${pasteId}`)}`, permanent: false } };
      throw new Error('Could not load paste');
    }
    const pasteData = await pasteResponse.json();
    const contentResponse = await fetch(`${baseUrl}/api/files/${pasteData.id}?raw=true`, { headers: { Authorization: session.user.token ?? "" } });
    if (!contentResponse.ok) throw new Error('Could not load paste content');
    const content = await contentResponse.text();

    let pasteTag = null;
    try {
      const db = await import('@lib/db');
      const databaseInstance = await db.getDatabase();
      const tagRecord = await databaseInstance.getPasteTagByPasteId(pasteData.id);
      if (tagRecord) pasteTag = tagRecord.tag;
    } catch (error) {
      console.warn('Could not check for existing paste tag:', error);
    }

    return { props: { pasteData: { ...pasteData, content, existingTag: pasteTag }, baseUrl } };
  } catch (error) {
    console.error('Error loading paste for editing:', error);
    return { notFound: true };
  }
}
