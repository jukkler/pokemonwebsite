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
import Image from 'next/image';
import { parseTypes, calculateDefensiveEffectiveness } from '@/lib/typeEffectiveness';
import TypeBadge from '@/components/ui/TypeBadge';
import { useSpriteMode } from '@/lib/contexts/SpriteContext';
import { getSpriteUrl } from '@/lib/sprite-utils';

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

export default function PokemonRadarChart({
  pokemon,
  colors,
  onRemove,
}: PokemonRadarChartProps) {
  const { spriteMode } = useSpriteMode();

  if (pokemon.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">Wähle Pokémon aus, um sie zu vergleichen</p>
      </div>
    );
  }

  // Konstanten für Stats
  const stats = ['HP', 'Angriff', 'Verteidigung', 'Sp. Ang.', 'Sp. Vert.', 'Initiative'];
  const statKeys = ['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed'];

  // Performance: Berechne dynamisches Maximum mit useMemo
  const dynamicMax = useMemo(() => {
    let maxValue = 0;
    pokemon.forEach((p) => {
      statKeys.forEach((key) => {
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
    return stats.map((stat, index) => {
      const dataPoint: RadarDataPoint = { stat };
      pokemon.forEach((p) => {
        const displayName = p.nameGerman || p.name;
        const statValue = p[statKeys[index] as keyof PokemonStats];
        dataPoint[displayName] = typeof statValue === 'number' ? statValue : 0;
      });
      return dataPoint;
    });
  }, [pokemon]);

  return (
    <div className="w-full">
      {/* Radar Chart */}
      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="stat" />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, dynamicMax]} 
              tick={{ fontSize: 12 }}
            />
            {pokemon.map((p, index) => {
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
            })}
            <Legend 
              layout="vertical"
              align="right"
              verticalAlign="middle"
            />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Typ-Effektivität */}
      <div className="mt-8 space-y-4">
        <h3 className="text-xl font-bold text-gray-900">Defensiv-Typ-Effektivität</h3>
        {pokemon.map((p, index) => {
          const displayName = p.nameGerman || p.name;
          const types = parseTypes(p.types);
          const effectiveness = calculateDefensiveEffectiveness(types);
          
          // Sortiere nach Multiplikator (0x, 0.25x, 0.5x, 2x, 4x)
          const sortedMultipliers = Object.keys(effectiveness).sort((a, b) => {
            const aVal = parseFloat(a.replace('x', '')) || 0;
            const bVal = parseFloat(b.replace('x', '')) || 0;
            return aVal - bVal;
          });

          const hasEffectiveness = sortedMultipliers.some(mult => 
            mult !== '1x' && effectiveness[mult] && effectiveness[mult].length > 0
          );

          const spriteUrl = getSpriteUrl(p, spriteMode);

          return (
            <div 
              key={p.pokedexId} 
              className="bg-white rounded-lg p-4 border-l-4"
              style={{ borderLeftColor: colors[index % colors.length] }}
            >
              <div className="flex items-start gap-3">
                {/* Sprite */}
                {spriteUrl && (
                  <div className="flex-shrink-0">
                    <Image
                      src={spriteUrl}
                      alt={displayName}
                      width={48}
                      height={48}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                )}
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2 flex-wrap" style={{ color: colors[index % colors.length] }}>
                    {displayName}
                    <div className="flex gap-1.5">
                      {types.map((type) => (
                        <TypeBadge key={type} type={type} size="sm" />
                      ))}
                    </div>
                  </h4>
                  {!hasEffectiveness ? (
                    <p className="text-gray-500 text-sm">Keine besonderen Typ-Effektivitäten (alle neutral)</p>
                  ) : (
                    <div className="flex flex-wrap gap-3 text-sm">
                      {sortedMultipliers.filter(mult => effectiveness[mult] && effectiveness[mult].length > 0 && mult !== '1x').map(mult => {
                      
                      let bgColor = 'bg-gray-100';
                      let textColor = 'text-gray-700';
                      
                      if (mult === '0x') {
                        bgColor = 'bg-purple-100';
                        textColor = 'text-purple-700';
                      } else if (mult === '0.25x') {
                        bgColor = 'bg-green-100';
                        textColor = 'text-green-700';
                      } else if (mult === '0.5x') {
                        bgColor = 'bg-blue-100';
                        textColor = 'text-blue-700';
                      } else if (mult === '2x') {
                        bgColor = 'bg-orange-100';
                        textColor = 'text-orange-700';
                      } else if (mult === '4x') {
                        bgColor = 'bg-red-100';
                        textColor = 'text-red-700';
                      }
                      
                        return (
                          <div key={mult} className={`${bgColor} ${textColor} px-3 py-2 rounded-lg`}>
                            <span className="font-bold">{mult}:</span> {effectiveness[mult].join(', ')}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                {onRemove && (
                  <button
                    onClick={() => onRemove(p.pokedexId)}
                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                    title={`${displayName} entfernen`}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

