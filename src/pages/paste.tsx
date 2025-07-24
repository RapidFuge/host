// pages/paste.tsx

import React, { useState, ChangeEvent, useEffect } from "react";
import { GetServerSidePropsContext } from "next";
import { getSession, GetSessionParams } from "next-auth/react";
import { NextSeo } from "next-seo";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
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
import { random } from "@lib/generators";

const languageOptions = [
    { value: 'plaintext', label: 'Plain Text', ext: 'txt' },
    { value: 'markdown', label: 'Markdown', ext: 'md' },
    { value: 'javascript', label: 'JavaScript', ext: 'js' },
    { value: 'typescript', label: 'TypeScript', ext: 'ts' },
    { value: 'python', label: 'Python', ext: 'py' },
    { value: 'html', label: 'HTML', ext: 'html' },
    { value: 'css', label: 'CSS', ext: 'css' },
    { value: 'json', label: 'JSON', ext: 'json' },
    { value: 'shell', label: 'Shell / Bash', ext: 'sh' },
    { value: 'sql', label: 'SQL', ext: 'sql' },
    { value: 'java', label: 'Java', ext: 'java' },
    { value: 'csharp', label: 'C#', ext: 'cs' },
    { value: 'cpp', label: 'C++', ext: 'cpp' },
    { value: 'ruby', label: 'Ruby', ext: 'rb' },
    { value: 'go', label: 'Go', ext: 'go' },
    { value: 'php', label: 'PHP', ext: 'php' },
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

    const expirationOptions = [
        { value: "never", label: "Expires in: Never" },
        { value: "1h", label: "Expires in: 1 Hour" },
        { value: "6h", label: "Expires in: 6 Hours" },
        { value: "1d", label: "Expires in: 1 Day" },
        { value: "1w", label: "Expires in: 1 Week" },
        { value: "30d", label: "Expires in: 1 Month" },
        { value: "90d", label: "Expires in: 3 Months" },
        { value: "1y", label: "Expires in: 1 Year" },
    ];

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
                        .use(rehypePrismPlus, { ignoreMissing: true, showLineNumbers: false })
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
            const ext = langInfo?.ext || 'txt';
            let finalFileName: string;
            if (fileName.trim()) {
                finalFileName = fileName.includes('.') ? fileName : `${fileName}.${ext}`;
            } else {
                const randomName = await random(8);
                finalFileName = `${randomName}.${ext}`;
            }
            const fileToUpload = new File([content], finalFileName, { type: 'text/plain' });
            const formData = new FormData();
            formData.append("files", fileToUpload);
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/api/files");
            xhr.setRequestHeader("isPrivate", isPrivate.toString());
            xhr.setRequestHeader("keepOriginalName", "true");
            xhr.setRequestHeader("expiresIn", expiration);
            xhr.onload = () => {
                setIsUploading(false);
                if (xhr.status >= 200 && xhr.status < 300) {
                    const result = JSON.parse(xhr.responseText);
                    toast.success(
                        <Link href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            {result.url}
                        </Link>,
                        { duration: Infinity }
                    );
                    setContent('');
                    setFileName('');
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
        <div className="flex flex-col min-h-screen bg-black text-zinc-100">
            <NextSeo title="Create a Paste - RapidHost" description="Quickly paste and share text or code snippets." />
            <Header />

            <main className="flex-grow flex flex-col items-center w-full px-4 py-8">
                <div className="w-full max-w-4xl">
                    <h1 className="text-3xl font-bold mb-6 text-center">Create a New Paste</h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                            type="text"
                            placeholder="Optional: filename.js, notes.md..."
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
                        {language === 'markdown' && (
                            <div className="flex items-center border-b border-neutral-700 bg-neutral-800">
                                <button onClick={() => setViewMode('write')} className={`px-4 py-2 text-sm font-medium border-r border-neutral-700 ${viewMode === 'write' ? 'text-white' : 'text-neutral-400 hover:text-white'}`}>
                                    Write
                                </button>
                                <button onClick={() => setViewMode('preview')} className={`px-4 py-2 text-sm font-medium ${viewMode === 'preview' ? 'text-white' : 'text-neutral-400 hover:text-white'}`}>
                                    Preview
                                </button>
                            </div>
                        )}

                        <div className="w-full h-96 bg-neutral-900">
                            {language === 'markdown' && viewMode === 'preview' ? (
                                <div className="prose prose-sm sm:prose-base prose-invert max-w-none w-full h-full p-4 overflow-auto">
                                    {renderedMarkdown || <p className="text-neutral-500">Start writing to see the preview...</p>}
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
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                <span className="ml-2 text-sm text-zinc-300">Private Paste</span>
                            </label>
                            <select
                                value={expiration}
                                onChange={(e) => setExpiration(e.target.value)}
                                className="px-3 py-1.5 border border-neutral-700 bg-neutral-900 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {expirationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                        <button
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="w-full sm:w-auto px-8 py-2.5 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:bg-neutral-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                        >
                            {isUploading ? (<><LoaderCircle className="animate-spin mr-2" /> Creating...</>) : "Create Paste"}
                        </button>
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