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
  const baseClasses = 'w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1';
  
  const stateClasses = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 focus:border-gray-700 focus:ring-gray-500';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
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

