import type { Pokemon } from '@/lib/types';
import { buildComparisonInsights } from '@/lib/pokemon-comparison';
import {
  SeriesMarker,
  getPokemonDisplayName,
} from '@/components/pokeradar/comparison-ui';
import PokemonMiniSprite from '@/components/pokeradar/PokemonMiniSprite';

interface ComparisonInsightsProps {
  pokemon: Pokemon[];
  reference?: Pokemon | null;
  colors?: readonly string[];
}

const ICONS = [
  <path key="spark" d="m12 3-1.7 5.3a2 2 0 0 1-1.3 1.3L4 11.3l5 1.7a2 2 0 0 1 1.3 1.3L12 20l1.7-5.7A2 2 0 0 1 15 13l5-1.7-5-1.7a2 2 0 0 1-1.3-1.3L12 3Z" />,
  <path key="chart" d="M5 19V9m7 10V5m7 14v-7" />,
  <path key="shield" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
] as const;

export default function ComparisonInsights({
  pokemon,
  reference,
  colors,
}: ComparisonInsightsProps) {
  if (pokemon.length < 2) {
    return null;
  }

  const insights = buildComparisonInsights(pokemon, reference || undefined).slice(0, 3);

  if (insights.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="comparison-insights-title"
      className="app-band app-band--navy px-4 py-3"
    >
      <h2 id="comparison-insights-title" className="sr-only">
        Auffällige Unterschiede
      </h2>
      <div className="grid divide-y divide-white/15 md:grid-cols-3 md:divide-x md:divide-y-0">
        {insights.map((insight, index) => {
          const matchingEntries = insight.pokemonIds
            .map((id) => ({ entry: pokemon.find((item) => item.pokedexId === id), id }))
            .filter((item): item is { entry: Pokemon; id: number } => Boolean(item.entry));

          return (
            <article
              key={insight.id}
              className="flex min-h-16 items-start gap-3 px-3 py-3"
            >
              <svg
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {ICONS[index % ICONS.length]}
              </svg>
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  {matchingEntries.map(({ entry }) => {
                    const pokemonIndex = pokemon.findIndex(
                      (candidate) => candidate.pokedexId === entry.pokedexId,
                    );
                    return (
                      <span key={entry.pokedexId} className="inline-flex items-center gap-1">
                        <SeriesMarker index={pokemonIndex} colors={colors} size="sm" />
                        <PokemonMiniSprite pokemon={entry} size="xs" />
                        <span className="sr-only">{getPokemonDisplayName(entry)}</span>
                      </span>
                    );
                  })}
                  <h3 className="text-sm font-black uppercase tracking-wide text-white">{insight.title}</h3>
                </div>
                <p className="text-xs leading-5 text-white/70">
                  {insight.description}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
