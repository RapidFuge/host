import { useState, useEffect, useCallback } from "react";
import { Copy, CopyCheck, RefreshCw, X, QrCode } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@components/ui";
import QRModal from "@components/QRModal";

interface ShortenedLink {
  id: string;
  url: string;
  created: string | Date;
  owner: string;
}

interface LinksComponentProps {
  username: string | null;
  isAdmin: boolean;
  loggedInUsername: string;
  token: string;
  baseUrl: string;
}

const EditLinkModal = ({
  link,
  onClose,
  onSave,
  isLoading,
}: {
  link: ShortenedLink;
  onClose: () => void;
  onSave: (newTag: string, newUrl: string) => void;
  isLoading: boolean;
}) => {
  const [editedTag, setEditedTag] = useState(link.id);
  const [editedUrl, setEditedUrl] = useState(link.url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-strong rounded-md border border-[var(--border-default)] shadow-2xl">
        <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border-subtle)]">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Edit Link</h3>
          <button onClick={onClose} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Tag</label>
            <input
              type="text"
              value={editedTag}
              onChange={(e) => setEditedTag(e.target.value)}
              className="w-full px-3 py-2 rounded-md text-sm bg-surface-secondary border border-[var(--border-suble)] text-[var(--text-primary)] focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Original URL</label>
            <input
              type="url"
              value={editedUrl}
              onChange={(e) => setEditedUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-md text-sm bg-surface-secondary border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-[var(--border-subtle)] flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => onSave(editedTag, editedUrl)} loading={isLoading}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function LinksComponent({
  username,
  isAdmin,
  loggedInUsername,
  baseUrl,
}: LinksComponentProps) {
  const [links, setLinks] = useState<ShortenedLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedURLValue, setCopiedURLValue] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<ShortenedLink | null>(null);
  const [qrLink, setQrLink] = useState<{ url: string; label: string } | null>(null);

  const fetchLinks = useCallback(async () => {
    if (!username) { setLinks([]); return; }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${username}/links`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
        throw new Error(errorData.message || `Failed to fetch links.`);
      }
      const data = await response.json();
      if (data.success) {
        setLinks(data.links);
      } else {
        throw new Error(data.message || "API returned success=false");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || err);
      setLinks([]);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const handleUpdateLink = async (newTag: string, newUrl: string) => {
    if (!editingLink) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/links/${editingLink.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: newTag, url: newUrl }),
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error.message || `HTTP error ${response.status}`);
      toast.success(responseData.message || "Link updated!");
      setEditingLink(null);
      fetchLinks();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(`Update failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteLink = async (linkTag: string) => {
    if (!username) return;
    toast(`Delete link "${linkTag}"?`, {
      duration: 10000,
      action: {
        label: "Delete",
        onClick: async () => {
          setIsLoading(true);
          try {
            const response = await fetch(`/api/links/${linkTag}`, { method: "DELETE" });
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
              throw new Error(errorData.error || errorData.message || `Failed to delete link.`);
            }
            const responseData = await response.json();
            if (!responseData.success) throw new Error(responseData.message || "Delete failed.");
            fetchLinks();
            toast.success(responseData.message || "Link deleted!")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (err: any) {
            toast.error(`Delete failed: ${err.message}`);
          } finally {
            setIsLoading(false);
          }
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success("Copied!");
        setCopiedURLValue(text);
        setTimeout(() => setCopiedURLValue(null), 2000);
      })
      .catch(() => toast.error("Failed to copy."));
  };

  if (!username && !isLoading) {
    return <div className="p-8 text-center text-[var(--text-muted)]">Select a user to view their links.</div>;
  }

  return (
    <>
      {editingLink && (
        <EditLinkModal
          link={editingLink}
          onClose={() => setEditingLink(null)}
          onSave={handleUpdateLink}
          isLoading={isUpdating}
        />
      )}
      <div className="p-4 sm:p-5 h-full flex flex-col">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {isAdmin ? `Links: ${username === loggedInUsername ? 'root' : username}` : "Links"}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchLinks}
            disabled={isLoading || !username}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
          >
            Refresh
          </Button>
        </div>

        {isLoading && links.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">
            Loading links...
          </div>
        )}
        {!isLoading && links.length === 0 && username && (
          <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">
            No links found.
          </div>
        )}
        {links.length > 0 && (
          <div className="overflow-x-auto flex-grow rounded-md border border-[var(--border-subtle)]">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Tag</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Short URL</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">Original</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider hidden md:table-cell">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {links.map((link) => {
                  const shortUrl = `${baseUrl}/${link.id}`;
                  return (
                    <tr key={link.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text-primary)]">{link.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Link href={shortUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-xs">
                            {shortUrl}
                          </Link>
                          <button
                            onClick={() => copyToClipboard(shortUrl)}
                            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            {copiedURLValue === shortUrl ? (
                              <CopyCheck className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Link href={link.url} target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs truncate max-w-xs block transition-colors">
                          {link.url}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)] hidden md:table-cell whitespace-nowrap">
                        {new Date(link.created).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-2">
                           <button onClick={() => setQrLink({ url: shortUrl, label: link.id })} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                             <QrCode className="h-3.5 w-3.5" />
                           </button>
                           <button onClick={() => setEditingLink(link)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                            Edit
                          </button>
                          <button onClick={() => handleDeleteLink(link.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {qrLink && (
        <QRModal
          url={qrLink.url}
          label={qrLink.label}
          isOpen={!!qrLink}
          onClose={() => setQrLink(null)}
        />
      )}
    </>
  );
}
