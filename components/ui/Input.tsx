/**
 * Input-Komponente
 * Placeholder, Active, Filled, Error States
 */

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  label?: string;
}

export default function Input({
  error = false,
  label,
  className = '',
  ...props
}: InputProps) {
  const baseClasses = 'min-h-11 w-full border bg-[var(--background-secondary)] px-4 py-3 text-[var(--foreground)] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1';
  
  const stateClasses = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
    : 'border-[var(--border-default)] focus:border-[var(--brand-blue)] focus:ring-[var(--brand-blue)]';

  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-xs font-extrabold uppercase tracking-[0.06em] text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <input
        className={`${baseClasses} ${stateClasses} ${className}`}
        {...props}
      />
    </div>
  );
}

