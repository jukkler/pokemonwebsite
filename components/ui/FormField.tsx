/**
 * FormField Komponente
 * Wiederverwendbares Formularfeld mit Label
 */

import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function FormField({ 
  label, 
  required = false, 
  children,
  className = '' 
}: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && '*'}
      </label>
      {children}
    </div>
  );
}

// Select-Komponente
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
  focusColor?: string;
}

export function Select({ 
  options, 
  placeholder = '-- Auswählen --',
  focusColor = 'focus:ring-blue-500',
  className = '',
  ...props 
}: SelectProps) {
  return (
    <select
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${focusColor} ${className}`}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// Textarea-Komponente
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  focusColor?: string;
}

export function Textarea({ 
  focusColor = 'focus:ring-blue-500',
  className = '',
  ...props 
}: TextareaProps) {
  return (
    <textarea
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${focusColor} ${className}`}
      {...props}
    />
  );
}
