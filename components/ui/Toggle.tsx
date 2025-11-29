/**
 * Toggle Switch-Komponente
 * Blau/Grau Toggle mit rounded track
 */

'use client';

import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
}: ToggleProps) {
  return (
    <label className={`flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`w-11 h-6 rounded-full transition-colors duration-200 ${
            checked ? 'bg-blue-600' : 'bg-gray-300'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
              checked ? 'transform translate-x-5' : 'transform translate-x-0'
            }`}
          />
        </div>
      </div>
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
    </label>
  );
}

