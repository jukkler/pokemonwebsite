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
  { key: 'hp', label: 'KP', color: 'text-red-500' },
  { key: 'attack', label: 'Ang.', color: 'text-orange-500' },
  { key: 'defense', label: 'Vert.', color: 'text-yellow-500' },
  { key: 'spAttack', label: 'Sp.A', color: 'text-blue-500' },
  { key: 'spDefense', label: 'Sp.V', color: 'text-green-500' },
  { key: 'speed', label: 'Init.', color: 'text-pink-500' },
] as const;

const multiplierColors: Record<string, string> = {
  '0x': 'text-purple-400',
  '0.25x': 'text-green-400',
  '0.5x': 'text-blue-400',
  '2x': 'text-orange-400',
  '4x': 'text-red-400',
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
    <div className="flex flex-col flex-1">
      {/* Basispunkte */}
      <div className="mt-2 bg-[var(--background-secondary)] rounded-lg p-2 border border-[var(--border-default)] w-full">
        <div className="text-xs font-bold text-[var(--foreground)] mb-1.5 text-center">
          Basispunkte
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-xs">
          {statConfig.map(({ key, label, color }) => (
            <div key={key} className="text-center">
              <div className="text-[var(--text-secondary)] mb-0.5">{label}</div>
              <div className={`font-bold ${color}`}>
                {pokemon[key as keyof typeof pokemon]}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-[var(--border-default)] text-center">
          <span className="text-xs text-[var(--text-secondary)]">Gesamt:</span>
          <span className="text-xs font-bold text-purple-400 ml-1">{totalStats}</span>
        </div>
      </div>

      {/* Typ-Effektivität */}
      {showEffectiveness && (
        <div className="mt-2 bg-blue-500/10 rounded-lg p-2 border border-blue-500/30 w-full h-[180px] flex flex-col overflow-y-auto">
          {hasTypeEffectiveness ? (
            <>
              <div className="text-xs font-bold text-blue-400 mb-1">
                Typ-Effektivität
              </div>
              <div className="space-y-1">
                {relevantMultipliers.map(mult => (
                  <div key={mult} className="text-xs">
                    <span className={`font-bold ${multiplierColors[mult] || 'text-[var(--foreground)]'}`}>
                      {mult}:
                    </span>{' '}
                    <span className="text-[var(--text-secondary)]">
                      {effectiveness[mult].join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
