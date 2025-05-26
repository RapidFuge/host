// components/Dashboard/Gallery.tsx
import { useState, useEffect, useCallback } from "react";
import FileModal, { ModalFileItem } from "./FileModal"; // Ensure this path is correct

interface FileItem {
  id: string;
  filename: string;
  mimetype: string;
  url: string;
  openURL: string;
  isPrivate: boolean;
  created?: Date;
}

interface GalleryProps {
  username: string | null;
}

const ITEMS_PER_PAGE_GALLERY = 10;

export default function GalleryComponent({ username }: GalleryProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllFileTypes, setShowAllFileTypes] = useState(false);
  const [selectedFileForModal, setSelectedFileForModal] =
    useState<ModalFileItem | null>(null);

  const fetchFiles = useCallback(
    async (page: number) => {
      if (!username) {
        setFiles([]);
        setTotalPages(0);
        setCurrentPage(0);
        return;
      }
      setIsLoading(true);
      setError(null);
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const processedApiFiles = data.files.map((file: any) => ({
            id: file.id,
            filename: file.id,
            mimetype: file.mimetype,
            isPrivate: file.isPrivate,
            created: file.created ? new Date(file.created) : undefined,
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
        setError(err.message);
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

  const handleRefresh = () => {
    if (username) {
      fetchFiles(currentPage);
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  const handlePageClick = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const openFileModal = (file: FileItem) => {
    setSelectedFileForModal(file as ModalFileItem);
  };

  const closeFileModal = () => {
    setSelectedFileForModal(null);
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!username) return;
    if (
      !window.confirm(
        "Are you sure you want to delete this file? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });
      const responseData = await response.json();
      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || "Failed to delete file.");
      }

      setFiles((prevFiles) => prevFiles.filter((f) => f.id !== fileId));
      closeFileModal();
      // Consider re-fetching or smarter pagination update if deletion affects page counts
      // For example, if the current page becomes empty, go to previous page or refetch.
      if (
        files.filter((f) => f.id !== fileId).length === 0 &&
        currentPage > 0
      ) {
        setCurrentPage((prev) => prev - 1); // Go to previous page if current becomes empty
      } else if (
        files.filter((f) => f.id !== fileId).length === 0 &&
        currentPage === 0 &&
        totalPages > 1
      ) {
        // If on first page and it becomes empty but there are other pages, fetch again
        // This scenario is less likely with current logic, but good to consider.
        // Or, just let it show "no files" if all are deleted.
      }
      // Or simply: fetchFiles(currentPage); if easier, but might cause a flicker.

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(`Delete failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const displayedFiles = showAllFileTypes
    ? files
    : files.filter(
        (file) => file.mimetype && file.mimetype.startsWith("image/")
      );

  if (!username && !isLoading) {
    return (
      <div className="p-4 text-center text-gray-400">
        Select a user to view their gallery.
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h2 className="text-2xl font-semibold">
          {username ? `Gallery: ${username}` : "Gallery"}
        </h2>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={showAllFileTypes}
              onChange={() => setShowAllFileTypes(!showAllFileTypes)}
              className="mr-2 h-4 w-4 rounded text-blue-500 focus:ring-blue-400 border-gray-500 bg-gray-700"
            />
            Show all file types
          </label>
          <button
            onClick={handleRefresh}
            disabled={isLoading || !username}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-100 p-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}
      {isLoading && displayedFiles.length === 0 && (
        <div className="text-center py-10 text-gray-400">Loading files...</div>
      )}
      {!isLoading && !error && files.length === 0 && username && (
        <div className="text-center py-10 text-gray-400">
          No files found for this user.
        </div>
      )}

      {displayedFiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 flex-grow overflow-y-auto pb-4">
          {displayedFiles.map((file) => {
            const isPreviewableInModal =
              file.mimetype.startsWith("image/") ||
              file.mimetype.startsWith("video/") ||
              file.mimetype.startsWith("audio/");
            return (
              <div
                key={file.id}
                className={`relative border border-gray-700 rounded-lg overflow-hidden shadow-lg bg-gray-800 flex flex-col group ${
                  isPreviewableInModal
                    ? "cursor-pointer hover:border-blue-500 transition-all"
                    : "cursor-default"
                }`}
                onClick={() => {
                  if (isPreviewableInModal) {
                    openFileModal(file);
                  }
                }}
              >
                {!isPreviewableInModal ? (
                  <a
                    href={file.openURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 z-10"
                    aria-label={`Open file ${file.id}`}
                    onClick={(e) => e.stopPropagation()} // Prevent Gallery item's onClick
                  ></a>
                ) : null}

                {file.mimetype.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={file.url}
                    alt={file.id}
                    className="w-full h-40 sm:h-48 object-cover bg-gray-700"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).alt =
                        "Image failed to load";
                    }}
                  />
                ) : (
                  <div className="w-full h-40 sm:h-48 flex flex-col items-center justify-center bg-gray-700 p-2 text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-16 w-16"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <p
                      className="mt-2 text-xs text-gray-300 break-all text-center"
                      title={file.id}
                    >
                      {file.id.length > 20
                        ? `${file.id.substring(0, 18)}...`
                        : file.id}
                    </p>
                    {!isPreviewableInModal && (
                      <p className="text-xs mt-1 text-blue-400 underline">
                        Click to open
                      </p>
                    )}
                  </div>
                )}
                <div className="p-3 bg-gray-800">
                  <p
                    className="text-sm font-medium truncate text-zinc-200"
                    title={file.id}
                  >
                    {file.id}
                  </p>
                  <p
                    className="text-xs text-gray-400 truncate"
                    title={file.mimetype}
                  >
                    {file.mimetype}
                  </p>
                  {file.isPrivate && (
                    <p className="text-xs text-yellow-400">Private</p>
                  )}
                </div>

                {isPreviewableInModal && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-opacity duration-200 pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10 text-white opacity-0 group-hover:opacity-80"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-auto pt-4 flex flex-wrap justify-center items-center gap-2">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 0 || isLoading}
            className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            Page {currentPage + 1} of {totalPages}
          </span>
          {[...Array(totalPages).keys()]
            .slice(
              Math.max(0, currentPage - 2),
              Math.min(totalPages, currentPage + 3)
            )
            .map((num) => (
              <button
                key={num}
                onClick={() => handlePageClick(num)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  currentPage === num
                    ? "bg-blue-600 text-white font-semibold"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                {num + 1}
              </button>
            ))}
          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - 1 || isLoading}
            className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
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
