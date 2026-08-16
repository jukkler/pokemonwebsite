/**
 * Dropdown-Komponente
 * Für Typ-Filter und Sortierung
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';

interface DropdownOption {
  value: string;
  label: string;
  color?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Auswählen...',
  className = '',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex min-h-11 w-full items-center justify-between border border-[var(--border-default)] bg-[var(--background-secondary)] px-4 py-3 text-left text-[var(--foreground)] transition-colors hover:border-[var(--brand-navy)] focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]"
        style={selectedOption?.color ? { borderColor: selectedOption.color, backgroundColor: selectedOption.color + '20' } : {}}
      >
        <span className={selectedOption?.color ? 'font-semibold' : 'text-[var(--text-secondary)]'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto border border-[var(--border-default)] bg-[var(--card-bg-elevated)]">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full px-4 py-3 text-left text-[var(--foreground)] transition-colors hover:bg-[var(--background-secondary)] ${
                value === option.value ? 'bg-[var(--background-tertiary)] font-semibold' : ''
              }`}
              style={option.color ? { color: option.color } : {}}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

