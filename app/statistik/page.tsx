import { Suspense } from 'react';
import StatistikClient from './StatistikClient';

function StatistikFallback() {
  return (
    <div className="app-page" aria-busy="true">
      <div className="app-page-header mb-8 h-20 animate-pulse bg-[var(--card-bg)]" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse border border-[var(--border-default)] bg-[var(--card-bg)]"
          />
        ))}
      </div>
      <p className="sr-only">Statistiken werden geladen.</p>
    </div>
  );
}

export default function StatistikPage() {
  return (
    <Suspense fallback={<StatistikFallback />}>
      <StatistikClient />
    </Suspense>
  );
}
