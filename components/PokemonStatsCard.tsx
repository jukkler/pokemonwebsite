/**
 * PokemonStatsCard Komponente
 * Zeigt Basispunkte und Typ-Effektivität eines Pokémon
 */

'use client';

import TypeBadge from './ui/TypeBadge';
import { parseTypes, calculateDefensiveEffectiveness } from '@/lib/typeEffectiveness';

interface PokemonStatsCardProps {
  pokemon: {
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
    types: string;
  };
  showEffectiveness?: boolean;
}

const statConfig = [
  { key: 'hp', label: 'KP', color: 'text-red-600' },
  { key: 'attack', label: 'Ang.', color: 'text-orange-600' },
  { key: 'defense', label: 'Vert.', color: 'text-yellow-600' },
  { key: 'spAttack', label: 'Sp.A', color: 'text-blue-600' },
  { key: 'spDefense', label: 'Sp.V', color: 'text-green-600' },
  { key: 'speed', label: 'Init.', color: 'text-pink-600' },
] as const;

const multiplierColors: Record<string, string> = {
  '0x': 'text-purple-700',
  '0.25x': 'text-green-700',
  '0.5x': 'text-blue-700',
  '2x': 'text-orange-700',
  '4x': 'text-red-700',
};

export default function PokemonStatsCard({ 
  pokemon, 
  showEffectiveness = true 
}: PokemonStatsCardProps) {
  const totalStats = pokemon.hp + pokemon.attack + pokemon.defense + 
    pokemon.spAttack + pokemon.spDefense + pokemon.speed;
  
  const types = parseTypes(pokemon.types);
  const effectiveness = calculateDefensiveEffectiveness(types);
  
  const sortedMultipliers = Object.keys(effectiveness).sort((a, b) => {
    const aVal = parseFloat(a.replace('x', '')) || 0;
    const bVal = parseFloat(b.replace('x', '')) || 0;
    return aVal - bVal;
  });
  
  const relevantMultipliers = sortedMultipliers.filter(
    mult => mult !== '1x' && effectiveness[mult]?.length > 0
  );
  
  const hasTypeEffectiveness = relevantMultipliers.length > 0;

  return (
    <>
      {/* Basispunkte */}
      <div className="mt-2 bg-gray-50 rounded-lg p-2 border border-gray-200 w-full">
        <div className="text-xs font-bold text-gray-700 mb-1.5 text-center">
          Basispunkte
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-xs">
          {statConfig.map(({ key, label, color }) => (
            <div key={key} className="text-center">
              <div className="text-gray-500 mb-0.5">{label}</div>
              <div className={`font-bold ${color}`}>
                {pokemon[key as keyof typeof pokemon]}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-300 text-center">
          <span className="text-xs text-gray-500">Gesamt:</span>
          <span className="text-xs font-bold text-purple-700 ml-1">{totalStats}</span>
        </div>
      </div>

      {/* Typ-Effektivität */}
      {showEffectiveness && (
        <div className="mt-2 bg-blue-50 rounded-lg p-2 border border-blue-200 w-full min-h-[60px]">
          {hasTypeEffectiveness ? (
            <>
              <div className="text-xs font-bold text-blue-900 mb-1">
                Typ-Effektivität
              </div>
              <div className="space-y-1">
                {relevantMultipliers.map(mult => (
                  <div key={mult} className="text-xs">
                    <span className={`font-bold ${multiplierColors[mult] || 'text-gray-700'}`}>
                      {mult}:
                    </span>{' '}
                    <span className="text-gray-700">
                      {effectiveness[mult].join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      )}
    </>
  );
}
