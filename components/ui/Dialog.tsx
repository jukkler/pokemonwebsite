/**
 * Dialog Komponente
 * Modal-Dialog für Bestätigungen und Formulare
 * Nutzt React Portal für korrekte Positionierung über allen Elementen
 */

'use client';

import React from 'react';
import { createPortal } from 'react-dom';
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
  titleColor = 'text-[var(--foreground)]',
  description,
  children,
  actions,
}: DialogProps) {
  const canUsePortal = typeof document !== 'undefined';
  if (!isOpen || !canUsePortal) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--brand-navy)]/78 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md border border-[var(--border-default)] bg-[var(--card-bg-elevated)]">
        <h2 className={`mb-0 bg-[var(--brand-navy)] px-6 py-4 font-[var(--font-display)] text-2xl font-black uppercase tracking-[-0.03em] text-white ${titleColor}`}>
          {titleIcon && <span className="mr-2">{titleIcon}</span>}
          {title}
        </h2>

        {description && (
          <p className="px-6 pt-5 text-[var(--text-secondary)]">{description}</p>
        )}

        <div className="space-y-4 px-6 py-5">
          {children}
        </div>

        {actions && (
          <div className="flex justify-end gap-2 border-t border-[var(--border-default)] px-6 py-4">
            {actions}
          </div>
        )}
      </div>
    </div>,
    document.body,
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
