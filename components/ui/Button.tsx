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
  const baseClasses = 'px-6 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800',
    secondary: 'bg-[var(--background-secondary)] text-[var(--foreground)] border-2 border-[var(--border-default)] hover:bg-[var(--background-tertiary)] focus:ring-blue-500',
    disabled: 'bg-[var(--background-tertiary)] text-[var(--text-tertiary)] cursor-not-allowed',
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

