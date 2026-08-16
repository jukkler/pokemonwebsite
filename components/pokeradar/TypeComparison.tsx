'use client';

import { useState } from 'react';
import type { Pokemon } from '@/lib/types';
import {
  getDefensiveTypeProfile,
  type DefensiveTypeProfile,
  type TypeMatchup,
} from '@/lib/pokemon-comparison';
import TypeBadge from '@/components/ui/TypeBadge';
import {
  ComparisonSection,
  EmptyComparisonState,
  SeriesMarker,
  getPokemonDisplayName,
} from '@/components/pokeradar/comparison-ui';
import PokemonMiniSprite from '@/components/pokeradar/PokemonMiniSprite';

interface TypeComparisonProps {
  pokemon: Pokemon[];
  colors?: readonly string[];
}

type MatchupGroup = {
  key: keyof Pick<
    DefensiveTypeProfile,
    'immunities' | 'strongResistances' | 'resistances' | 'weaknesses' | 'strongWeaknesses'
  >;
  label: string;
  multiplier: string;
  tone: string;
};

const MATCHUP_GROUPS: MatchupGroup[] = [
  {
    key: 'immunities',
    label: 'Immunitäten',
    multiplier: '0×',
    tone: 'text-blue-700 dark:text-blue-300',
  },
  {
    key: 'strongResistances',
    label: 'Starke Resistenzen',
    multiplier: '¼×',
    tone: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    key: 'resistances',
    label: 'Resistenzen',
    multiplier: '½×',
    tone: 'text-green-700 dark:text-green-300',
  },
  {
    key: 'weaknesses',
    label: 'Schwächen',
    multiplier: '2×',
    tone: 'text-red-700 dark:text-red-300',
  },
  {
    key: 'strongWeaknesses',
    label: 'Starke Schwächen',
    multiplier: '4×',
    tone: 'text-rose-700 dark:text-rose-300',
  },
];

function MatchupBadges({ matchups }: { matchups: TypeMatchup[] }) {
  if (matchups.length === 0) {
    return <span className="text-sm text-[var(--text-tertiary)]">Keine</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {matchups.map((matchup) => (
        <TypeBadge
          key={matchup.type}
          type={matchup.type}
          size="sm"
          className="hover:scale-100"
        />
      ))}
    </div>
  );
}

function TypeProfileDetails({ profile }: { profile: DefensiveTypeProfile }) {
  return (
    <dl className="space-y-4">
      {MATCHUP_GROUPS.map((group) => (
        <div key={group.key}>
          <dt className={`mb-1.5 text-xs font-bold ${group.tone}`}>
            {group.label} ({group.multiplier})
          </dt>
          <dd>
            <MatchupBadges matchups={profile[group.key]} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function TypeComparison({ pokemon, colors }: TypeComparisonProps) {
  const [activePokemonId, setActivePokemonId] = useState<number | null>(null);
  const activePokemon =
    pokemon.find((entry) => entry.pokedexId === activePokemonId) || pokemon[0];

  return (
    <ComparisonSection
      title="Defensiver Typvergleich"
      description="Multiplikatoren zeigen, wie stark eine gegnerische Attacke des jeweiligen Typs trifft. Fähigkeiten und andere Effekte sind nicht berücksichtigt."
    >
      {pokemon.length === 0 ? (
        <EmptyComparisonState>
          Wähle ein Pokémon aus, um Immunitäten, Resistenzen und Schwächen zu vergleichen.
        </EmptyComparisonState>
      ) : (
        <>
          <div className="md:hidden">
            <div
              className="no-scrollbar app-toolbar mb-4 flex gap-0 overflow-x-auto border border-[var(--border-default)] bg-[var(--background-secondary)] p-0"
              role="tablist"
              aria-label="Pokémon für Typdetails"
            >
              {pokemon.map((entry, index) => {
                const isActive = entry.pokedexId === activePokemon?.pokedexId;
                return (
                  <button
                    key={entry.pokedexId}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`type-panel-${entry.pokedexId}`}
                    id={`type-tab-${entry.pokedexId}`}
                    onClick={() => setActivePokemonId(entry.pokedexId)}
                    className={`min-h-11 min-w-32 flex-1 border-r border-[var(--border-default)] px-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 ${
                      isActive
                        ? 'bg-[var(--brand-navy,#071a33)] text-white'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--background-tertiary)]'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <SeriesMarker index={index} colors={colors} size="sm" />
                      <PokemonMiniSprite pokemon={entry} size="xs" />
                      <span className="truncate">{getPokemonDisplayName(entry)}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {activePokemon ? (
              <div
                role="tabpanel"
                id={`type-panel-${activePokemon.pokedexId}`}
                aria-labelledby={`type-tab-${activePokemon.pokedexId}`}
                className="border border-[var(--border-default)] bg-[var(--background-secondary)] p-4"
              >
                <div className="mb-4 flex items-center gap-3 border-b border-[var(--border-default)] pb-3">
                  <PokemonMiniSprite pokemon={activePokemon} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--foreground)]">
                      {getPokemonDisplayName(activePokemon)}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">Eigene Typen:</span>
                      {getDefensiveTypeProfile(activePokemon).pokemonTypes.map((type) => (
                        <TypeBadge key={type} type={type} size="sm" />
                      ))}
                    </div>
                  </div>
                </div>
                <TypeProfileDetails profile={getDefensiveTypeProfile(activePokemon)} />
              </div>
            ) : null}
          </div>

          <div className="hidden grid-cols-1 gap-0 border-l border-t border-[var(--border-default)] md:grid md:grid-cols-2 xl:grid-cols-3">
            {pokemon.map((entry, index) => {
              const profile = getDefensiveTypeProfile(entry);
              return (
                <article
                  key={entry.pokedexId}
                  className="border-b border-r border-[var(--border-default)] bg-[var(--background-secondary)] p-4"
                >
                  <div className="mb-3 flex min-h-10 items-center gap-2">
                    <SeriesMarker index={index} colors={colors} />
                    <PokemonMiniSprite pokemon={entry} />
                    <h3 className="min-w-0 truncate font-bold text-[var(--foreground)]">
                      {getPokemonDisplayName(entry)}
                    </h3>
                  </div>
                  <div className="mb-4 flex flex-wrap gap-1.5 border-b border-[var(--border-default)] pb-3">
                    {profile.pokemonTypes.map((type) => (
                      <TypeBadge key={type} type={type} size="sm" />
                    ))}
                  </div>
                  <TypeProfileDetails profile={profile} />
                </article>
              );
            })}
          </div>
        </>
      )}
    </ComparisonSection>
  );
}
