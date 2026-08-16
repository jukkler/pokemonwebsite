'use client';

import { useState } from 'react';
import type { Pokemon } from '@/lib/types';
import {
  STAT_DEFINITIONS,
  getMetricDelta,
  getMetricLeaders,
  getMetricValue,
  type ComparisonMetric,
} from '@/lib/pokemon-comparison';
import {
  ComparisonSection,
  EmptyComparisonState,
  SeriesMarker,
  colorBarStyle,
  getPokemonDisplayName,
  getSeriesColor,
} from '@/components/pokeradar/comparison-ui';
import PokemonMiniSprite from '@/components/pokeradar/PokemonMiniSprite';

interface BaseStatsComparisonProps {
  pokemon: Pokemon[];
  reference?: Pokemon | null;
  activeMetric?: ComparisonMetric;
  onMetricChange?: (metric: ComparisonMetric) => void;
  colors?: readonly string[];
}

function formatDelta(value: number): string {
  if (value === 0) return '±0';
  return value > 0 ? `+${value}` : `${value}`;
}

function DeltaLabel({ delta, isReference }: { delta: number; isReference: boolean }) {
  if (isReference) {
    return <span className="text-[var(--text-secondary)]">Referenz</span>;
  }

  return (
    <span
      className={
        delta > 0
          ? 'text-emerald-600 dark:text-emerald-400'
          : delta < 0
            ? 'text-red-600 dark:text-red-400'
            : 'text-[var(--text-secondary)]'
      }
    >
      {formatDelta(delta)} zur Referenz
    </span>
  );
}

function ReferenceStar() {
  return (
    <span
      aria-label="Referenz"
      className="inline-flex shrink-0 text-blue-600 dark:text-blue-400"
      role="img"
      title="Referenz"
    >
      <svg aria-hidden="true" className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="m12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5-4.7-4.6 6.5-.9L12 2.5Z" />
      </svg>
    </span>
  );
}

function WinnerLabel({ isTie }: { isTie: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 border-l-2 border-amber-500 bg-amber-400/10 px-2 py-1 text-[10px] font-black uppercase leading-none text-amber-800 dark:text-amber-200">
      <svg aria-hidden="true" className="size-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="m12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5-4.7-4.6 6.5-.9L12 2.5Z" />
      </svg>
      {isTie ? 'Höchstwert · Gleichstand' : 'Höchstwert'}
    </span>
  );
}

function MobileMetricCard({
  metric,
  pokemon,
  reference,
  colors,
}: {
  metric: ComparisonMetric;
  pokemon: Pokemon[];
  reference: Pokemon;
  colors?: readonly string[];
}) {
  const definition = STAT_DEFINITIONS.find((item) => item.key === metric);
  const leaders = getMetricLeaders(pokemon, metric);

  if (!definition) return null;

  return (
    <article className="border border-[var(--border-default)] bg-[var(--background-secondary)] p-3">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-[var(--foreground)]">{definition.label}</h3>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">Höherer Basiswert</p>
        </div>
        {leaders.isTie ? (
          <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Gleichstand</span>
        ) : null}
      </div>

      <div className="space-y-4">
        {pokemon.map((entry, index) => {
          const value = getMetricValue(entry, metric);
          const delta = getMetricDelta(entry, reference, metric);
          const isLeader = leaders.leaderIds.includes(entry.pokedexId);
          const isReference = entry.pokedexId === reference.pokedexId;

          return (
            <div key={entry.pokedexId}>
              <div className="mb-1.5 grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2">
                <SeriesMarker index={index} colors={colors} size="sm" />
                <PokemonMiniSprite pokemon={entry} size="xs" />
                <span className="truncate text-sm font-semibold text-[var(--foreground)]">
                  {getPokemonDisplayName(entry)}
                </span>
                <span className="tabular-nums text-base font-bold text-[var(--foreground)]">
                  {value}
                </span>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 pl-[3.75rem]">
                <div className="h-2 overflow-hidden bg-[var(--background-tertiary)]">
                  <div
                    className="h-full"
                    style={colorBarStyle(
                      getSeriesColor(index, colors),
                      leaders.highestValue > 0 ? (value / leaders.highestValue) * 100 : 0,
                    )}
                  />
                </div>
                <span className="min-w-20 text-right text-[10px] font-medium tabular-nums">
                  <DeltaLabel delta={delta} isReference={isReference} />
                </span>
              </div>
              {isLeader ? (
                <div className="mt-1.5 pl-[3.75rem]">
                  <WinnerLabel isTie={leaders.isTie} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </article>
  );
}

export default function BaseStatsComparison({
  pokemon,
  reference,
  activeMetric = 'speed',
  onMetricChange,
  colors,
}: BaseStatsComparisonProps) {
  const [showAllMobileMetrics, setShowAllMobileMetrics] = useState(false);
  const validReference =
    pokemon.find((entry) => entry.pokedexId === reference?.pokedexId) || pokemon[0];
  const shownMobileMetrics = showAllMobileMetrics
    ? STAT_DEFINITIONS.map((item) => item.key)
    : [activeMetric];

  return (
    <ComparisonSection
      title="Basiswerte im Direktvergleich"
      description={
        pokemon.length > 1
          ? validReference
            ? (
                <>
                  Exakte Werte und Abweichungen gegenüber{' '}
                  <span className="font-semibold text-[var(--foreground)]">
                    {getPokemonDisplayName(validReference)}
                  </span>
                  . Die Balken sind je Zeile auf den höchsten ausgewählten Wert bezogen.
                </>
              )
            : 'Exakte Werte und Abweichungen gegenüber der Referenz. Die Balken sind je Zeile auf den höchsten ausgewählten Wert bezogen.'
          : 'Wähle mindestens zwei Pokémon für direkte Unterschiede und Höchstwerte.'
      }
      action={
        pokemon.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowAllMobileMetrics((current) => !current)}
            className="comparison-mobile-metric-toggle app-action min-h-11"
            aria-expanded={showAllMobileMetrics}
          >
            {showAllMobileMetrics ? 'Ein Wert' : 'Alle 7 Werte'}
            <svg
              aria-hidden="true"
              className={`size-4 transition-transform ${showAllMobileMetrics ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        ) : undefined
      }
    >
      {!validReference ? (
        <EmptyComparisonState>
          Füge ein Pokémon hinzu, um seine sechs Basiswerte und die Gesamt-BP zu sehen.
        </EmptyComparisonState>
      ) : (
        <>
          <div className="mb-3 md:hidden">
            <label htmlFor="mobile-comparison-metric" className="sr-only">
              Angezeigten Basiswert wählen
            </label>
            <select
              id="mobile-comparison-metric"
              value={activeMetric}
              onChange={(event) =>
                onMetricChange?.(event.target.value as ComparisonMetric)
              }
              disabled={showAllMobileMetrics}
              className="min-h-11 w-full border border-[var(--border-default)] bg-[var(--background-secondary)] px-3 text-sm font-bold text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:opacity-50"
            >
              {STAT_DEFINITIONS.map((definition) => (
                <option key={definition.key} value={definition.key}>
                  {definition.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 md:hidden">
            {shownMobileMetrics.map((metric) => (
              <MobileMetricCard
                key={metric}
                metric={metric}
                pokemon={pokemon}
                reference={validReference}
                colors={colors}
              />
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="app-data-table w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">
                Basiswerte mit Balken, Abweichung zur Referenz und textlich markierten Höchstwerten
              </caption>
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-40 border-b border-[var(--border-default)] bg-[var(--card-bg)] px-3 py-3 text-xs font-black uppercase tracking-wide text-[var(--text-secondary)]">
                    Basiswert
                  </th>
                  {pokemon.map((entry, index) => (
                    <th
                      key={entry.pokedexId}
                      className="min-w-36 border-b border-[var(--border-default)] px-3 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <SeriesMarker index={index} colors={colors} size="sm" />
                        <PokemonMiniSprite pokemon={entry} size="xs" />
                        <span className="min-w-0 truncate font-bold text-[var(--foreground)]">
                          {getPokemonDisplayName(entry)}
                        </span>
                        {entry.pokedexId === validReference.pokedexId ? (
                          <ReferenceStar />
                        ) : null}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STAT_DEFINITIONS.map((definition) => {
                  const leaders = getMetricLeaders(pokemon, definition.key);

                  return (
                    <tr key={definition.key}>
                      <th className="sticky left-0 z-10 border-b border-[var(--border-default)] bg-[var(--card-bg)] px-3 py-3 font-black text-[var(--foreground)]">
                        {definition.label}
                      </th>
                      {pokemon.map((entry, index) => {
                        const value = getMetricValue(entry, definition.key);
                        const delta = getMetricDelta(entry, validReference, definition.key);
                        const isReference = entry.pokedexId === validReference.pokedexId;
                        const isLeader = leaders.leaderIds.includes(entry.pokedexId);

                        return (
                          <td
                            key={entry.pokedexId}
                            className="border-b border-[var(--border-default)] px-3 py-2.5 align-top"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-8 shrink-0 font-bold tabular-nums text-[var(--foreground)]">
                                {value}
                              </span>
                              <div className="h-1.5 min-w-10 flex-1 overflow-hidden bg-[var(--background-tertiary)]">
                                <div
                                  className="h-full"
                                  style={colorBarStyle(
                                    getSeriesColor(index, colors),
                                    leaders.highestValue > 0
                                      ? (value / leaders.highestValue) * 100
                                      : 0,
                                  )}
                                />
                              </div>
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-medium tabular-nums">
                              <DeltaLabel delta={delta} isReference={isReference} />
                              {isLeader ? <WinnerLabel isTie={leaders.isTie} /> : null}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </ComparisonSection>
  );
}
