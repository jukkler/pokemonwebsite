/**
 * Dialog Komponente
 * Modal-Dialog für Bestätigungen und Formulare
 */

import React from 'react';
import Button from './Button';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  titleIcon?: string;
  titleColor?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function Dialog({
  isOpen,
  onClose,
  title,
  titleIcon,
  titleColor = 'text-gray-900',
  description,
  children,
  actions,
}: DialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
        <h2 className={`text-2xl font-semibold mb-4 ${titleColor}`}>
          {titleIcon && <span className="mr-2">{titleIcon}</span>}
          {title}
        </h2>
        
        {description && (
          <p className="text-gray-600 mb-4">{description}</p>
        )}
        
        <div className="space-y-4">
          {children}
        </div>

        {actions && (
          <div className="flex gap-2 justify-end mt-6">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// Vordefinierte Dialog-Aktionen
interface DialogActionsProps {
  onCancel: () => void;
  onConfirm: () => void;
  cancelText?: string;
  confirmText?: string;
  confirmVariant?: 'primary' | 'danger' | 'warning';
  isLoading?: boolean;
  disabled?: boolean;
}

export function DialogActions({
  onCancel,
  onConfirm,
  cancelText = 'Abbrechen',
  confirmText = 'Bestätigen',
  confirmVariant = 'primary',
  isLoading = false,
  disabled = false,
}: DialogActionsProps) {
  const confirmColors = {
    primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
  };

  return (
    <>
      <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
        {cancelText}
      </Button>
      <Button 
        variant="primary" 
        onClick={onConfirm} 
        disabled={isLoading || disabled}
        className={confirmColors[confirmVariant]}
      >
        {isLoading ? 'Wird gesetzt...' : confirmText}
      </Button>
    </>
  );
}
