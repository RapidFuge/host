import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className = "", id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`
            w-full px-3 py-2 rounded-md text-sm
            bg-surface-secondary border border-[var(--border-subtle)]
            text-[var(--text-primary)]
            transition-colors duration-150
            focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20
            disabled:opacity-40 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
