import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

const paddingClasses = { none: "", sm: "p-3", md: "p-4", lg: "p-5" };

export default function Card({ children, className = "", padding = "md", hover = false }: CardProps) {
  return (
    <div
      className={`
        bg-surface-elevated rounded-md border border-[var(--border-subtle)]
        ${paddingClasses[padding]}
        ${hover ? "transition-colors duration-150 hover:border-[var(--border-default)]" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
