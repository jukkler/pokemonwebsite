import type { CSSProperties, ReactNode } from 'react';
import type { Pokemon } from '@/lib/types';

export const DEFAULT_COMPARISON_COLORS = [
  '#f59e0b',
  '#3b82f6',
  '#22c55e',
  '#a855f7',
  '#ef4444',
  '#06b6d4',
] as const;

const MARKER_TEXT_COLORS = [
  '#171717',
  '#ffffff',
  '#102814',
  '#ffffff',
  '#ffffff',
  '#10252a',
] as const;

export function getPokemonDisplayName(pokemon: Pokemon): string {
  return pokemon.nameGerman || pokemon.name;
}

export function getSeriesColor(index: number, colors?: readonly string[]): string {
  const palette = colors?.length ? colors : DEFAULT_COMPARISON_COLORS;
  return palette[index % palette.length];
}

export function SeriesMarker({
  index,
  colors,
  size = 'md',
  className = '',
}: {
  index: number;
  colors?: readonly string[];
  size?: 'sm' | 'md';
  className?: string;
}) {
  const color = getSeriesColor(index, colors);
  const textColor = colors?.length
    ? '#ffffff'
    : MARKER_TEXT_COLORS[index % MARKER_TEXT_COLORS.length];

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-[2px] font-black tabular-nums ${
        size === 'sm' ? 'size-5 text-[11px]' : 'size-7 text-sm'
      } ${className}`}
      style={{ backgroundColor: color, color: textColor }}
    >
      {index + 1}
    </span>
  );
}

export function ComparisonSection({
  title,
  description,
  action,
  children,
  className = '',
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`app-section p-4 md:p-5 ${className}`}
    >
      <div className="app-section-title flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black uppercase tracking-[-0.02em] text-[var(--foreground)] md:text-xl">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--text-secondary)] md:text-sm">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyComparisonState({ children }: { children: ReactNode }) {
  return (
    <div className="border border-dashed border-[var(--border-strong,var(--border-default))] bg-[var(--background-secondary)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
      {children}
    </div>
  );
}

export function colorBarStyle(color: string, width: number): CSSProperties {
  return {
    backgroundColor: color,
    width: `${Math.max(4, Math.min(width, 100))}%`,
  };
}
