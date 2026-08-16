'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { Pokemon } from '@/lib/types';

const PokemonRadarChart = dynamic(() => import('@/components/PokemonRadarChart'), {
  ssr: false,
  loading: () => (
    <div className="h-80 animate-pulse bg-[var(--background-tertiary)]" aria-label="Radar-Profil wird geladen" />
  ),
});

interface RadarProfileDisclosureProps {
  pokemon: Pokemon[];
  colors?: readonly string[];
}

export default function RadarProfileDisclosure({
  pokemon,
  colors,
}: RadarProfileDisclosureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = 'pokemon-radar-profile-panel';

  return (
    <section className="app-section overflow-hidden p-0">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="app-section-title flex min-h-16 w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-[var(--background-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-600 md:px-5"
      >
        <span>
          <span className="block text-lg font-black uppercase tracking-[-0.02em] text-[var(--foreground)] md:text-xl">
            Profilansicht
          </span>
          <span className="mt-0.5 block text-sm text-[var(--text-secondary)]">
            Radar-Darstellung aller sechs Einzelwerte
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]">
          {isOpen ? 'Einklappen' : 'Öffnen'}
          <svg
            aria-hidden="true"
            className={`size-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {isOpen ? (
        <div id={panelId} className="border-t border-[var(--border-default)] px-3 py-4 md:px-5">
          <PokemonRadarChart pokemon={pokemon} colors={colors} />
        </div>
      ) : null}
    </section>
  );
}
