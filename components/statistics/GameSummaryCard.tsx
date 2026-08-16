import type { GameOverview, RunSummary } from './types';
import { gameFilterKey, gameName } from './types';

interface GameSummaryCardProps {
  game: GameOverview;
  runs: RunSummary[];
  selected: boolean;
  onSelect: (gameKey: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  active: 'border-cyan-500/50 bg-cyan-500/15 text-cyan-800 dark:text-cyan-200',
  failed: 'border-rose-500/40 bg-rose-500/15 text-rose-800 dark:text-rose-200',
  completed: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'LIVE',
  failed: 'Verloren',
  completed: 'Gewonnen',
};

export function GameSummaryCard({ game, runs, selected, onSelect }: GameSummaryCardProps) {
  const gameKey = gameFilterKey(game.gameVersion);
  const visibleRuns = runs.slice(0, 12);
  const hiddenRuns = Math.max(0, game.runCount - visibleRuns.length);

  return (
    <button
      type="button"
      onClick={() => onSelect(gameKey)}
      aria-pressed={selected}
      className={`group w-full border-b border-r p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] ${
        selected
          ? 'border-red-600 bg-red-500/[0.06]'
          : 'border-[var(--border-default)] bg-[var(--card-bg)] hover:bg-[var(--background-secondary)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            {game.gameVersion ? `Generation ${game.gameVersion.generation}` : 'Nicht zugeordnet'}
          </p>
          <h3 className="mt-1 text-lg font-bold text-[var(--foreground)]">
            {gameName(game.gameVersion)}
          </h3>
        </div>
        <span className="app-status tabular-nums">
          {game.runCount} Run{game.runCount === 1 ? '' : 's'}
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-2">
        <div>
          <dt className="text-[11px] text-[var(--text-tertiary)]">Gefangen</dt>
          <dd className="mt-0.5 text-base font-bold tabular-nums text-[var(--foreground)]">{game.caughtCount}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-[var(--text-tertiary)]">K.O.</dt>
          <dd className="mt-0.5 text-base font-bold tabular-nums text-rose-700 dark:text-rose-300">{game.knockedOutCount}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-[var(--text-tertiary)]">Nicht gefangen</dt>
          <dd className="mt-0.5 text-base font-bold tabular-nums text-amber-700 dark:text-amber-300">{game.notCaughtCount}</dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-[var(--border-default)] pt-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-[var(--text-secondary)]">Run-Verlauf</span>
          {hiddenRuns > 0 && <span className="text-[var(--text-tertiary)]">+{hiddenRuns} weitere</span>}
        </div>
        {visibleRuns.length > 0 ? (
          <div className="flex flex-wrap gap-1.5" aria-label={`Run-Verlauf für ${gameName(game.gameVersion)}`}>
            {visibleRuns.map((run) => (
              <span
                key={run.id}
                title={`Run ${run.runNumber}: ${STATUS_LABELS[run.status] || run.status}`}
                className={`rounded-md border px-2 py-1 text-[10px] font-bold tabular-nums ${
                  STATUS_STYLES[run.status] || 'border-[var(--border-default)] text-[var(--text-secondary)]'
                }`}
              >
                {run.status === 'active' ? 'LIVE' : `#${run.runNumber} ${run.status === 'failed' ? '×' : '✓'}`}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--text-tertiary)]">Run-Verlauf wird in der Historie angezeigt.</p>
        )}
      </div>
    </button>
  );
}
