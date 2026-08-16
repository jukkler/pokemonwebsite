import type { GameVersion, RunTrendPoint } from './types';
import { gameFilterKey, gameName } from './types';

interface RunTrendsProps {
  runs: RunTrendPoint[];
}

interface TrendGroup {
  gameVersion: GameVersion | null;
  runs: RunTrendPoint[];
}

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

function coverageLabel(run: RunTrendPoint): string {
  if (run.detailCoverage.status === 'live') return 'Live-Daten';
  if (run.detailCoverage.status === 'missing') return 'Snapshot fehlt';
  if (run.detailCoverage.status === 'complete') return 'Details vollständig';
  return `${run.detailCoverage.documented ?? 0}/${run.detailCoverage.total ?? 0} Details`;
}

function statusLabel(status: string): string {
  if (status === 'active') return 'Aktiv';
  if (status === 'completed') return 'Gewonnen';
  if (status === 'failed') return 'Verloren';
  return status;
}

function groupRuns(runs: RunTrendPoint[]): TrendGroup[] {
  const groups = new Map<string, TrendGroup>();
  for (const run of runs) {
    const key = gameFilterKey(run.gameVersion);
    const group = groups.get(key) ?? { gameVersion: run.gameVersion, runs: [] };
    group.runs.push(run);
    groups.set(key, group);
  }
  return Array.from(groups.values());
}

function RunTrendRow({ run }: { run: RunTrendPoint }) {
  const hasSnapshot = run.sampleSize !== null;
  const hasEncounters = (run.sampleSize ?? 0) > 0;
  const sampleSize = Math.max(run.sampleSize ?? 0, 1);
  const caughtWidth = hasEncounters
    ? ((run.caughtCount ?? 0) / sampleSize) * 100
    : 0;
  const missedWidth = hasEncounters
    ? ((run.notCaughtCount ?? 0) / sampleSize) * 100
    : 0;
  const coverageTone = run.detailCoverage.status === 'missing'
    ? 'border-amber-400/30 bg-amber-500/[0.08] text-amber-200'
    : run.detailCoverage.status === 'partial'
      ? 'border-amber-400/25 bg-amber-500/[0.06] text-amber-200'
      : run.detailCoverage.status === 'live'
        ? 'border-cyan-400/25 bg-cyan-500/[0.07] text-cyan-200'
        : 'border-emerald-400/20 bg-emerald-500/[0.06] text-emerald-200';

  return (
    <article className="border-b border-[var(--border-default)] bg-[var(--card-bg-elevated)] p-4 last:border-b-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold text-[var(--foreground)]">Run {run.runNumber}</h4>
            <span className="app-status px-2 py-0.5">
              {statusLabel(run.status)}
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Gestartet am {formatDate(run.startedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="app-status tabular-nums">
            {hasSnapshot ? `Stichprobe n=${run.sampleSize}` : 'Stichprobe unbekannt'}
          </span>
          <span className={`app-status border px-2.5 py-1 font-semibold ${coverageTone}`}>
            {coverageLabel(run)}
          </span>
        </div>
      </div>

      {!hasSnapshot ? (
        <div className="mt-4 border border-dashed border-amber-400/30 bg-amber-500/[0.04] px-3 py-3 text-sm text-amber-800 dark:text-amber-100/85">
          Für diesen älteren Run ist kein Encounter-Snapshot vorhanden. Fangquote und K.O.-Werte bleiben deshalb offen.
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              Fangquote: {run.catchRate === null ? '–' : `${run.catchRate} %`}
            </p>
            <p className="text-xs tabular-nums text-[var(--text-secondary)]">
              <span className="text-emerald-300">{run.caughtCount} gefangen</span>
              <span aria-hidden="true" className="mx-1.5 text-[var(--text-tertiary)]">·</span>
              <span className="text-amber-300">{run.notCaughtCount} verpasst</span>
              <span aria-hidden="true" className="mx-1.5 text-[var(--text-tertiary)]">·</span>
              <span className="text-rose-300">{run.knockedOutCount} K.O.</span>
            </p>
          </div>

          {hasEncounters ? (
            <div
              className="mt-2 flex h-3 overflow-hidden bg-[var(--background-tertiary)]"
              role="img"
              aria-label={`${run.caughtCount} von ${run.sampleSize} Begegnungen gefangen, ${run.notCaughtCount} nicht gefangen. ${run.knockedOutCount} K.O.`}
            >
              <div className="h-full bg-emerald-400" style={{ width: `${caughtWidth}%` }} />
              <div className="h-full bg-amber-400" style={{ width: `${missedWidth}%` }} />
            </div>
          ) : (
            <p className="mt-2 bg-[var(--background-tertiary)] px-3 py-2 text-xs text-[var(--text-tertiary)]">
              Im laufenden Run wurden noch keine Begegnungen erfasst.
            </p>
          )}

          {run.detailCoverage.status === 'partial' && (
            <p className="mt-2 text-xs leading-5 text-amber-100/75">
              Die Ausgänge sind dokumentiert; bei älteren Einträgen fehlen teilweise Detailzeitpunkte.
            </p>
          )}
        </div>
      )}
    </article>
  );
}

export function RunTrends({ runs }: RunTrendsProps) {
  const groups = groupRuns(runs);

  return (
    <section className="app-section p-4 md:p-6" aria-labelledby="run-trends-title">
      <div className="app-section-title flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 id="run-trends-title" className="text-xl font-black uppercase tracking-[-0.02em] text-[var(--foreground)]">Begegnungen von Run zu Run</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Chronologisch, mit direkten Werten – ohne Glättung oder geschätzte Nullwerte.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]" aria-label="Legende">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 bg-emerald-500" aria-hidden="true" />✓ Gefangen</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 bg-amber-500" aria-hidden="true" />× Nicht gefangen</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 bg-rose-500" aria-hidden="true" />† K.O. separat</span>
        </div>
      </div>

      {groups.length > 0 ? (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={gameFilterKey(group.gameVersion)} aria-labelledby={`trend-game-${gameFilterKey(group.gameVersion)}`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 id={`trend-game-${gameFilterKey(group.gameVersion)}`} className="font-bold text-[var(--foreground)]">
                  {gameName(group.gameVersion)}
                </h3>
                <span className="text-xs tabular-nums text-[var(--text-tertiary)]">
                  {group.runs.length} Run{group.runs.length === 1 ? '' : 's'} · alt → neu
                </span>
              </div>
              <div className="border-y border-[var(--border-default)]">
                {group.runs.map((run) => <RunTrendRow key={run.id} run={run} />)}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="border border-dashed border-[var(--border-default)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
          Für diesen Bereich liegen noch keine Runs vor.
        </p>
      )}
    </section>
  );
}
