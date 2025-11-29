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
        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 bg-white text-left flex items-center justify-between hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        style={selectedOption?.color ? { borderColor: selectedOption.color, backgroundColor: selectedOption.color + '20' } : {}}
      >
        <span className={selectedOption?.color ? 'font-semibold' : 'text-gray-500'}>
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
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                value === option.value ? 'bg-blue-50 font-semibold' : ''
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

