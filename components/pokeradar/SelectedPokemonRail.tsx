'use client';

import Image from 'next/image';
import SelectionStatusBadge from '@/components/pokeradar/SelectionStatusBadge';
import TypeBadge from '@/components/ui/TypeBadge';
import { useSpriteMode } from '@/lib/contexts/SpriteContext';
import { getSpriteUrl } from '@/lib/sprite-utils';
import { getGermanTypeName, parseTypes } from '@/lib/typeEffectiveness';
import type { ComparisonSelectionStatus } from '@/lib/pokemon-comparison';
import type { Pokemon } from '@/lib/types';

const DEFAULT_COLORS = ['#dc2626', '#2563eb', '#059669', '#b45309', '#c026d3', '#0891b2'];

export interface SelectedPokemonRailProps {
  selected: Pokemon[];
  referenceId: number | null;
  onSetReference: (pokedexId: number) => void;
  onRemove: (pokedexId: number) => void;
  onOpenPicker: () => void;
  statuses?: readonly ComparisonSelectionStatus[];
  colors?: readonly string[];
  maxCount?: number;
}

function SpriteFallback() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-12 w-12 text-[var(--text-tertiary)]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h6m6 0h6" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function SelectedPokemonRail({
  selected,
  referenceId,
  onSetReference,
  onRemove,
  onOpenPicker,
  statuses = [],
  colors = DEFAULT_COLORS,
  maxCount = 6,
}: SelectedPokemonRailProps) {
  const { spriteMode } = useSpriteMode();
  const slots = Array.from({ length: maxCount }, (_, index) => selected[index] ?? null);

  return (
    <section aria-labelledby="selected-pokemon-heading">
      <div className="app-section-title flex items-end justify-between gap-4">
        <div>
          <h2 id="selected-pokemon-heading" className="text-lg font-black uppercase tracking-[-0.02em] text-[var(--foreground)]">
            Vergleichsteam
          </h2>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
            Bis zu {maxCount} Pokémon · Klick wählt die Referenz
          </p>
        </div>
        <span
          className="app-status shrink-0 tabular-nums"
          aria-label={`${selected.length} von ${maxCount} Pokémon ausgewählt`}
        >
          {selected.length}/{maxCount}
        </span>
      </div>

      <ol className="no-scrollbar -mx-1 flex snap-x gap-0 overflow-x-auto px-1 pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible xl:grid-cols-6">
        {slots.map((pokemon, index) => {
          const color = colors[index % colors.length] ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];

          if (!pokemon) {
            return (
              <li key={`empty-${index}`} className="w-[9.5rem] shrink-0 snap-start sm:w-auto">
                <button
                  type="button"
                  onClick={onOpenPicker}
                  className="group flex min-h-44 w-full flex-col items-center justify-center border border-dashed border-[var(--border-default)] bg-[var(--background-secondary)] px-3 py-4 text-center transition hover:border-red-600 hover:bg-red-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                  aria-label={`Pokémon für Platz ${index + 1} auswählen`}
                >
                  <span className="flex h-11 w-11 items-center justify-center border border-[var(--border-default)] bg-[var(--card-bg)] text-2xl text-[var(--text-secondary)] transition group-hover:border-red-600 group-hover:text-red-600" aria-hidden="true">
                    +
                  </span>
                  <span className="mt-3 text-sm font-semibold text-[var(--foreground)]">Pokémon wählen</span>
                  <span className="mt-1 text-xs text-[var(--text-tertiary)]">Platz {index + 1}</span>
                </button>
              </li>
            );
          }

          const displayName = pokemon.nameGerman || pokemon.name;
          const isReference = pokemon.pokedexId === referenceId;
          const spriteUrl = getSpriteUrl(pokemon, spriteMode);
          const types = parseTypes(pokemon.types).slice(0, 2);
          const selectionStatus = statuses[index] ?? 'none';

          return (
            <li key={pokemon.pokedexId} className="relative w-[9.5rem] shrink-0 snap-start sm:w-auto">
              <div
                className={`relative min-h-44 overflow-hidden border border-t-2 bg-[var(--card-bg)] transition ${
                  isReference
                    ? 'border-red-600 bg-red-500/[0.03]'
                    : 'border-[var(--border-default)] hover:border-[var(--text-tertiary)]'
                }`}
                style={!isReference ? { borderTopColor: color } : undefined}
              >
                <button
                  type="button"
                  onClick={() => onRemove(pokemon.pokedexId)}
                  className="absolute right-0 top-0 z-10 flex h-11 w-11 items-center justify-center text-[var(--text-secondary)] transition hover:bg-red-500/10 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                  aria-label={`${displayName} aus dem Vergleich entfernen`}
                  title="Entfernen"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" d="m7 7 10 10M17 7 7 17" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => onSetReference(pokemon.pokedexId)}
                  aria-pressed={isReference}
                  aria-label={`${displayName} ${isReference ? 'ist die Referenz' : 'als Referenz festlegen'}`}
                  className="flex min-h-44 w-full flex-col items-center px-3 pb-3 pt-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-600"
                >
                  <span
                    className="flex h-7 min-w-7 items-center justify-center rounded-[2px] border-2 bg-[var(--background-secondary)] px-2 text-xs font-black text-[var(--foreground)]"
                    style={{ borderColor: color }}
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>

                  <span className="mt-1 flex h-14 items-center justify-center">
                    {spriteUrl ? (
                      <Image
                        src={spriteUrl}
                        alt=""
                        width={64}
                        height={64}
                        unoptimized={spriteMode === 'animated'}
                        className="h-14 w-14 object-contain [image-rendering:pixelated]"
                      />
                    ) : (
                      <SpriteFallback />
                    )}
                  </span>

                  <span className="mt-1 block w-full truncate text-sm font-semibold text-[var(--foreground)]" title={displayName}>
                    {displayName}
                  </span>
                  <span className="text-[11px] tabular-nums text-[var(--text-tertiary)]">#{pokemon.pokedexId}</span>

                  <span
                    className="mt-1.5 flex min-h-5 max-w-full items-center justify-center gap-1 overflow-hidden"
                    aria-label={`Typen: ${types.map(getGermanTypeName).join(', ')}`}
                  >
                    {types.map((type) => (
                      <TypeBadge
                        key={type}
                        type={type}
                        size="sm"
                        showIcon={false}
                        className="!px-1.5 !py-0.5 !text-[10px] hover:!scale-100"
                      />
                    ))}
                  </span>

                  <span className="mt-1.5 flex min-h-6 items-center justify-center">
                    {selectionStatus !== 'none' ? (
                      <SelectionStatusBadge status={selectionStatus} className="!text-[10px]" />
                    ) : null}
                  </span>

                  <span
                    className={`mt-1 inline-flex min-h-6 items-center px-2 text-[11px] font-black uppercase tracking-wide ${
                      isReference
                        ? 'bg-red-600 text-white'
                        : 'bg-[var(--background-tertiary)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {isReference ? '★ Referenz' : 'Als Referenz'}
                  </span>
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
