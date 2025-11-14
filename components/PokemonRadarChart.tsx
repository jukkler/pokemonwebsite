'use client';

/**
 * Pokémon Radar Chart Komponente
 * Zeigt einen Radar Chart mit den Stats mehrerer Pokémon
 */

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
import { parseTypes, calculateDefensiveEffectiveness, typeNamesGerman } from '@/lib/typeEffectiveness';

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
}

interface PokemonRadarChartProps {
  pokemon: PokemonStats[];
  colors: string[];
}

type RadarDataPoint = {
  stat: string;
} & Record<string, number | string>;

export default function PokemonRadarChart({
  pokemon,
  colors,
}: PokemonRadarChartProps) {
  if (pokemon.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">Wähle Pokémon aus, um sie zu vergleichen</p>
      </div>
    );
  }

  // Transformiere Daten für Recharts
  const stats = ['HP', 'Angriff', 'Verteidigung', 'Sp. Ang.', 'Sp. Vert.', 'Initiative'];
  const statKeys = ['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed'];

  // Berechne dynamisches Maximum: Höchster Wert + 10%
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
  const dynamicMax = Math.ceil((maxValue * 1.1) / 10) * 10;

  const data = stats.map((stat, index) => {
    const dataPoint: RadarDataPoint = { stat };
    pokemon.forEach((p) => {
      const displayName = p.nameGerman || p.name;
      const statValue = p[statKeys[index] as keyof PokemonStats];
      dataPoint[displayName] = typeof statValue === 'number' ? statValue : 0;
    });
    return dataPoint;
  });

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

          return (
            <div 
              key={p.pokedexId} 
              className="bg-white rounded-lg p-4 border-l-4"
              style={{ borderLeftColor: colors[index % colors.length] }}
            >
              <h4 className="font-bold text-lg mb-2" style={{ color: colors[index % colors.length] }}>
                {displayName} <span className="text-sm text-gray-500">({types.map(t => typeNamesGerman[t] || t).join(', ')})</span>
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
          );
        })}
      </div>
    </div>
  );
}

