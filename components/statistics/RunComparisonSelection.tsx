'use client';

import type { RunSummary } from './types';
import { gameName } from './types';

export interface RunComparisonTrayProps {
  selectedRunIds: number[];
  selectedRuns?: RunSummary[];
  loading?: boolean;
  openDisabled?: boolean;
  onRemove: (runId: number) => void;
  onClear: () => void;
  onOpen: () => void;
}

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Datum nicht erfasst' : dateFormatter.format(date);
}

function RemoveIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function DirectionIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M4 10h12m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SelectedRun({ run, side, onRemove }: { run: RunSummary; side: 'A' | 'B'; onRemove: () => void }) {
  return (
    <article className="flex min-h-24 items-center gap-3 border border-[var(--border-default)] bg-[var(--card-bg-elevated)] p-3.5">
      <span className={`grid h-9 w-9 shrink-0 place-items-center text-sm font-black ${side === 'A' ? 'bg-red-600 text-white' : 'bg-[var(--brand-navy,#071a33)] text-white'}`}>
        {side}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-[var(--foreground)]">Run #{run.runNumber}</p>
        <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">{gameName(run.gameVersion)}</p>
        <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">{formatDate(run.endedAt || run.startedAt)}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Run #${run.runNumber} aus dem Vergleich entfernen`}
        data-testid={`run-comparison-remove-${side === 'A' ? 'left' : 'right'}`}
        className="grid h-11 w-11 shrink-0 place-items-center text-[var(--text-secondary)] transition-colors hover:bg-[var(--background-tertiary)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
      >
        <RemoveIcon />
      </button>
    </article>
  );
}

function EmptySlot({ side, runId }: { side: 'A' | 'B'; runId?: number }) {
  return (
    <div className="flex min-h-24 items-center gap-3 border border-dashed border-[var(--border-default)] px-3.5 text-[var(--text-tertiary)]">
      <span className="grid h-9 w-9 shrink-0 place-items-center border border-current text-sm font-black">{side}</span>
      <p className="text-sm">{runId ? `Run-ID ${runId} wird geladen …` : 'Noch einen Run aus der Historie wählen'}</p>
    </div>
  );
}

export function RunComparisonTray({
  selectedRunIds,
  selectedRuns,
  loading = false,
  openDisabled = false,
  onRemove,
  onClear,
  onOpen,
}: RunComparisonTrayProps) {
  if (selectedRunIds.length === 0) return null;

  const firstId = selectedRunIds[0];
  const secondId = selectedRunIds[1];
  const first = selectedRuns?.find((run) => run.id === firstId);
  const second = selectedRuns?.find((run) => run.id === secondId);
  const ready = Boolean(firstId && secondId);

  return (
    <section
      data-testid="run-comparison-tray"
      aria-labelledby="run-comparison-selection-title"
      className="border-l-4 border-red-600 bg-[var(--background-secondary)] p-4 md:p-5"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h2 id="run-comparison-selection-title" className="font-bold text-[var(--foreground)]">Runs vergleichen</h2>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
            {ready ? 'Run A ist die Basis für alle angezeigten Deltas.' : 'Wähle einen zweiten Run aus der Historie.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          data-testid="run-comparison-clear"
          className="app-action min-h-11 self-start"
        >
          Auswahl leeren
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_2.75rem_minmax(0,1fr)] sm:items-center">
        {first ? <SelectedRun run={first} side="A" onRemove={() => onRemove(first.id)} /> : <EmptySlot side="A" runId={firstId} />}
        <span className="mx-auto grid h-11 w-11 place-items-center text-[var(--text-tertiary)]" aria-hidden="true"><DirectionIcon /></span>
        {second ? <SelectedRun run={second} side="B" onRemove={() => onRemove(second.id)} /> : <EmptySlot side="B" runId={secondId} />}
      </div>

      <button
        type="button"
        onClick={onOpen}
        disabled={!ready || loading || openDisabled}
        data-testid="run-comparison-open"
        className="app-action app-action-primary mt-4 min-h-11 w-full disabled:cursor-not-allowed disabled:bg-[var(--background-tertiary)] disabled:text-[var(--text-tertiary)]"
      >
        {loading ? 'Vergleich wird geladen …' : ready ? 'Vergleich öffnen' : 'Zwei Runs auswählen'}
      </button>
    </section>
  );
}

export const RunComparisonSelection = RunComparisonTray;
