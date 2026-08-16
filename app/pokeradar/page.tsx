import { Suspense } from 'react';
import PokeradarClient from './PokeradarClient';

function PokeradarFallback() {
  return (
    <div
      className="app-page"
      aria-busy="true"
      aria-label="Pokémon-Vergleich wird geladen"
    >
      <div className="app-page-header mb-5">
        <div className="h-12 w-72 max-w-full animate-pulse bg-[var(--background-tertiary)]" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-5">
          <div className="h-52 animate-pulse border border-[var(--border-default)] bg-[var(--card-bg)]" />
          <div className="h-96 animate-pulse border border-[var(--border-default)] bg-[var(--card-bg)]" />
        </div>
        <div className="hidden h-[40rem] animate-pulse border border-[var(--border-default)] bg-[var(--card-bg)] xl:block" />
      </div>
      <p className="sr-only" role="status">Pokémon-Daten werden geladen.</p>
    </div>
  );
}

export default function PokeradarPage() {
  return (
    <Suspense fallback={<PokeradarFallback />}>
      <PokeradarClient />
    </Suspense>
  );
}
