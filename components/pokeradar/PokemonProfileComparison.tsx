import type { Pokemon } from '@/lib/types';
import { getPokemonStatProfile } from '@/lib/pokemon-comparison';
import {
  ComparisonSection,
  EmptyComparisonState,
  SeriesMarker,
  getPokemonDisplayName,
  getSeriesColor,
} from '@/components/pokeradar/comparison-ui';
import PokemonMiniSprite from '@/components/pokeradar/PokemonMiniSprite';

interface PokemonProfileComparisonProps {
  pokemon: Pokemon[];
  colors?: readonly string[];
}

export default function PokemonProfileComparison({
  pokemon,
  colors,
}: PokemonProfileComparisonProps) {
  return (
    <ComparisonSection
      title="Basiswert-Profile"
      description="Beschreibt nur die Verteilung der sechs Basiswerte. Fähigkeiten, Attacken, Items und das aktuelle Spielformat fließen nicht ein."
    >
      {pokemon.length === 0 ? (
        <EmptyComparisonState>
          Nach der Auswahl werden hier die auffälligen Basiswert-Schwerpunkte angezeigt.
        </EmptyComparisonState>
      ) : (
        <div className="grid gap-0 border-l border-t border-[var(--border-default)] sm:grid-cols-2 xl:grid-cols-3">
          {pokemon.map((entry, index) => {
            const profile = getPokemonStatProfile(entry);
            const color = getSeriesColor(index, colors);

            return (
              <article
                key={entry.pokedexId}
                className="border-b border-r border-[var(--border-default)] bg-[var(--background-secondary)] p-4"
              >
                <div className="mb-3 flex min-h-10 items-center gap-2">
                  <SeriesMarker index={index} colors={colors} />
                  <PokemonMiniSprite pokemon={entry} />
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-[var(--foreground)]">
                      {getPokemonDisplayName(entry)}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">#{entry.pokedexId}</p>
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5" aria-label="Basiswert-Merkmale">
                  {profile.tags.map((tag) => (
                    <span
                      key={tag.key}
                      title={tag.description}
                      className="rounded-[2px] border px-2.5 py-1 text-xs font-bold text-[var(--foreground)]"
                      style={{
                        borderColor: `${color}99`,
                        backgroundColor: `${color}18`,
                      }}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>

                <dl className="mb-3 space-y-2">
                  {profile.strongestStats.map((stat) => (
                    <div key={stat.metric} className="flex items-center justify-between gap-3 text-sm">
                      <dt className="text-[var(--text-secondary)]">{stat.label}</dt>
                      <dd className="font-bold tabular-nums text-[var(--foreground)]">{stat.value}</dd>
                    </div>
                  ))}
                </dl>

                <p className="border-t border-[var(--border-default)] pt-3 text-sm leading-5 text-[var(--text-secondary)]">
                  {profile.summary}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </ComparisonSection>
  );
}
