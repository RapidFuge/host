// components/dashboard/FileModal.tsx
import Link from "next/link";
import React, { useEffect } from "react";

export interface ModalFileItem {
  id: string;
  filename: string;
  extension: string;
  mimetype: string;
  url: string;
  openURL: string;
  isPrivate: boolean;
  created?: Date;
}

interface FileModalProps {
  file: ModalFileItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (fileId: string) => Promise<void>;
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
      document.body.style.overflow = "hidden";
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
  };
  const handleDeleteClick = () => {
    onDelete(file.id);
  };
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
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
      <div className="bg-neutral-800 text-zinc-100 rounded-md shadow-xl w-full max-w-2xl lg:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-neutral-700 min-h-[60px]">
          <Link
            id="file-modal-title"
            className="text-lg sm:text-xl font-semibold truncate text-blue-400 hover:underline"
            title={file.filename}
            href={file.openURL}
          >
            {file.filename}
          </Link>{" "}
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-700 transition-colors"
            aria-label="Close modal"
          >
            {" "}
            {/* neutral */}
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
        <div className="p-2 sm:p-4 flex-grow overflow-y-auto flex justify-center items-center bg-neutral-900 min-h-[200px]">
          {" "}
          {/* neutral */}
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
        <div className="p-3 sm:p-4 border-t border-neutral-700 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 min-h-[70px]">
          {" "}
          {/* neutral border */}
          <div className="text-xs sm:text-sm text-neutral-400 space-y-0.5">
            {" "}
            {/* neutral */}
            <p>
              Type:{" "}
              <span className="text-zinc-200 font-medium">{file.mimetype}</span>
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
                <span className="text-zinc-200">
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
