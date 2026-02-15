'use client';

/**
 * Bento Grid Layout System
 * Moderne Card-basierte Layouts mit variablen Größen
 */

import { ReactNode } from 'react';
import { hexToRgb } from '@/lib/design-tokens';

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * Bento Grid Container
 * Responsive Grid: 1 Spalte (mobile) → 2 Spalten (tablet) → 3 Spalten (desktop)
 */
export function BentoGrid({ children, className = '' }: BentoGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ${className}`}>
      {children}
    </div>
  );
}

interface BentoCardProps {
  children: ReactNode;
  variant?: 'default' | 'glass' | 'elevated';
  playerColor?: string;
  span?: { sm?: number; md?: number; lg?: number };
  className?: string;
}

/**
 * Bento Card
 * Flexible Card-Komponente mit Varianten und Player-Color-Support
 */
export function BentoCard({
  children,
  variant = 'default',
  playerColor,
  span = {},
  className = ''
}: BentoCardProps) {
  // Span Classes (Tailwind safelist erforderlich oder inline styles)
  const spanClasses = [
    span.sm && `col-span-${span.sm}`,
    span.md && `md:col-span-${span.md}`,
    span.lg && `lg:col-span-${span.lg}`,
  ].filter(Boolean).join(' ');

  // Variant Styling
  const variantClasses = {
    default: 'bg-[var(--card-bg)] border border-[var(--border-default)]',
    glass: 'bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)]',
    elevated: 'bg-[var(--card-bg-elevated)] border border-[var(--border-default)]',
  };

  // Player Color als CSS Variables
  const playerColorStyle = playerColor ? {
    '--player-color': playerColor,
    '--player-color-rgb': hexToRgb(playerColor),
  } as React.CSSProperties : {};

  return (
    <div
      className={`rounded-[16px] p-5 transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(var(--player-color-rgb),0.2)] ${variantClasses[variant]} ${spanClasses} ${className}`}
      style={playerColorStyle}
    >
      {children}
    </div>
  );
}

interface BentoKPICardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  playerColor?: string;
  className?: string;
}

/**
 * Bento KPI Card
 * Spezialisierte Card für Key Performance Indicators
 * Zeigt große Zahl mit Label und optionalem Icon
 */
export function BentoKPICard({ label, value, icon, playerColor, className = '' }: BentoKPICardProps) {
  return (
    <BentoCard playerColor={playerColor} className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-[var(--text-secondary)] mb-2 font-medium">{label}</p>
          <p className="text-4xl font-bold text-[var(--foreground)] tabular-nums">{value}</p>
        </div>
        {icon && (
          <div className="text-[var(--player-color)] opacity-20 text-4xl ml-4">
            {icon}
          </div>
        )}
      </div>
    </BentoCard>
  );
}

interface BentoChartCardProps {
  title: string;
  children: ReactNode;
  span?: { sm?: number; md?: number; lg?: number };
  className?: string;
}

/**
 * Bento Chart Card
 * Spezialisierte Card für Charts und Visualisierungen
 */
export function BentoChartCard({ title, children, span, className = '' }: BentoChartCardProps) {
  return (
    <BentoCard span={span} className={className}>
      <h2 className="text-2xl font-bold mb-6 text-[var(--foreground)]">
        {title}
      </h2>
      {children}
    </BentoCard>
  );
}
