import React, { useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Copy, Check } from "lucide-react";

interface QRModalProps {
  url: string;
  label: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function QRModal({ url, label, isOpen, onClose }: QRModalProps) {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-xs flex flex-col glass-strong rounded-md border border-[var(--border-default)] shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--border-subtle)]">
          <span className="text-sm font-medium text-[var(--text-primary)] truncate">{label}</span>
          <button onClick={onClose} className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-col items-center gap-4 p-6">
          <div className="bg-white rounded-md p-3">
            <QRCodeSVG value={url} size={180} level="M" />
          </div>
          <div className="flex items-center gap-2 w-full">
            <input
              readOnly
              value={url}
              className="flex-1 px-2.5 py-1.5 text-xs rounded-md bg-surface-elevated border border-[var(--border-subtle)] text-[var(--text-secondary)] font-mono truncate"
            />
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md bg-surface-elevated border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
