// pages/edit-paste/[id].tsx

import React, { useState, useEffect, ChangeEvent } from "react";
import { GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import { NextSeo } from "next-seo";
import { toast } from "sonner";
import { LoaderCircle, Save, Eye } from "lucide-react";
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
export default function EditPastePage({ pasteData }: { pasteData: any; }) {
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

    const handleUpdate = async () => {
        if (!content.trim()) {
            toast.error("Content cannot be empty.");
            return;
        }
        setIsUpdating(true);
        try {
            const response = await fetch(`/api/pastes/${pasteData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content,
                    language,
                    fileName: fileName || undefined  // Only send if fileName is provided
                })
            });

            const result = await response.json();

            if (response.ok) {
                toast.success("Paste updated successfully!");
                // Redirect to the updated paste view
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
        if (!newTag.trim()) {
            toast.error("Please enter a tag name.");
            return;
        }

        setIsManagingTag(true);
        try {
            const response = await fetch('/api/pastes/tags', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'paste-id': pasteData.id,
                },
                body: JSON.stringify({ tag: newTag.trim() }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                toast.success(
                    <div>
                        <p>Tag created successfully!</p>
                        <Link href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline block mt-1">
                            {result.url}
                        </Link>
                    </div>,
                    { duration: Infinity }
                );
                setExistingTag(newTag.trim());
                setNewTag('');
            } else {
                toast.error(result.error?.message || result.message || "Failed to create tag.");
            }
        } catch (_error) {
            toast.error("An error occurred while creating the tag.");
        } finally {
            setIsManagingTag(false);
        }
    };

    const handleUpdateTag = async () => {
        if (!newTag.trim()) {
            toast.error("Please enter a new tag name.");
            return;
        }

        setIsManagingTag(true);
        try {
            const response = await fetch(`/api/pastes/tags/${existingTag}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tag: newTag.trim() }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                toast.success("Tag updated successfully!");
                setExistingTag(newTag.trim());
                setNewTag('');
            } else {
                toast.error(result.error?.message || result.message || "Failed to update tag.");
            }
        } catch (_error) {
            toast.error("An error occurred while updating the tag.");
        } finally {
            setIsManagingTag(false);
        }
    };

    const handleDeleteTag = async () => {
        setIsManagingTag(true);
        try {
            const response = await fetch(`/api/pastes/tags/${existingTag}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (response.ok && result.success) {
                toast.success("Tag deleted successfully!");
                setExistingTag('');
                setNewTag('');
            } else {
                toast.error(result.error?.message || result.message || "Failed to delete tag.");
            }
        } catch (_error) {
            toast.error("An error occurred while deleting the tag.");
        } finally {
            setIsManagingTag(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-black text-zinc-100">
            <NextSeo title={`Edit Paste - ${pasteData.id}`} description="Edit your paste" />
            <Header />

            <main className="flex-grow flex flex-col items-center w-full px-4 py-8">
                <div className="w-full max-w-4xl">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold">Edit Paste</h1>
                        <Link
                            href={`/${pasteData.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 flex items-center"
                        >
                            View Paste <Eye className="ml-1 w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                            type="text"
                            placeholder="Filename (optional)"
                            value={fileName}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setFileName(e.target.value)}
                            className="w-full px-4 py-2 border border-neutral-700 bg-neutral-900 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                            value={language}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setLanguage(e.target.value)}
                            className="w-full px-4 py-2 border border-neutral-700 bg-neutral-900 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {languageOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>

                    <div className="w-full border border-neutral-700 rounded-md overflow-hidden">
                        {language === 'md' && (
                            <div className="flex items-center border-b border-neutral-700 bg-neutral-800">
                                <button
                                    onClick={() => setViewMode('write')}
                                    className={`px-4 py-2 text-sm font-medium border-r border-neutral-700 ${viewMode === 'write' ? 'text-white' : 'text-neutral-400 hover:text-white'}`}
                                >
                                    Write
                                </button>
                                <button
                                    onClick={() => setViewMode('preview')}
                                    className={`px-4 py-2 text-sm font-medium ${viewMode === 'preview' ? 'text-white' : 'text-neutral-400 hover:text-white'}`}
                                >
                                    Preview
                                </button>
                            </div>
                        )}

                        <div className="w-full h-96 bg-neutral-900">
                            {language === 'md' && viewMode === 'preview' ? (
                                <div className="prose prose-sm sm:prose-base prose-invert max-w-none w-full h-full p-4 overflow-auto">
                                    {renderedMarkdown || <p className="text-neutral-500">Start writing to see the preview...</p>}
                                </div>
                            ) : (
                                <Editor
                                    value={content}
                                    onChange={setContent}
                                    language={language as Language}
                                    placeholder="Edit your paste content here..."
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isPrivate}
                                onChange={(e) => setIsPrivate(e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-zinc-300">Private Paste</span>
                        </label>

                        <button
                            onClick={handleUpdate}
                            disabled={isUpdating}
                            className="w-full sm:w-auto px-8 py-2.5 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:bg-neutral-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                        >
                            {isUpdating ? (<><LoaderCircle className="animate-spin mr-2" /> Updating...</>) : <><Save className="mr-2 w-4 h-4" /> Update Paste</>}
                        </button>
                    </div>

                    {/* Tag Management Section */}
                    <div className="mt-8 p-4 border border-neutral-700 rounded-md bg-neutral-900">
                        <h2 className="text-xl font-semibold mb-4">Tag Management</h2>

                        {existingTag ? (
                            <div className="mb-4">
                                <p className="mb-2">Current tag: <span className="font-mono bg-neutral-800 px-2 py-1 rounded">{existingTag}</span></p>
                                <div className="flex flex-wrap gap-2">
                                    <Link
                                        href={`/${existingTag}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                                    >
                                        View Tag
                                    </Link>
                                    <button
                                        onClick={() => {
                                            if (window.confirm(`Are you sure you want to delete the tag "${existingTag}"?`)) {
                                                handleDeleteTag();
                                            }
                                        }}
                                        className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                                    >
                                        Delete Tag
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="mb-4">This paste does not have a custom tag yet.</p>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                placeholder={existingTag ? "New tag name" : "Tag name"}
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                className="flex-grow px-4 py-2 border border-neutral-700 bg-neutral-800 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={existingTag ? handleUpdateTag : handleCreateTag}
                                disabled={isManagingTag}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-neutral-600 disabled:cursor-not-allowed transition-colors"
                            >
                                {isManagingTag ? "Processing..." : existingTag ? "Update Tag" : "Create Tag"}
                            </button>
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

    if (!pasteId) {
        return { notFound: true };
    }

    if (!session || !session.user) {
        const callbackUrl = encodeURIComponent(context.resolvedUrl || `/edit-paste/${pasteId}`);
        return {
            redirect: {
                destination: `/login?cbU=${callbackUrl}`,
                permanent: false
            }
        };
    }

    const baseUrl = getBase(req);

    try {
        // Get the paste data
        const pasteResponse = await fetch(`${baseUrl}/api/pastes/${pasteId}`, {
            headers: { Authorization: session.user.token ?? "" },
        });

        if (!pasteResponse.ok) {
            if (pasteResponse.status === 404) {
                return { notFound: true };
            } else if (pasteResponse.status === 403) {
                return {
                    redirect: {
                        destination: `/login?cbU=${encodeURIComponent(context.resolvedUrl || `/edit-paste/${pasteId}`)}`,
                        permanent: false
                    }
                };
            }
            throw new Error('Could not load paste');
        }

        const pasteData = await pasteResponse.json();

        // Get the raw content of the paste
        const contentResponse = await fetch(`${baseUrl}/api/files/${pasteData.id}?raw=true`, {
            headers: { Authorization: session.user.token ?? "" },
        });

        if (!contentResponse.ok) {
            throw new Error('Could not load paste content');
        }

        const content = await contentResponse.text();

        // Check if this paste has an associated tag
        let pasteTag = null;
        try {
            const db = await import('@lib/db'); // Import the db module to access methods
            const databaseInstance = await db.getDatabase();
            const tagRecord = await databaseInstance.getPasteTagByPasteId(pasteData.id);
            if (tagRecord) {
                pasteTag = tagRecord.tag;
            }
        } catch (error) {
            console.warn('Could not check for existing paste tag:', error);
        }

        return {
            props: {
                pasteData: { ...pasteData, content, existingTag: pasteTag },
                baseUrl
            }
        };
    } catch (error) {
        console.error('Error loading paste for editing:', error);
        return { notFound: true };
    }
}