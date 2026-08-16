/**
 * Button-Komponente
 * Primary, Secondary und Disabled Varianten
 */

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'disabled';
  children: React.ReactNode;
  className?: string;
}

export default function Button({
  variant = 'primary',
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex min-h-11 items-center justify-center border px-5 py-2.5 text-sm font-extrabold uppercase tracking-[0.035em] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white hover:border-[var(--brand-navy)] hover:bg-[var(--brand-navy)] focus:ring-[var(--brand-blue)] active:bg-[var(--brand-navy)]',
    secondary: 'border-[var(--border-default)] bg-[var(--background-secondary)] text-[var(--foreground)] hover:border-[var(--brand-navy)] hover:bg-[var(--background-tertiary)] focus:ring-[var(--brand-blue)]',
    disabled: 'cursor-not-allowed border-[var(--border-default)] bg-[var(--background-tertiary)] text-[var(--text-tertiary)]',
  };

  const isDisabled = disabled || variant === 'disabled';
  const finalVariant = isDisabled ? 'disabled' : variant;

  return (
    <button
      className={`${baseClasses} ${variantClasses[finalVariant]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {children}
    </button>
  );
}

