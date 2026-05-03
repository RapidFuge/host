import React, { useState } from "react";
import Header from "@components/Header";
import Footer from "@components/Footer";
import { NextSeo } from "next-seo";
import { ChevronDown, ChevronRight, Copy, Check, Lock } from "lucide-react";

type Method = "GET" | "POST" | "PUT" | "DELETE";

interface Endpoint {
  method: Method;
  path: string;
  description: string;
  auth: boolean;
  body?: string;
  params?: string;
  response?: string;
}

const endpoints: { category: string; items: Endpoint[] }[] = [
  {
    category: "Files",
    items: [
      {
        method: "POST",
        path: "/api/files",
        description: "Upload one or more files. Supports multipart form data or binary chunked uploads. Files over 95 MB are automatically split into 50 MB chunks.",
        auth: true,
        body: `Content-Type: multipart/form-data
Field: file (or binary body for chunks)

Headers for chunked upload:
x-upload-id: <upload-session-id>
x-chunk-index: <chunk-number>
x-total-chunks: <total-chunks>
x-finalize: true (on last chunk)

Form fields:
keepOriginalName: "true" | "false"
private: "true" | "false"
expiration: "never" | "1h" | "6h" | "1d" | "1w" | "30d" | "90d" | "1y"`,
        response: `{
  "success": true,
  "files": [{ "id": "abc123", "url": "https://..." }]
}`,
      },
      {
        method: "GET",
        path: "/api/files/[id]",
        description: "Download/stream a file. Supports HTTP range requests for video seeking. Add ?getInfo=true to get file metadata as JSON instead.",
        auth: false,
        params: "?getInfo=true — returns JSON metadata instead of file contents\n?raw=true — raw file content disposition\n?download=true — force download",
        response: `// ?getInfo=true
{
  "success": true,
  "file": {
    "id": "abc123", "fileName": "photo.jpg",
    "extension": "jpg", "size": 1234567,
    "owner": "username", "isPrivate": false,
    "expiresAt": null, "created": "2025-01-01T00:00:00Z",
    "fileType": "file"
  }
}`,
      },
      {
        method: "POST",
        path: "/api/files/[id]",
        description: "Update file properties. Toggles privacy or removes expiration.",
        auth: true,
        body: `{ "isPrivate": true }       // toggle privacy
{ "removeExpiry": true }    // remove expiration`,
        response: `{
  "success": true,
  "message": "File updated successfully"
}`,
      },
      {
        method: "DELETE",
        path: "/api/files/[id]",
        description: "Delete a file and remove it from storage. Also removes any associated paste tags.",
        auth: true,
        response: `{
  "success": true,
  "message": "File deleted successfully"
}`,
      },
    ],
  },
  {
    category: "Links",
    items: [
      {
        method: "POST",
        path: "/api/links",
        description: "Create a shortened link. Supports custom tags and multiple ID generator types.",
        auth: true,
        body: `Header: shorten-url: <target-url>
Body: { "tag": "custom-tag", "shortener": "random" }

Shortener types: random, gfycat, zws, nanoid, timestamp`,
        response: `{
  "success": true,
  "url": "https://host.example/custom-tag",
  "message": "Shortened successfully"
}`,
      },
      {
        method: "GET",
        path: "/api/links/[tag]",
        description: "Get link info by tag.",
        auth: false,
        response: `{
  "success": true,
  "link": {
    "id": "tag", "url": "https://target.com",
    "owner": "username", "created": "2025-01-01T00:00:00Z"
  }
}`,
      },
      {
        method: "PUT",
        path: "/api/links/[tag]",
        description: "Update a link's tag and/or target URL.",
        auth: true,
        body: `{ "tag": "new-tag", "url": "https://new-target.com" }`,
        response: `{
  "success": true,
  "message": "Link updated successfully"
}`,
      },
      {
        method: "DELETE",
        path: "/api/links/[tag]",
        description: "Delete a shortened link.",
        auth: true,
        response: `{
  "success": true,
  "message": "Link deleted successfully"
}`,
      },
    ],
  },
  {
    category: "Pastes",
    items: [
      {
        method: "GET",
        path: "/api/pastes/[id]",
        description: "Get paste metadata.",
        auth: false,
        response: `{
  "success": true,
  "paste": {
    "id": "abc123", "content": "...",
    "language": "javascript", "fileName": "script.js",
    "owner": "username", "isPrivate": false
  }
}`,
      },
      {
        method: "PUT",
        path: "/api/pastes/[id]",
        description: "Update paste content, language, or filename.",
        auth: true,
        body: `{
  "content": "updated code",
  "language": "python",
  "fileName": "script.py"
}`,
        response: `{
  "success": true,
  "message": "Paste updated successfully"
}`,
      },
      {
        method: "POST",
        path: "/api/pastes/tags",
        description: "Create a custom paste tag (vanity URL).",
        auth: true,
        body: `{
  "tag": "my-snippet",
  "pasteId": "abc123"
}`,
        response: `{
  "success": true,
  "message": "Tag created successfully"
}`,
      },
      {
        method: "GET",
        path: "/api/pastes/tags/[tag]",
        description: "Get paste tag info for redirect resolution.",
        auth: false,
        response: `{
  "success": true,
  "tag": { "tag": "my-snippet", "pasteId": "abc123", "owner": "username" }
}`,
      },
      {
        method: "PUT",
        path: "/api/pastes/tags/[tag]",
        description: "Update a paste tag (rename or reassign).",
        auth: true,
        body: `{ "tag": "new-name", "pasteId": "abc123" }`,
      },
      {
        method: "DELETE",
        path: "/api/pastes/tags/[tag]",
        description: "Delete a paste tag.",
        auth: true,
      },
    ],
  },
  {
    category: "Users",
    items: [
      {
        method: "GET",
        path: "/api/users",
        description: "List all users. Admin only.",
        auth: true,
        response: `{
  "success": true,
  "users": [{ "username": "alice" }, { "username": "bob" }]
}`,
      },
      {
        method: "GET",
        path: "/api/users/[id]",
        description: "Get user details.",
        auth: true,
        response: `{
  "success": true,
  "user": {
    "username": "alice", "isAdmin": false,
    "shortener": "random", "embedImageDirectly": true,
    "defaultFileExpiration": "never"
  }
}`,
      },
      {
        method: "DELETE",
        path: "/api/users/[id]",
        description: "Delete a user and all their files. Cannot delete root if PREVENT_ROOT_DELETION=true.",
        auth: true,
      },
      {
        method: "GET",
        path: "/api/users/[id]/files",
        description: "Get paginated files for a user. Use ?all=true to return all files in a single request.",
        auth: false,
        params: "?page=0&limit=20 — paginated response\n?all=true — returns all files (no pagination)",
        response: `{
  "success": true,
  "files": [...],
  "totalPages": 5,
  "currentPage": 0
}`,
      },
      {
        method: "GET",
        path: "/api/users/[id]/links",
        description: "Get all links for a user.",
        auth: false,
        response: `{
  "success": true,
  "links": [{ "id": "tag", "url": "https://...", "owner": "alice", "created": "..." }]
}`,
      },
      {
        method: "POST",
        path: "/api/users/[id]/configuration",
        description: "Update user settings. Can also download ShareX config.",
        auth: true,
        body: `// Update settings:
{ "password": "newpass" }
{ "resetToken": true }
{ "shortener": "gfycat" }
{ "embedImageDirectly": true }
{ "customEmbedDescription": "My files" }
{ "defaultFileExpiration": "30d" }

// Download ShareX config:
?link=true  → file upload config (.sxcu)
?link=false → URL shorten config (.sxcu)`,
      },
      {
        method: "POST",
        path: "/api/users/create",
        description: "Create a new user. Admin only.",
        auth: true,
        body: `{ "username": "newuser", "password": "pass123" }`,
      },
      {
        method: "GET",
        path: "/api/users/tokens",
        description: "List all sign-up tokens. Admin only.",
        auth: true,
      },
      {
        method: "POST",
        path: "/api/users/tokens",
        description: "Create a sign-up token. Admin only.",
        auth: true,
        body: `{ "expires": "7d" }`,
      },
      {
        method: "DELETE",
        path: "/api/users/tokens/[token]",
        description: "Delete a sign-up token. Admin only.",
        auth: true,
      },
    ],
  },
  {
    category: "Utility",
    items: [
      {
        method: "GET",
        path: "/api/homeData",
        description: "Returns instance stats: uptime in hours and total upload count.",
        auth: false,
        response: `{
  "uptime": 1234,
  "uploads": 56789
}`,
      },
      {
        method: "GET",
        path: "/api/checkVersion",
        description: "Compares local version against the latest GitHub release.",
        auth: false,
        response: `{
  "match": false,
  "localVersion": "6.6.0",
  "remoteVersion": "6.7.0"
}`,
      },
    ],
  },
];

const methodColors: Record<Method, string> = {
  GET: "text-emerald-400 bg-emerald-400/10",
  POST: "text-blue-400 bg-blue-400/10",
  PUT: "text-amber-400 bg-amber-400/10",
  DELETE: "text-red-400 bg-red-400/10",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function EndpointCard({ ep }: { ep: Endpoint }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[var(--border-subtle)] rounded-md overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left"
      >
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${methodColors[ep.method]}`}>
          {ep.method}
        </span>
        <code className="text-sm font-mono text-[var(--text-primary)] flex-1 truncate">{ep.path}</code>
        {ep.auth && <Lock className="w-3.5 h-3.5 text-amber-400/60 shrink-0" />}
        {open ? <ChevronDown className="w-4 h-4 text-[var(--text-muted)] shrink-0" /> : <ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />}
      </button>
      {open && (
        <div className="border-t border-[var(--border-subtle)] px-4 py-3 space-y-3 bg-surface-primary/30">
          <p className="text-sm text-[var(--text-secondary)]">{ep.description}</p>
          {ep.params && (
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Parameters</p>
              <pre className="text-xs font-mono text-[var(--text-secondary)] bg-surface-elevated rounded-md p-3 overflow-x-auto whitespace-pre-wrap">
                {ep.params}
              </pre>
            </div>
          )}
          {ep.body && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Request Body</p>
                <CopyButton text={ep.body} />
              </div>
              <pre className="text-xs font-mono text-[var(--text-secondary)] bg-surface-elevated rounded-md p-3 overflow-x-auto whitespace-pre-wrap">
                {ep.body}
              </pre>
            </div>
          )}
          {ep.response && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Response</p>
                <CopyButton text={ep.response} />
              </div>
              <pre className="text-xs font-mono text-[var(--text-secondary)] bg-surface-elevated rounded-md p-3 overflow-x-auto whitespace-pre-wrap">
                {ep.response}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DocsPage() {
  const [search, setSearch] = useState("");

  const filtered = endpoints
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (ep) =>
          ep.path.toLowerCase().includes(search.toLowerCase()) ||
          ep.description.toLowerCase().includes(search.toLowerCase()) ||
          ep.method.includes(search.toUpperCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div className="flex flex-col min-h-screen">
      <NextSeo title="Rapid Host - API Docs" description="Rapid Host API Documentation" />
      <Header />
      <main className="flex-grow px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">API Documentation</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              All endpoints accept and return JSON. Authenticate by including your API token in the{" "}
              <code className="text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded text-xs">Authorization</code> header.
            </p>
          </div>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Search endpoints..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-md bg-surface-elevated border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="space-y-6">
            {filtered.map((cat) => (
              <div key={cat.category}>
                <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                  {cat.category}
                </h2>
                <div className="space-y-2">
                  {cat.items.map((ep) => (
                    <EndpointCard key={`${ep.method}-${ep.path}`} ep={ep} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center text-[var(--text-muted)] py-12">
              No endpoints match your search.
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
