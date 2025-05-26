// components/Dashboard/FileModal.tsx
import React, { useEffect } from "react";

export interface ModalFileItem {
  // Renamed to avoid conflict if FileItem is global
  id: string;
  filename: string;
  mimetype: string;
  url: string; // Direct URL to the file, e.g., /api/files/[id]
  isPrivate: boolean;
  created?: Date;
}

interface FileModalProps {
  file: ModalFileItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (fileId: string) => Promise<void>;
  // No token needed if onDelete is handled by parent that has token
}

export default function FileModal({
  file,
  isOpen,
  onClose,
  onDelete,
}: FileModalProps) {
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
      document.body.style.overflow = "hidden"; // Prevent background scroll
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !file) {
    return null;
  }

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = file.url;
    link.setAttribute("download", file.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Consider closing modal or not based on UX preference
  };

  const handleDeleteClick = () => {
    // Confirmation is handled in GalleryComponent before calling onDelete
    onDelete(file.id);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      // Only close if backdrop itself is clicked
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-80 p-4 transition-opacity duration-300 ease-in-out"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-modal-title"
    >
      <div className="bg-gray-800 text-zinc-100 rounded-lg shadow-xl w-full max-w-2xl lg:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-700 min-h-[60px]">
          <h2
            id="file-modal-title"
            className="text-lg sm:text-xl font-semibold truncate"
            title={file.filename}
          >
            {file.filename}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content: Image, Video, Audio Preview */}
        <div className="p-2 sm:p-4 flex-grow overflow-y-auto flex justify-center items-center bg-gray-900 min-h-[200px]">
          {file.mimetype.startsWith("image/") && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={file.url}
              alt={file.filename}
              className="max-w-full max-h-[calc(90vh-200px)] object-contain rounded"
            />
          )}
          {file.mimetype.startsWith("video/") && (
            <video
              src={file.url}
              controls
              className="max-w-full max-h-[calc(90vh-200px)] rounded"
              autoPlay
            >
              Your browser does not support the video tag.
            </video>
          )}
          {file.mimetype.startsWith("audio/") && (
            <div className="p-5 w-full">
              <audio src={file.url} controls className="w-full" autoPlay>
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>

        {/* Footer with Actions & Info */}
        <div className="p-3 sm:p-4 border-t border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 min-h-[70px]">
          <div className="text-xs sm:text-sm text-gray-400 space-y-0.5">
            <p>
              Type:{" "}
              <span className="text-gray-200 font-medium">{file.mimetype}</span>
            </p>
            {file.isPrivate ? (
              <p className="text-yellow-400 font-semibold">
                Status: Private File
              </p>
            ) : (
              <p className="text-green-400 font-semibold">
                Status: Public File
              </p>
            )}
            {file.created && (
              <p>
                Uploaded:{" "}
                <span className="text-gray-200">
                  {new Date(file.created).toLocaleDateString()}
                </span>
              </p>
            )}
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm flex items-center gap-1.5 sm:gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download
            </button>
            <button
              onClick={handleDeleteClick}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm flex items-center gap-1.5 sm:gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
