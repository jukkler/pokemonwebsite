'use client';

import Image from 'next/image';
import { useSpriteMode } from '@/lib/contexts/SpriteContext';
import type {
  RunComparisonMetric,
  RunComparisonPlayer,
  RunComparisonResponse,
  RunComparisonSide,
  RunEncounter,
} from './types';
import { gameName } from './types';

export interface RunComparisonProps {
  data: RunComparisonResponse | null;
  loading?: boolean;
  error?: string | null;
  onSwap: () => void;
  onClear: () => void;
  onRetry?: () => void;
}

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const numberFormatter = new Intl.NumberFormat('de-DE');

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Nicht erfasst' : dateFormatter.format(date);
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(Math.abs(ms) / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days} T ${hours} Std.`;
  if (hours > 0) return `${hours} Std. ${minutes} Min.`;
  return `${minutes} Min.`;
}

function formatMetricValue(metric: RunComparisonMetric, value: number | null): string {
  if (value === null) return 'Nicht erfasst';
  return metric.unit === 'milliseconds' ? formatDuration(value) : numberFormatter.format(value);
}

function formatDelta(metric: RunComparisonMetric): string {
  if (metric.delta === null) return 'Nicht erfasst';
  if (metric.delta === 0) return '±0';
  const prefix = metric.delta > 0 ? '+' : '−';
  const absolute = Math.abs(metric.delta);
  return `${prefix}${metric.unit === 'milliseconds' ? formatDuration(absolute) : numberFormatter.format(absolute)}`;
}

function coverageText(side: RunComparisonSide): string {
  const coverage = side.coverage.encounters;
  if (coverage.status === 'missing') return 'Encounter-Snapshot nicht erfasst';
  if (coverage.status === 'partial') return `Teilweise erfasst · ${coverage.documented ?? 0}/${coverage.total ?? 0} Encounter-Details`;
  if (coverage.status === 'live') return 'Live-Daten';
  return 'Encounter-Details vollständig';
}

function coverageClass(side: RunComparisonSide): string {
  const status = side.coverage.encounters.status;
  if (status === 'missing' || status === 'partial') return 'border-amber-400/30 bg-amber-500/[0.07] text-amber-800 dark:text-amber-200';
  if (status === 'live') return 'border-cyan-400/30 bg-cyan-500/[0.07] text-cyan-800 dark:text-cyan-200';
  return 'border-emerald-400/25 bg-emerald-500/[0.06] text-emerald-800 dark:text-emerald-200';
}

function SideHeader({ side, label, tone }: { side: RunComparisonSide; label: 'A' | 'B'; tone: 'indigo' | 'cyan' }) {
  return (
    <article
      data-testid={`run-comparison-${label === 'A' ? 'left' : 'right'}`}
      className={`border-t-2 p-4 ${tone === 'indigo' ? 'border-red-600 bg-red-500/[0.05]' : 'border-[var(--brand-navy,#071a33)] bg-blue-950/[0.05]'}`}
    >
      <div className="flex items-start gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center text-sm font-black ${tone === 'indigo' ? 'bg-red-600 text-white' : 'bg-[var(--brand-navy,#071a33)] text-white'}`}>
          {label}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 className="text-base font-bold text-[var(--foreground)]">Run #{side.run.runNumber}</h3>
            <span className="text-xs text-[var(--text-tertiary)]">{formatDate(side.run.endedAt || side.run.startedAt)}</span>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{gameName(side.run.gameVersion)}</p>
          <span className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${coverageClass(side)}`}>
            {coverageText(side)}
          </span>
        </div>
      </div>
    </article>
  );
}

function barWidth(value: number | null, counterpart: number | null): number {
  if (value === null) return 0;
  const max = Math.max(value, counterpart ?? 0);
  return max === 0 ? 0 : Math.max(7, (value / max) * 100);
}

function DesktopMetricRow({ metric }: { metric: RunComparisonMetric }) {
  return (
    <div
      data-testid={`run-comparison-metric-${metric.key}`}
      className="grid grid-cols-[minmax(8rem,1.1fr)_minmax(8rem,1fr)_7rem_minmax(8rem,1fr)] items-center gap-4 border-b border-[var(--border-default)] px-1 py-3.5 last:border-b-0"
    >
      <p className="text-sm font-semibold text-[var(--foreground)]">{metric.label}</p>
      <div>
        <p className={`text-right text-sm font-bold tabular-nums ${metric.left === null ? 'italic text-[var(--text-tertiary)]' : 'text-[var(--foreground)]'}`}>
          {formatMetricValue(metric, metric.left)}
        </p>
        <div className="mt-1.5 h-1.5 overflow-hidden bg-[var(--background-tertiary)]" aria-hidden="true">
          <div className="h-full bg-red-600" style={{ width: `${barWidth(metric.left, metric.right)}%` }} />
        </div>
      </div>
      <p className={`text-center text-xs font-bold tabular-nums ${metric.delta === null ? 'italic text-[var(--text-tertiary)]' : 'text-cyan-300'}`}>
        Δ {formatDelta(metric)}
      </p>
      <div>
        <p className={`text-right text-sm font-bold tabular-nums ${metric.right === null ? 'italic text-[var(--text-tertiary)]' : 'text-[var(--foreground)]'}`}>
          {formatMetricValue(metric, metric.right)}
        </p>
        <div className="mt-1.5 h-1.5 overflow-hidden bg-[var(--background-tertiary)]" aria-hidden="true">
          <div className="h-full bg-blue-900 dark:bg-blue-400" style={{ width: `${barWidth(metric.right, metric.left)}%` }} />
        </div>
      </div>
    </div>
  );
}

function MobileMetricCard({ metric }: { metric: RunComparisonMetric }) {
  return (
    <article
      data-testid={`run-comparison-mobile-card-${metric.key}`}
      className="border border-[var(--border-default)] bg-[var(--card-bg-elevated)] p-3.5"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">{metric.label}</h3>
        <span className={`text-xs font-bold tabular-nums ${metric.delta === null ? 'italic text-[var(--text-tertiary)]' : 'text-cyan-300'}`}>
          Δ {formatDelta(metric)}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="border-t-2 border-red-600 bg-red-500/[0.07] px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-300">Run A</p>
          <p className={`mt-1 text-sm font-bold tabular-nums ${metric.left === null ? 'italic text-[var(--text-tertiary)]' : 'text-[var(--foreground)]'}`}>{formatMetricValue(metric, metric.left)}</p>
        </div>
        <div className="border-t-2 border-[var(--brand-navy,#071a33)] bg-blue-950/[0.07] px-3 py-2.5 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">Run B</p>
          <p className={`mt-1 text-sm font-bold tabular-nums ${metric.right === null ? 'italic text-[var(--text-tertiary)]' : 'text-[var(--foreground)]'}`}>{formatMetricValue(metric, metric.right)}</p>
        </div>
      </div>
    </article>
  );
}

function nullableCount(value: number | null): string {
  return value === null ? 'Nicht erfasst' : numberFormatter.format(value);
}

function PlayerCard({ player }: { player: RunComparisonPlayer }) {
  return (
    <article className="border border-[var(--border-default)] bg-[var(--card-bg-elevated)] p-4">
      <h3 className="font-bold text-[var(--foreground)]">{player.playerName}</h3>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="border-t-2 border-red-600 bg-red-500/[0.07] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-300">Run A</p>
          <dl className="mt-2 space-y-1.5 text-xs">
            <div className="flex justify-between gap-2"><dt className="text-[var(--text-secondary)]">K.O.</dt><dd className="font-bold tabular-nums text-[var(--foreground)]">{nullableCount(player.left.knockedOutCount)}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-[var(--text-secondary)]">Nicht gefangen</dt><dd className="font-bold tabular-nums text-[var(--foreground)]">{nullableCount(player.left.notCaughtCount)}</dd></div>
          </dl>
          {player.left.isLoser === true && <p className="mt-2 text-[11px] font-semibold text-rose-300">Run verloren</p>}
        </div>
        <div className="border-t-2 border-[var(--brand-navy,#071a33)] bg-blue-950/[0.07] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">Run B</p>
          <dl className="mt-2 space-y-1.5 text-xs">
            <div className="flex justify-between gap-2"><dt className="text-[var(--text-secondary)]">K.O.</dt><dd className="font-bold tabular-nums text-[var(--foreground)]">{nullableCount(player.right.knockedOutCount)}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-[var(--text-secondary)]">Nicht gefangen</dt><dd className="font-bold tabular-nums text-[var(--foreground)]">{nullableCount(player.right.notCaughtCount)}</dd></div>
          </dl>
          {player.right.isLoser === true && <p className="mt-2 text-[11px] font-semibold text-rose-300">Run verloren</p>}
        </div>
      </div>
      <p className="mt-3 border-t border-[var(--border-default)] pt-3 text-xs text-[var(--text-secondary)]">
        Veränderung: <strong className="text-[var(--foreground)]">K.O. {player.deltas.knockedOutCount === null ? 'nicht erfasst' : `${player.deltas.knockedOutCount > 0 ? '+' : ''}${player.deltas.knockedOutCount}`}</strong>
        <span aria-hidden="true" className="mx-1.5 text-[var(--text-tertiary)]">·</span>
        <strong className="text-[var(--foreground)]">Nicht gefangen {player.deltas.notCaughtCount === null ? 'nicht erfasst' : `${player.deltas.notCaughtCount > 0 ? '+' : ''}${player.deltas.notCaughtCount}`}</strong>
      </p>
    </article>
  );
}

function encounterSprite(encounter: RunEncounter, animated: boolean): string {
  if (animated) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${encounter.pokemonPokedexId}.gif`;
  }
  return encounter.spriteUrl || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${encounter.pokemonPokedexId}.png`;
}

function OutcomeItem({ encounter, animated }: { encounter: RunEncounter; animated: boolean }) {
  const notCaught = encounter.isNotCaught;
  const name = encounter.nickname || encounter.pokemonNameGerman || encounter.pokemonName;
  const details = notCaught
    ? encounter.notCaughtReason || encounter.notCaughtBy
    : encounter.koReason || encounter.koCausedBy;
  return (
    <li className="flex items-center gap-3 border-b border-[var(--border-default)] bg-[var(--background-tertiary)] p-2.5 last:border-b-0">
      <div className="relative h-10 w-10 shrink-0">
        <Image
          src={encounterSprite(encounter, animated)}
          alt=""
          fill
          sizes="40px"
          unoptimized
          className="pixelated object-contain grayscale-[0.45]"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-bold text-[var(--foreground)]">{name}</p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${notCaught ? 'bg-amber-500/15 text-amber-300' : 'bg-rose-500/15 text-rose-300'}`}>
            {notCaught ? 'Nicht gefangen' : 'K.O.'}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">{encounter.playerName} · {encounter.routeName}</p>
        <p className={`mt-0.5 truncate text-[11px] ${details ? 'text-[var(--text-tertiary)]' : 'italic text-amber-200/70'}`}>{details || 'Grund nicht erfasst'}</p>
      </div>
    </li>
  );
}

function Outcomes({ side, label }: { side: RunComparisonSide; label: 'A' | 'B' }) {
  const { spriteMode } = useSpriteMode();
  const outcomes = side.encounters.filter((encounter) => encounter.isKnockedOut || encounter.isNotCaught);
  const missing = side.coverage.encounters.status === 'missing';
  const partial = side.coverage.encounters.status === 'partial';

  return (
    <article className="border border-[var(--border-default)] bg-[var(--card-bg-elevated)] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold text-[var(--foreground)]">Run {label}</h3>
        <span className="text-xs tabular-nums text-[var(--text-tertiary)]">{missing ? 'Nicht erfasst' : `${outcomes.length} Einträge`}</span>
      </div>
      {missing ? (
        <p className="mt-3 border border-dashed border-amber-400/30 bg-amber-500/[0.05] px-3 py-5 text-sm text-amber-800 dark:text-amber-100/85">
          Verluste und verpasste Pokémon wurden für diesen Run nicht als Snapshot erfasst.
        </p>
      ) : outcomes.length > 0 ? (
        <ul className="mt-3 border-y border-[var(--border-default)]">
          {outcomes.map((encounter) => <OutcomeItem key={encounter.id} encounter={encounter} animated={spriteMode === 'animated'} />)}
        </ul>
      ) : (
        <p className="mt-3 border border-dashed border-[var(--border-default)] px-3 py-5 text-sm text-[var(--text-secondary)]">
          Keine Verluste oder verpassten Pokémon erfasst.
        </p>
      )}
      {partial && (
        <p className="mt-3 text-xs leading-5 text-amber-100/75">
          Bei älteren Einträgen fehlen einzelne Detailangaben; vorhandene Werte werden angezeigt.
        </p>
      )}
    </article>
  );
}

function ComparisonSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Run-Vergleich wird geladen">
      <div className="h-20 animate-pulse bg-[var(--background-tertiary)]" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-32 animate-pulse bg-[var(--background-tertiary)]" />
        <div className="h-32 animate-pulse bg-[var(--background-tertiary)]" />
      </div>
      <div className="h-48 animate-pulse bg-[var(--background-tertiary)]" />
      <span className="sr-only">Vergleich wird geladen …</span>
    </div>
  );
}

function SwapIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="m5.5 5.5-2 2 2 2M3.75 7.5H15M14.5 10.5l2 2-2 2M16.25 12.5H5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RunComparison({ data, loading = false, error = null, onSwap, onClear, onRetry }: RunComparisonProps) {
  if (!loading && !error && !data) return null;

  return (
    <section
      id="run-comparison"
      data-testid="run-comparison"
      aria-labelledby="run-comparison-title"
      className="app-section scroll-mt-24 p-4 md:p-6"
    >
      <div className="app-section-title flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="run-comparison-title" className="text-xl font-black uppercase tracking-[-0.02em] text-[var(--foreground)]">Direkter Run-Vergleich</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Run A ist die Basis. Alle Deltas zeigen Run B minus Run A.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSwap}
            disabled={!data || loading}
            data-testid="run-comparison-swap"
            aria-label="Reihenfolge tauschen"
            className="app-action min-h-11 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SwapIcon /> Tauschen
          </button>
          <button
            type="button"
            onClick={onClear}
            data-testid="run-comparison-result-clear"
            className="app-action min-h-11"
          >
            Auswahl leeren
          </button>
        </div>
      </div>

      {loading && <ComparisonSkeleton />}
      {error && !loading && (
        <div role="alert" className="border border-rose-400/30 bg-rose-500/[0.07] px-4 py-4 text-sm text-rose-700 dark:text-rose-200">
          <p>{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="app-action mt-3 min-h-11"
            >
              Erneut versuchen
            </button>
          )}
        </div>
      )}
      {data && !loading && !error && (
        <div className="space-y-6">
          {!data.sameGame && (
            <p className="border border-blue-500/25 bg-blue-500/[0.06] px-4 py-3 text-sm text-blue-900 dark:text-blue-100">
              Spielübergreifender Vergleich: Werte werden direkt gegenübergestellt, obwohl die Runs aus unterschiedlichen Spielen stammen.
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <SideHeader side={data.left} label="A" tone="indigo" />
            <SideHeader side={data.right} label="B" tone="cyan" />
          </div>

          <section aria-labelledby="run-comparison-metrics-title">
            <h3 id="run-comparison-metrics-title" className="text-base font-bold text-[var(--foreground)]">Run-Werte</h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Exakte Werte mit direkter Veränderung; fehlende Snapshots werden nicht als Null gewertet.</p>
            <div className="app-data-table mt-3 hidden border border-[var(--border-default)] bg-[var(--card-bg-elevated)] p-3 sm:block">
              <div className="grid grid-cols-[minmax(8rem,1.1fr)_minmax(8rem,1fr)_7rem_minmax(8rem,1fr)] gap-4 px-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                <span>Kennzahl</span><span className="text-right text-indigo-300">Run A</span><span className="text-center">Delta</span><span className="text-right text-cyan-300">Run B</span>
              </div>
              {data.metrics.map((metric) => <DesktopMetricRow key={metric.key} metric={metric} />)}
            </div>
            <div className="mt-3 space-y-2 sm:hidden">
              {data.metrics.map((metric) => <MobileMetricCard key={metric.key} metric={metric} />)}
            </div>
          </section>

          <section aria-labelledby="run-comparison-players-title" data-testid="run-comparison-players">
            <h3 id="run-comparison-players-title" className="text-base font-bold text-[var(--foreground)]">Entwicklung je Spieler</h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">K.O. und nicht gefangene Begegnungen je Run.</p>
            {data.players.length > 0 ? (
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {data.players.map((player) => <PlayerCard key={player.playerName} player={player} />)}
              </div>
            ) : (
              <p className="mt-3 border border-dashed border-[var(--border-default)] px-4 py-6 text-sm text-[var(--text-secondary)]">
                {data.left.coverage.playerStats === 'missing' || data.right.coverage.playerStats === 'missing'
                  ? 'Spielerwerte wurden für mindestens einen dieser Runs nicht erfasst.'
                  : 'Für diese Runs wurden keine Spielerwerte erfasst.'}
              </p>
            )}
          </section>

          <section aria-labelledby="run-comparison-outcomes-title">
            <h3 id="run-comparison-outcomes-title" className="text-base font-bold text-[var(--foreground)]">Verluste und verpasste Pokémon</h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Erfasste K.O. und nicht gefangene Begegnungen, getrennt nach Run.</p>
            <div className="mt-3 grid items-start gap-3 md:grid-cols-2">
              <Outcomes side={data.left} label="A" />
              <Outcomes side={data.right} label="B" />
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
