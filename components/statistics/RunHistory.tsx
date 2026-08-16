'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useSpriteMode } from '@/lib/contexts/SpriteContext';
import type { HistoryGroup, RunDetailsResponse, RunEncounter, RunSummary } from './types';
import { gameFilterKey, gameName, getRunCounts } from './types';

interface RunHistoryProps {
  groups: HistoryGroup[];
  loadingMore: Set<string>;
  onLoadMore: (group: HistoryGroup) => void;
  selectedForComparison?: readonly number[];
  onToggleComparison?: (run: RunSummary) => void;
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktiv',
  failed: 'Verloren',
  completed: 'Gewonnen',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'border-cyan-500/50 bg-cyan-500/15 text-cyan-800 dark:text-cyan-200',
  failed: 'border-rose-500/40 bg-rose-500/15 text-rose-800 dark:text-rose-200',
  completed: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
};

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0 Min.';
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days} T ${hours} Std.`;
  if (hours > 0) return `${hours} Std. ${minutes} Min.`;
  return `${minutes} Min.`;
}

function runDuration(run: RunSummary): number {
  if (typeof run.durationMs === 'number') return Math.max(0, run.durationMs);
  const start = new Date(run.startedAt).getTime();
  const end = run.endedAt
    ? new Date(run.endedAt).getTime()
    : run.pausedAt
      ? new Date(run.pausedAt).getTime()
      : Date.now();
  return Math.max(0, end - start - (run.totalPausedMs || 0));
}

function formatDate(value: string | null | undefined, includeTime = false): string {
  if (!value) return 'Nicht erfasst';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Nicht erfasst';
  return new Intl.DateTimeFormat('de-DE', includeTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }).format(date);
}

function spriteUrl(pokedexId: number, animated: boolean): string {
  if (animated) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokedexId}.gif`;
  }
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokedexId}.png`;
}

function MetadataValue({ label, value }: { label: string; value: string | number | null | undefined }) {
  const present = value !== null && value !== undefined && value !== '';
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{label}</dt>
      <dd className={`mt-0.5 text-xs ${present ? 'text-[var(--foreground)]' : 'italic text-[var(--text-tertiary)]'}`}>
        {present ? value : 'Nicht erfasst'}
      </dd>
    </div>
  );
}

function EncounterCard({ encounter, animated }: { encounter: RunEncounter; animated: boolean }) {
  const status = encounter.isNotCaught ? 'Nicht gefangen' : encounter.isKnockedOut ? 'K.O.' : 'Im Run';
  const statusClass = encounter.isNotCaught
    ? 'border-amber-400/35 bg-amber-500/[0.07] text-amber-300'
    : encounter.isKnockedOut
      ? 'border-rose-400/35 bg-rose-500/[0.07] text-rose-300'
      : 'border-emerald-400/30 bg-emerald-500/[0.06] text-emerald-300';
  const eventDate = encounter.isNotCaught
    ? formatDate(encounter.notCaughtDate, true)
    : encounter.isKnockedOut
      ? formatDate(encounter.koDate, true)
      : formatDate(encounter.caughtAt || encounter.createdAt, true);

  return (
    <article className={`border p-3 ${statusClass}`}>
      <div className="flex gap-3">
        <div className="relative h-14 w-14 shrink-0">
          <Image
            src={spriteUrl(encounter.pokemonPokedexId, animated)}
            alt=""
            fill
            sizes="56px"
            className={`object-contain pixelated ${encounter.isNotCaught || encounter.isKnockedOut ? 'grayscale-[0.65]' : ''}`}
            unoptimized
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="truncate text-sm font-bold text-[var(--foreground)]">
                {encounter.nickname || encounter.pokemonNameGerman || encounter.pokemonName}
              </h4>
              {encounter.nickname && (
                <p className="truncate text-xs text-[var(--text-secondary)]">{encounter.pokemonNameGerman || encounter.pokemonName}</p>
              )}
            </div>
            <span className="shrink-0 rounded-full border border-current/30 px-2 py-0.5 text-[10px] font-bold">{status}</span>
          </div>
          <p className="mt-2 truncate text-xs text-[var(--text-secondary)]">{encounter.routeName}</p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-current/15 pt-3">
        <MetadataValue label="Spitzname" value={encounter.nickname} />
        <MetadataValue label="Team-Platz" value={encounter.teamSlot === null || encounter.teamSlot === undefined ? null : `Platz ${encounter.teamSlot}`} />
        <MetadataValue
          label={encounter.isNotCaught ? 'Nicht gefangen von' : encounter.isKnockedOut ? 'K.O. verursacht von' : 'Gefangen am'}
          value={encounter.isNotCaught ? encounter.notCaughtBy : encounter.isKnockedOut ? encounter.koCausedBy : eventDate}
        />
        <MetadataValue
          label={encounter.isNotCaught || encounter.isKnockedOut ? 'Zeitpunkt' : 'Route'}
          value={encounter.isNotCaught || encounter.isKnockedOut ? eventDate : encounter.routeName}
        />
        {(encounter.isNotCaught || encounter.isKnockedOut) && (
          <div className="col-span-2">
            <MetadataValue
              label="Grund"
              value={encounter.isNotCaught ? encounter.notCaughtReason : encounter.koReason}
            />
          </div>
        )}
      </dl>
    </article>
  );
}

function RunDetails({ details }: { details: RunDetailsResponse }) {
  const { spriteMode } = useSpriteMode();
  const grouped = details.encounters.reduce<Record<string, RunEncounter[]>>((result, encounter) => {
    (result[encounter.playerName] ||= []).push(encounter);
    return result;
  }, {});
  const playerNames = Array.from(new Set([
    ...details.playerStats.map((stats) => stats.playerName),
    ...Object.keys(grouped),
  ]));

  if (playerNames.length === 0) {
    return (
      <p className="border border-dashed border-[var(--border-default)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
        Für diesen Run wurden keine Begegnungen oder Spielerwerte gespeichert.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {details.isLive && (
        <p className="border border-cyan-400/30 bg-cyan-500/[0.07] px-4 py-3 text-sm text-cyan-800 dark:text-cyan-200">
          Live-Daten aus dem aktuell laufenden Run. Änderungen erscheinen nach dem Neuladen der Seite.
        </p>
      )}
      {playerNames.map((playerName) => {
        const encounters = grouped[playerName] || [];
        const stats = details.playerStats.find((entry) => entry.playerName === playerName);
        const caught = encounters.filter((encounter) => !encounter.isNotCaught).length;
        const knockedOut = encounters.filter((encounter) => encounter.isKnockedOut).length;
        const notCaught = encounters.filter((encounter) => encounter.isNotCaught).length;
        return (
          <section key={playerName} aria-labelledby={`player-${details.run.id}-${playerName}`}>
            <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <h3 id={`player-${details.run.id}-${playerName}`} className="font-bold text-[var(--foreground)]">{playerName}</h3>
                {stats?.isLoser && <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300">Run verloren</span>}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300">{caught} gefangen</span>
                <span className="rounded-full bg-rose-500/10 px-2 py-1 text-rose-300">{knockedOut} K.O.</span>
                <span className="rounded-full bg-amber-500/10 px-2 py-1 text-amber-300">{notCaught} nicht gefangen</span>
              </div>
            </div>
            {encounters.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {encounters.map((encounter) => (
                  <EncounterCard key={encounter.id} encounter={encounter} animated={spriteMode === 'animated'} />
                ))}
              </div>
            ) : (
              <p className="border border-dashed border-[var(--border-default)] px-4 py-5 text-sm text-[var(--text-secondary)]">
                Für {playerName} sind in diesem Run keine Begegnungen gespeichert.
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}

function RunRow({
  run,
  expanded,
  details,
  loading,
  error,
  selectedForComparison,
  comparisonDisabled,
  onToggle,
  onToggleComparison,
}: {
  run: RunSummary;
  expanded: boolean;
  details: RunDetailsResponse | undefined;
  loading: boolean;
  error: string | undefined;
  selectedForComparison: boolean;
  comparisonDisabled: boolean;
  onToggle: () => void;
  onToggleComparison: () => void;
}) {
  const counts = getRunCounts(run);
  const isLive = run.isLive ?? run.status === 'active';
  const contentId = `run-details-${run.id}`;

  return (
    <article className={`overflow-hidden border-b border-x bg-[var(--card-bg-elevated)] ${isLive ? 'border-cyan-500' : 'border-[var(--border-default)]'}`}>
      <div className="flex flex-col sm:flex-row sm:items-stretch">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={contentId}
          className="min-w-0 flex-1 p-4 text-left transition-colors hover:bg-[var(--background-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-600 md:p-5"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {isLive && <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/50 bg-cyan-500/15 px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-cyan-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />LIVE</span>}
              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[run.status] || 'border-[var(--border-default)] text-[var(--text-secondary)]'}`}>
                Run #{run.runNumber} · {STATUS_LABELS[run.status] || run.status}
              </span>
              {run.loserPlayerName && run.status === 'failed' && (
                <span className="text-xs text-[var(--text-secondary)]">Verloren von <strong className="text-[var(--foreground)]">{run.loserPlayerName}</strong></span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-xs text-[var(--text-secondary)] sm:grid-cols-5">
              <span><strong className="text-[var(--foreground)]">{counts.caught}</strong> gefangen</span>
              <span><strong className="text-rose-300">{counts.knockedOut}</strong> K.O.</span>
              <span><strong className="text-amber-300">{counts.notCaught}</strong> verpasst</span>
              <span><strong className="text-[var(--foreground)]">{formatDuration(runDuration(run))}</strong></span>
              <span className="flex items-center justify-between gap-3 sm:justify-start">
                <span>{formatDate(run.endedAt || run.startedAt)}</span>
                <svg className={`h-4 w-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
              </span>
            </div>
          </div>
        </button>
        <div className="flex items-center px-4 pb-4 sm:border-l sm:border-[var(--border-default)] sm:px-4 sm:py-3">
          <button
            type="button"
            data-testid={`run-compare-toggle-${run.id}`}
            aria-pressed={selectedForComparison}
            onClick={onToggleComparison}
            disabled={comparisonDisabled}
            className={`min-h-11 w-full border px-3 py-2 text-xs font-black uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:cursor-not-allowed disabled:opacity-45 sm:w-28 ${selectedForComparison ? 'border-red-600 bg-red-600 text-white' : 'border-[var(--border-default)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:border-red-600/50 hover:text-[var(--foreground)]'}`}
            aria-label={selectedForComparison ? `Run ${run.runNumber} aus dem Vergleich entfernen` : `Run ${run.runNumber} für den Vergleich auswählen`}
          >
            {selectedForComparison ? '✓ Ausgewählt' : 'Vergleichen'}
          </button>
        </div>
      </div>

      {expanded && (
        <div id={contentId} className="border-t border-[var(--border-default)] bg-[var(--background-secondary)] p-4 md:p-5">
          {loading && <p className="py-6 text-center text-sm text-[var(--text-secondary)]" role="status">Run-Details werden geladen …</p>}
          {error && (
            <div className="border border-rose-400/30 bg-rose-500/[0.07] px-4 py-4 text-sm text-rose-700 dark:text-rose-200" role="alert">
              {error} Schließe den Run und öffne ihn erneut, um es noch einmal zu versuchen.
            </div>
          )}
          {details && <RunDetails details={details} />}
        </div>
      )}
    </article>
  );
}

export function RunHistory({
  groups,
  loadingMore,
  onLoadMore,
  selectedForComparison = [],
  onToggleComparison = () => undefined,
}: RunHistoryProps) {
  const [expandedRun, setExpandedRun] = useState<number | null>(null);
  const [detailsCache, setDetailsCache] = useState<Record<number, RunDetailsResponse>>({});
  const [detailLoading, setDetailLoading] = useState<Set<number>>(new Set());
  const [detailErrors, setDetailErrors] = useState<Record<number, string>>({});

  async function toggleRun(run: RunSummary) {
    if (expandedRun === run.id) {
      setExpandedRun(null);
      return;
    }

    setExpandedRun(run.id);
    if (detailsCache[run.id] || detailLoading.has(run.id)) return;

    setDetailLoading((current) => new Set(current).add(run.id));
    setDetailErrors((current) => {
      const next = { ...current };
      delete next[run.id];
      return next;
    });

    try {
      const response = await fetch(`/api/runs/history/${run.id}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Details konnten nicht geladen werden.');
      const data = await response.json() as RunDetailsResponse;
      setDetailsCache((current) => ({ ...current, [run.id]: data }));
    } catch (error) {
      setDetailErrors((current) => ({
        ...current,
        [run.id]: error instanceof Error ? error.message : 'Details konnten nicht geladen werden.',
      }));
    } finally {
      setDetailLoading((current) => {
        const next = new Set(current);
        next.delete(run.id);
        return next;
      });
    }
  }

  if (groups.length === 0) {
    return (
      <section className="border border-[var(--border-default)] bg-[var(--card-bg)] p-8 text-center">
        <h2 className="text-lg font-bold text-[var(--foreground)]">Noch keine Runs in diesem Bereich</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Sobald ein Run gestartet wird, erscheint er hier.</p>
      </section>
    );
  }

  return (
    <div className="space-y-7">
      {groups.map((group) => {
        const key = gameFilterKey(group.gameVersion);
        const isLoadingMore = loadingMore.has(key);
        return (
          <section key={key} aria-labelledby={`history-${key}`}>
            <div className="app-player-rule mb-3 flex flex-col justify-between gap-2 px-3 py-2 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-red-600">
                  {group.gameVersion ? `Generation ${group.gameVersion.generation}` : 'Nicht zugeordnet'}
                </p>
                <h3 id={`history-${key}`} className="mt-1 text-xl font-black uppercase tracking-[-0.02em] text-[var(--foreground)]">{gameName(group.gameVersion)}</h3>
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">{group.totalRuns} Run{group.totalRuns === 1 ? '' : 's'} erfasst</p>
            </div>
            <div className="border-t border-[var(--border-default)]">
              {group.runs.map((run) => (
                <RunRow
                  key={run.id}
                  run={run}
                  expanded={expandedRun === run.id}
                  details={detailsCache[run.id]}
                  loading={detailLoading.has(run.id)}
                  error={detailErrors[run.id]}
                  selectedForComparison={selectedForComparison.includes(run.id)}
                  comparisonDisabled={selectedForComparison.length >= 2 && !selectedForComparison.includes(run.id)}
                  onToggle={() => void toggleRun(run)}
                  onToggleComparison={() => onToggleComparison(run)}
                />
              ))}
            </div>
            {group.nextCursor !== null && (
              <button
                type="button"
                onClick={() => onLoadMore(group)}
                disabled={isLoadingMore}
                className="app-action mt-3 min-h-11 w-full border-dashed disabled:cursor-wait disabled:opacity-60"
              >
                {isLoadingMore ? 'Weitere Runs werden geladen …' : `Weitere Runs anzeigen (${Math.max(0, group.totalRuns - group.runs.length)} verbleibend)`}
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}
