import { useState, useEffect, useCallback } from "react";
import FileModal, { ModalFileItem } from "./FileModal";
import { File, FileAudio, FileVideo2, RefreshCw, ZoomIn, Search, Trash2, Eye, CheckSquare, Square, X } from "lucide-react";
import { toast } from "sonner";
import { Button, Toggle } from "@components/ui";

interface FileItem {
  id: string;
  filename: string;
  publicFileName?: string;
  extension: string;
  mimetype: string;
  url: string;
  openURL: string;
  isPrivate: boolean;
  expiresAt?: Date;
  created?: Date;
}

interface GalleryProps {
  username: string | null;
  isAdmin: boolean;
  loggedInUsername: string;
}

const ITEMS_PER_PAGE_GALLERY = 10;

export default function GalleryComponent({ username, isAdmin, loggedInUsername }: GalleryProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [allFiles, setAllFiles] = useState<FileItem[]>([]);
  const [allFilesLoaded, setAllFilesLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllFileTypes, setShowAllFileTypes] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "size" | "type">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedFileForModal, setSelectedFileForModal] = useState<ModalFileItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const fetchFiles = useCallback(
    async (page: number) => {
      if (!username) {
        setFiles([]);
        setTotalPages(0);
        setCurrentPage(0);
        return;
      }
      setIsLoading(true);
      try {
        const apiUrl = `/api/users/${username}/files?page=${page}&limit=${ITEMS_PER_PAGE_GALLERY}`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: `HTTP error ${response.status}` }));
          throw new Error(errorData.message || `Failed to fetch files.`);
        }
        const data = await response.json();
        if (data.success) {
          const processedApiFiles = data.files.map((file: FileItem) => ({
            id: file.id,
            filename: file.extension ? `${file.id}.${file.extension}` : file.id,
            publicFileName: file.publicFileName,
            mimetype: file.mimetype,
            isPrivate: file.isPrivate,
            created: file.created ? new Date(file.created) : undefined,
            expiresAt: file.expiresAt ? new Date(file.expiresAt) : undefined,
            url: `/api/files/${file.id}`,
            openURL: `/${file.id}`,
          }));
          setFiles(processedApiFiles);
          setTotalPages(data.totalPages);
          setCurrentPage(data.currentPage || page);
        } else {
          throw new Error(data.message || "API returned success=false");
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        toast.error(err.message || err)
        setFiles([]);
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
    },
    [username]
  );

  useEffect(() => {
    if (username) {
      fetchFiles(currentPage);
    } else {
      setFiles([]);
      setTotalPages(0);
      setCurrentPage(0);
    }
  }, [username, currentPage, fetchFiles]);

  useEffect(() => {
    setCurrentPage(0);
  }, [username]);

  const fetchAllFiles = useCallback(async () => {
    if (!username) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${username}/files?all=true`);
      if (!res.ok) throw new Error("Failed to fetch files");
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "API error");
      const processed = data.files.map((file: FileItem) => ({
        id: file.id,
        filename: file.extension ? `${file.id}.${file.extension}` : file.id,
        publicFileName: file.publicFileName,
        extension: file.extension,
        mimetype: file.mimetype,
        isPrivate: file.isPrivate,
        created: file.created ? new Date(file.created) : undefined,
        expiresAt: file.expiresAt ? new Date(file.expiresAt) : undefined,
        url: `/api/files/${file.id}`,
        openURL: `/${file.id}`,
      }));
      setAllFiles(processed);
      setAllFilesLoaded(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || "Search failed");
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  const needsAllFiles = searchQuery.trim() || !(sortBy === "date" && sortOrder === "desc");

  useEffect(() => {
    if (needsAllFiles && !allFilesLoaded) {
      fetchAllFiles();
      if (searchQuery.trim()) setShowAllFileTypes(true);
    }
    if (!needsAllFiles) {
      setAllFilesLoaded(false);
      setAllFiles([]);
    }
  }, [needsAllFiles, allFilesLoaded, fetchAllFiles, searchQuery]);

  useEffect(() => {
    setAllFilesLoaded(false);
    setAllFiles([]);
  }, [username]);

  const handleRefresh = () => {
    if (username) {
      fetchFiles(currentPage);
      if (needsAllFiles) {
        setAllFilesLoaded(false);
        setAllFiles([]);
      }
    }
  };
  const handlePreviousPage = () => setCurrentPage((prev) => Math.max(0, prev - 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  const handlePageClick = (pageNumber: number) => setCurrentPage(pageNumber);
  const openFileModal = (file: FileItem) => setSelectedFileForModal(file as ModalFileItem);
  const closeFileModal = () => setSelectedFileForModal(null);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === displayedFiles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedFiles.map((f) => f.id)));
    }
  };

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    toast(`Delete ${count} file${count > 1 ? "s" : ""}? This cannot be undone.`, {
      duration: 15000,
      action: {
        label: `Delete ${count}`,
        onClick: async () => {
          setIsBulkLoading(true);
          let failed = 0;
          for (const id of selectedIds) {
            try {
              const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
              const d = await res.json();
              if (!res.ok || !d.success) failed++;
            } catch {
              failed++;
            }
          }
          setSelectedIds(new Set());
          setIsSelectMode(false);
          await fetchFiles(currentPage);
          setIsBulkLoading(false);
          if (failed > 0) toast.error(`Failed to delete ${failed} file(s)`);
          else toast.success(`Deleted ${count} file${count > 1 ? "s" : ""}`);
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  };

  const handleBulkTogglePrivacy = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkLoading(true);
    let failed = 0;
    for (const id of selectedIds) {
      const file = files.find((f) => f.id === id);
      if (!file) { failed++; continue; }
      try {
        const res = await fetch(`/api/files/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPrivate: !file.isPrivate }),
        });
        const d = await res.json();
        if (!res.ok || !d.success) failed++;
      } catch {
        failed++;
      }
    }
    setSelectedIds(new Set());
    setIsSelectMode(false);
    await fetchFiles(currentPage);
    setIsBulkLoading(false);
    if (failed > 0) toast.error(`Failed to update ${failed} file(s)`);
    else toast.success(`Updated privacy for ${selectedIds.size} file${selectedIds.size > 1 ? "s" : ""}`);
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!username) return;

    toast("Are you sure you want to delete this file? This action cannot be undone.", {
      duration: 10000,
      action: {
        label: "Delete",
        onClick: async () => {
          setIsLoading(true);
          try {
            const response = await fetch(`/api/files/${fileId}`, { method: "DELETE" });
            const responseData = await response.json();
            if (!response.ok || !responseData.success)
              throw new Error(responseData.message || "Failed to delete file.");
            setFiles((prevFiles) => prevFiles.filter((f) => f.id !== fileId));
            closeFileModal();
            if (files.filter((f) => f.id !== fileId).length === 0 && currentPage > 0) {
              setCurrentPage((prev) => prev - 1);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (err: any) {
            toast.error(`Delete failed: ${err.message}`)
          } finally {
            setIsLoading(false);
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  const baseFiles = needsAllFiles && allFilesLoaded ? allFiles : files;

  let displayedFiles = showAllFileTypes
    ? baseFiles
    : baseFiles.filter((file) => file.mimetype && (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")));

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    const isWildcard = q.includes("*");
    displayedFiles = displayedFiles.filter((file) => {
      const name = (file.publicFileName ?? file.filename).toLowerCase();
      const ext = file.extension?.toLowerCase() || "";
      if (isWildcard) {
        const pattern = q.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
        try {
          const regex = new RegExp(`^${pattern}$`, 'i');
          return regex.test(name) || regex.test(ext);
        } catch {
          return name.includes(q.replace(/\*/g, ''));
        }
      }
      return name.includes(q) || file.mimetype.toLowerCase().includes(q) || ext.includes(q);
    });
  }

  displayedFiles = [...displayedFiles].sort((a, b) => {
    const dir = sortOrder === "asc" ? 1 : -1;
    switch (sortBy) {
      case "name":
        return dir * ((a.publicFileName ?? a.filename).localeCompare(b.publicFileName ?? b.filename));
      case "date":
        if (!a.created && !b.created) return 0;
        if (!a.created) return 1;
        if (!b.created) return -1;
        return dir * (a.created.getTime() - b.created.getTime());
      case "type":
        return dir * a.mimetype.localeCompare(b.mimetype);
      default:
        return 0;
    }
  });

  if (!username && !isLoading) {
    return (
      <div className="p-8 text-center text-[var(--text-muted)]">
        Select a user to view their gallery.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          {isAdmin ? `Gallery: ${username === loggedInUsername ? 'root' : username}` : "Gallery"}
        </h2>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search (*.txt, name...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm rounded-md bg-surface-elevated border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <Toggle
            checked={showAllFileTypes}
            onChange={() => setShowAllFileTypes(!showAllFileTypes)}
            label="All types"
          />
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split("-");
              setSortBy(by as typeof sortBy);
              setSortOrder(order as typeof sortOrder);
            }}
            className="px-2 py-1.5 text-xs rounded-md bg-surface-elevated border border-[var(--border-subtle)] text-[var(--text-secondary)] focus:border-blue-500/40 transition-colors"
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="type-asc">Type A-Z</option>
            <option value="type-desc">Type Z-A</option>
          </select>
          <Button
            variant={isSelectMode ? "secondary" : "ghost"}
            size="sm"
            onClick={() => isSelectMode ? exitSelectMode() : setIsSelectMode(true)}
            icon={isSelectMode ? <X className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
            disabled={isLoading || !username}
          >
            {isSelectMode ? "Cancel" : "Select"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || !username}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {isSelectMode && displayedFiles.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-1">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            {selectedIds.size === displayedFiles.length ? (
              <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            {selectedIds.size === displayedFiles.length ? "Deselect all" : "Select all"}
          </button>
          <span className="text-xs text-[var(--text-muted)]">
            {selectedIds.size} selected
          </span>
          {selectedIds.size > 0 && (
            <>
              <button
                onClick={handleBulkTogglePrivacy}
                disabled={isBulkLoading}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-surface-elevated border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 transition-colors"
              >
                <Eye className="w-3 h-3" /> Toggle privacy
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isBulkLoading}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </>
          )}
        </div>
      )}

      {isLoading && displayedFiles.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="space-y-3 w-full">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="flex-1 aspect-square rounded-md bg-surface-elevated animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && displayedFiles.length === 0 && username && searchQuery.trim() && (
        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">
          No files match &ldquo;{searchQuery.trim()}&rdquo;.
        </div>
      )}

      {!isLoading && files.length === 0 && username && !needsAllFiles && (
        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">
          No files found.
        </div>
      )}

      {displayedFiles.length > 0 && searchQuery.trim() && (
        <p className="text-xs text-[var(--text-muted)] mb-3">
          {displayedFiles.length} result{displayedFiles.length !== 1 ? "s" : ""} across all pages
        </p>
      )}

      {displayedFiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 flex-grow overflow-y-auto pb-4">
          {displayedFiles.map((file) => {
            const filename = file.publicFileName ?? file.filename;
            const isPreviewableInModal =
              file.mimetype.startsWith("image/") ||
              file.mimetype.startsWith("video/") ||
              file.mimetype.startsWith("audio/");
            const isSelected = selectedIds.has(file.id);
            return (
              <div
                key={filename}
                className={`
                  relative rounded-md overflow-hidden border transition-all duration-200 group
                  ${isSelected ? "border-blue-500/60 ring-1 ring-blue-500/30" : isPreviewableInModal ? "cursor-pointer border-[var(--border-subtle)] hover:border-blue-500/30" : "border-[var(--border-subtle)]"}
                `}
                onClick={() => {
                  if (isSelectMode) {
                    toggleSelect(file.id);
                  } else if (isPreviewableInModal) {
                    openFileModal(file);
                  }
                }}
              >
                {isSelectMode && (
                  <div className="absolute top-2 left-2 z-20">
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-blue-400 drop-shadow-lg" />
                    ) : (
                      <Square className="w-5 h-5 text-white/50 drop-shadow-lg" />
                    )}
                  </div>
                )}
                {!isPreviewableInModal && !isSelectMode && (
                  <a
                    href={file.openURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 z-10"
                    aria-label={`Open file ${filename}`}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                {file.mimetype.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={file.url}
                    alt={filename}
                    className="w-full h-36 sm:h-40 object-cover bg-surface-hover"
                    loading="lazy"
                  />
                ) : file.mimetype.startsWith("video/") ? (
                  <div className="relative w-full h-36 sm:h-40 bg-surface-hover">
                    <video
                      src={file.url}
                      className="w-full h-full object-cover"
                      preload="metadata"
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                        <FileVideo2 className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-36 sm:h-40 flex flex-col items-center justify-center bg-surface-hover p-3">
                    {file.mimetype.startsWith('audio/') ? (
                      <FileAudio className="h-10 w-10 text-[var(--text-muted)]" strokeWidth={1} />
                    ) : (
                      <File className="h-10 w-10 text-[var(--text-muted)]" strokeWidth={1} />
                    )}
                    <p className="mt-2 text-xs text-[var(--text-secondary)] truncate max-w-full text-center" title={filename}>
                      {filename.length > 20 ? `${filename.substring(0, 18)}...` : filename}
                    </p>
                  </div>
                )}
                <div className="p-2.5">
                  <p className="text-xs font-medium truncate text-[var(--text-primary)]" title={filename}>
                    {filename}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">{file.mimetype}</p>
                  {file.isPrivate && (
                    <span className="text-[10px] text-yellow-400/80">Private</span>
                  )}
                </div>
                {isPreviewableInModal && !isSelectMode && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all duration-200 pointer-events-none opacity-0 group-hover:opacity-100">
                    <ZoomIn className="h-8 w-8 text-white/80" strokeWidth={1.5} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && !needsAllFiles && (
        <div className="mt-auto pt-4 flex flex-wrap justify-center items-center gap-1.5">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 0 || isLoading}
            className="px-2.5 py-1 text-xs rounded-md bg-surface-elevated border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-all"
          >
            Prev
          </button>
          {[...Array(totalPages).keys()]
            .slice(Math.max(0, currentPage - 2), Math.min(totalPages, currentPage + 3))
            .map((num) => (
              <button
                key={num}
                onClick={() => handlePageClick(num)}
                className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                  currentPage === num
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/20 font-semibold"
                    : "bg-surface-elevated border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {num + 1}
              </button>
            ))}
          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - 1 || isLoading}
            className="px-2.5 py-1 text-xs rounded-md bg-surface-elevated border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-all"
          >
            Next
          </button>
        </div>
      )}

      {selectedFileForModal && (
        <FileModal
          file={selectedFileForModal}
          isOpen={!!selectedFileForModal}
          onClose={closeFileModal}
          onDelete={handleDeleteFile}
        />
      )}
    </div>
  );
}
