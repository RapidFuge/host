import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-3 py-2 rounded-md text-sm
            bg-surface-secondary border border-[var(--border-subtle)]
            text-[var(--text-primary)] placeholder-[var(--text-muted)]
            transition-colors duration-150
            focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20
            disabled:opacity-40 disabled:cursor-not-allowed
            ${error ? "border-red-500/50" : ""}
            ${className}
          `}
          {...props}
        />
        {hint && !error && <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>}
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
