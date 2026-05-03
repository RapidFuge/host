import React from "react";

interface ToggleProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  id?: string;
  disabled?: boolean;
}

export default function Toggle({ checked, onChange, label, id, disabled }: ToggleProps) {
  const toggleId = id || label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label htmlFor={toggleId} className="flex items-center gap-2.5 cursor-pointer select-none">
      <div className="relative">
        <input type="checkbox" id={toggleId} checked={checked} onChange={onChange} disabled={disabled} className="sr-only peer" />
        <div className="w-8 h-[18px] rounded-full bg-surface-hover border border-[var(--border-subtle)] peer-checked:bg-blue-600/30 peer-checked:border-blue-500/40 transition-colors" />
        <div className="absolute top-[2px] left-[2px] w-[14px] h-[14px] rounded-full bg-[var(--text-muted)] peer-checked:bg-blue-500 peer-checked:translate-x-[14px] transition-all" />
      </div>
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
    </label>
  );
}
