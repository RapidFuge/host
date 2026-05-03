import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl" };

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60" />
      <div className={`relative w-full ${sizeClasses[size]} glass-strong rounded-md border border-[var(--border-default)] shadow-xl`}>
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
            <button onClick={onClose} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
