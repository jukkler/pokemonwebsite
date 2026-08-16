'use client';

import { useMemo } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { Pokemon } from '@/lib/types';
import {
  DEFAULT_COMPARISON_COLORS,
  SeriesMarker,
  getPokemonDisplayName,
  getSeriesColor,
} from '@/components/pokeradar/comparison-ui';
import PokemonMiniSprite from '@/components/pokeradar/PokemonMiniSprite';

interface PokemonRadarChartProps {
  pokemon: Pokemon[];
  colors?: readonly string[];
  /** @deprecated Entfernen erfolgt jetzt in der Auswahlleiste. */
  onRemove?: (pokedexId: number) => void;
}

type RadarDataPoint = {
  stat: string;
} & Record<string, number | string>;

const STAT_DEFINITIONS = [
  { key: 'hp', label: 'KP' },
  { key: 'attack', label: 'Angriff' },
  { key: 'defense', label: 'Verteidigung' },
  { key: 'spAttack', label: 'Sp. Angriff' },
  { key: 'spDefense', label: 'Sp. Verteidigung' },
  { key: 'speed', label: 'Initiative' },
] as const;

const SERIES_DASHES = [undefined, '9 4', '3 3', '12 4 3 4', '2 4', '14 5'] as const;

function RadarTooltipContent({
  active,
  payload,
  label,
  pokemon,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{
    color?: string;
    dataKey?: string | number;
    value?: unknown;
  }>;
  label?: string | number;
  pokemon: Pokemon[];
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-44 border border-[var(--border-default)] bg-[var(--card-bg)] p-3 text-[var(--foreground)] shadow-[var(--shadow-md)]">
      <p className="mb-2 text-sm font-bold">{label}</p>
      <div className="space-y-1.5">
        {payload.map((item) => {
          const pokedexId = Number(String(item.dataKey).replace('pokemon-', ''));
          const entry = pokemon.find((candidate) => candidate.pokedexId === pokedexId);
          if (!entry) return null;

          return (
            <div key={entry.pokedexId} className="flex items-center gap-2 text-xs">
              <PokemonMiniSprite pokemon={entry} size="xs" />
              <span className="min-w-0 flex-1 truncate font-semibold">
                {getPokemonDisplayName(entry)}
              </span>
              <span className="font-bold tabular-nums" style={{ color: item.color }}>
                {String(item.value ?? '–')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PokemonRadarChart({
  pokemon,
  colors = DEFAULT_COMPARISON_COLORS,
  onRemove,
}: PokemonRadarChartProps) {
  void onRemove;

  const data = useMemo(() => {
    return STAT_DEFINITIONS.map(({ key, label }) => {
      const point: RadarDataPoint = { stat: label };

      pokemon.forEach((entry) => {
        point[`pokemon-${entry.pokedexId}`] = entry[key];
      });

      return point;
    });
  }, [pokemon]);

  if (pokemon.length === 0) {
    return (
      <div className="border border-dashed border-[var(--border-default)] bg-[var(--background-secondary)] px-4 py-10 text-center text-sm text-[var(--text-secondary)]">
        Wähle mindestens ein Pokémon aus, um das Basiswert-Profil zu öffnen.
      </div>
    );
  }

  return (
    <div className="w-full" aria-label="Radar-Profil der ausgewählten Pokémon">
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2" aria-label="Legende">
        {pokemon.map((entry, index) => (
          <div
            key={entry.pokedexId}
            className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]"
          >
            <SeriesMarker index={index} colors={colors} size="sm" />
            <PokemonMiniSprite pokemon={entry} size="xs" />
            <span
              aria-hidden="true"
              className="w-7 border-t-2"
              style={{
                borderColor: getSeriesColor(index, colors),
                borderTopStyle: index === 0 ? 'solid' : 'dashed',
              }}
            />
            <span>{getPokemonDisplayName(entry)}</span>
          </div>
        ))}
      </div>

      <p className="mb-2 text-xs leading-5 text-[var(--text-secondary)]">
        Alle Achsen verwenden denselben festen Wertebereich von 0 bis 255. Die Linien unterscheiden
        sich zusätzlich durch Nummern und Muster.
      </p>

      <div className="h-80 w-full md:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} accessibilityLayer>
            <PolarGrid stroke="var(--border-default)" />
            <PolarAngleAxis
              dataKey="stat"
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 255]}
              tickCount={6}
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            />
            {pokemon.map((entry, index) => (
              <Radar
                key={entry.pokedexId}
                name={`${index + 1}. ${getPokemonDisplayName(entry)}`}
                dataKey={`pokemon-${entry.pokedexId}`}
                stroke={getSeriesColor(index, colors)}
                strokeWidth={2.5}
                strokeDasharray={SERIES_DASHES[index % SERIES_DASHES.length]}
                fill={getSeriesColor(index, colors)}
                fillOpacity={0.1}
                dot={{ r: 2.5, fill: getSeriesColor(index, colors) }}
              />
            ))}
            <Tooltip
              content={(props) => <RadarTooltipContent {...props} pokemon={pokemon} />}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="app-data-table w-full min-w-[640px] text-sm">
          <caption className="pb-2 text-left text-xs text-[var(--text-secondary)]">
            Exakte Basiswerte zur Profilansicht
          </caption>
          <thead>
            <tr>
              <th>Basiswert</th>
              {pokemon.map((entry, index) => (
                <th key={entry.pokedexId}>
                  {index + 1}. {getPokemonDisplayName(entry)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STAT_DEFINITIONS.map(({ key, label }) => (
              <tr key={key}>
                <th>{label}</th>
                {pokemon.map((entry) => (
                  <td key={entry.pokedexId} className="font-bold tabular-nums">{entry[key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
