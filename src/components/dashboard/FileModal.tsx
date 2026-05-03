import Link from "next/link";
import React, { useEffect, useState } from "react";
import { X, Download, Trash2, QrCode } from "lucide-react";
import { formatTimeRemaining } from "@lib";
import QRModal from "@components/QRModal";

export interface ModalFileItem {
  id: string;
  filename: string;
  publicFileName?: string;
  extension: string;
  mimetype: string;
  url: string;
  openURL: string;
  isPrivate: boolean;
  created?: Date;
  expiresAt?: Date;
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
  const [showRelativeTime, setShowRelativeTime] = useState(true);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  const expiresAt = file.expiresAt ? new Date(file.expiresAt).toISOString() : null;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = file.url;
    link.setAttribute("download", file.publicFileName ?? file.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col glass-strong rounded-md border border-[var(--border-default)] shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-between items-center px-5 py-3 border-b border-[var(--border-subtle)]">
          <Link
            className="text-sm font-semibold truncate text-blue-400 hover:underline"
            href={file.openURL}
          >
            {file.publicFileName ?? file.filename}
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex justify-center items-center bg-surface-primary/50 p-4 min-h-[200px]">
          {file.mimetype.startsWith("image/") && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={file.url}
              alt={file.publicFileName ?? file.filename}
              className="max-w-full max-h-[calc(90vh-200px)] object-contain rounded-md"
            />
          )}
          {file.mimetype.startsWith("video/") && (
            <video
              src={file.url}
              controls
              className="max-w-full max-h-[calc(90vh-200px)] rounded-md"
              autoPlay
            >
              Your browser does not support the video tag.
            </video>
          )}
          {file.mimetype.startsWith("audio/") && (
            <div className="p-6 w-full">
              <audio src={file.url} controls className="w-full" autoPlay>
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-[var(--text-muted)] space-y-0.5">
            <p>
              ID: <span className="text-[var(--text-secondary)] font-mono">{file.id}</span>
            </p>
            <p>
              Type: <span className="text-[var(--text-secondary)]">{file.mimetype}</span>
            </p>
            {file.created && (
              <p>
                Uploaded: <span className="text-[var(--text-secondary)]">{new Date(file.created).toLocaleString()}</span>
              </p>
            )}
            {expiresAt && (
              <p>
                Expires:{" "}
                <button className="text-[var(--text-secondary)] hover:underline" onClick={() => setShowRelativeTime(p => !p)}>
                  {showRelativeTime ? formatTimeRemaining(expiresAt) : new Date(expiresAt).toLocaleString()}
                </button>
              </p>
            )}
            <p className={file.isPrivate ? "text-yellow-400/80" : "text-emerald-400/80"}>
              {file.isPrivate ? "Private" : "Public"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowQR(true)}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-surface-elevated text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors flex items-center gap-1.5"
            >
              <QrCode className="h-3.5 w-3.5" /> QR
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </button>
            <button
              onClick={() => onDelete(file.id)}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>
      {typeof window !== "undefined" && (
        <QRModal
          url={`${window.location.origin}${file.openURL}`}
          label={file.publicFileName ?? file.filename}
          isOpen={showQR}
          onClose={() => setShowQR(false)}
        />
      )}
    </div>
  );
}
