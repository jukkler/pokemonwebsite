'use client';

/**
 * Pokémon Radar Chart Komponente
 * Zeigt einen Radar Chart mit den Stats mehrerer Pokémon
 * Performance: Mit useMemo für teure Berechnungen
 */

import { useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import dynamic from 'next/dynamic';
const DefensiveCoverageMatrix = dynamic(() => import('@/components/DefensiveCoverageMatrix'), {
  loading: () => <div className="animate-pulse bg-[var(--background-tertiary)] rounded-lg h-32" />,
  ssr: false,
});

interface PokemonStats {
  pokedexId: number;
  name: string;
  nameGerman: string | null;
  types: string;
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
  spriteUrl: string | null;
  spriteGifUrl: string | null;
}

interface PokemonRadarChartProps {
  pokemon: PokemonStats[];
  colors: string[];
  onRemove?: (pokedexId: number) => void;
}

type RadarDataPoint = {
  stat: string;
} & Record<string, number | string>;

const STAT_LABELS = [
  'HP',
  'Angriff',
  'Verteidigung',
  'Sp. Ang.',
  'Sp. Vert.',
  'Initiative',
] as const;
const STAT_KEYS = [
  'hp',
  'attack',
  'defense',
  'spAttack',
  'spDefense',
  'speed',
] as const;

export default function PokemonRadarChart({
  pokemon,
  colors,
  onRemove,
}: PokemonRadarChartProps) {
  void onRemove;

  // Performance: Berechne dynamisches Maximum mit useMemo
  const dynamicMax = useMemo(() => {
    if (pokemon.length === 0) return 100; // Default für leeren Zustand

    let maxValue = 0;
    pokemon.forEach((p) => {
      STAT_KEYS.forEach((key) => {
        const value = p[key as keyof PokemonStats] as number;
        if (value > maxValue) {
          maxValue = value;
        }
      });
    });
    // Maximum ist höchster Wert + 10%, aufgerundet auf nächste 10er-Stelle
    return Math.ceil((maxValue * 1.1) / 10) * 10;
  }, [pokemon]);

  // Performance: Transformiere Daten für Recharts mit useMemo
  const data = useMemo(() => {
    return STAT_LABELS.map((stat, index) => {
      const dataPoint: RadarDataPoint = { stat };

      // Wenn keine Pokemon, füge Dummy-Wert hinzu damit Grid gerendert wird
      if (pokemon.length === 0) {
        dataPoint['_placeholder'] = 0;
      } else {
        pokemon.forEach((p) => {
          const displayName = p.nameGerman || p.name;
          const statValue = p[STAT_KEYS[index] as keyof PokemonStats];
          dataPoint[displayName] = typeof statValue === 'number' ? statValue : 0;
        });
      }

      return dataPoint;
    });
  }, [pokemon]);

  return (
    <div className="w-full">
      {/* Radar Chart */}
      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="var(--border-default)" />
            <PolarAngleAxis
              dataKey="stat"
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, dynamicMax]}
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            />
            {pokemon.length === 0 ? (
              // Unsichtbarer Radar für Grid-Rendering wenn keine Pokemon
              <Radar
                name=""
                dataKey="_placeholder"
                stroke="transparent"
                fill="transparent"
                fillOpacity={0}
              />
            ) : (
              pokemon.map((p, index) => {
                const displayName = p.nameGerman || p.name;
                return (
                  <Radar
                    key={p.pokedexId}
                    name={displayName}
                    dataKey={displayName}
                    stroke={colors[index % colors.length]}
                    fill={colors[index % colors.length]}
                    fillOpacity={0.3}
                  />
                );
              })
            )}
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              wrapperStyle={{ color: 'var(--foreground)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                color: 'var(--foreground)',
              }}
              labelStyle={{ color: 'var(--foreground)' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Defensive Coverage Matrix */}
      <div className="mt-8">
        <DefensiveCoverageMatrix
          collapsible={false}
          maxSlots={6}
          teamMembers={pokemon.map((p, index) => ({
            id: p.pokedexId,
            nickname: null,
            teamSlot: index + 1,
            pokemon: {
              pokedexId: p.pokedexId,
              name: p.name,
              nameGerman: p.nameGerman,
              types: p.types,
              spriteUrl: p.spriteUrl,
              hp: p.hp,
              attack: p.attack,
              defense: p.defense,
              spAttack: p.spAttack,
              spDefense: p.spDefense,
              speed: p.speed,
            },
            route: {
              id: 0,
              name: '',
            },
            isKnockedOut: false,
            koCausedBy: null,
            koReason: null,
            koDate: null,
            isNotCaught: false,
            notCaughtBy: null,
            notCaughtReason: null,
            notCaughtDate: null,
          }))}
          playerColor={colors[0]}
        />
      </div>
    </div>
  );
}

