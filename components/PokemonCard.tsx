/**
 * Pokémon-Karte Komponente
 * Zeigt ein Pokémon mit Sprite, Name, Typen und optional Nickname an
 */

import Image from 'next/image';
import { parseTypes } from '@/lib/typeEffectiveness';

interface PokemonCardProps {
  pokemon: {
    pokedexId: number;
    name: string;
    nameGerman: string | null;
    types: string;
    spriteUrl: string | null;
  };
  nickname?: string | null;
  size?: 'small' | 'medium' | 'large';
  showStats?: boolean;
  stats?: {
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
}

// Typ-Farben für bessere Visualisierung
const typeColors: { [key: string]: string } = {
  normal: 'bg-gray-400',
  fire: 'bg-red-500',
  water: 'bg-blue-500',
  electric: 'bg-yellow-400',
  grass: 'bg-green-500',
  ice: 'bg-cyan-300',
  fighting: 'bg-red-700',
  poison: 'bg-purple-500',
  ground: 'bg-yellow-600',
  flying: 'bg-indigo-400',
  psychic: 'bg-pink-500',
  bug: 'bg-lime-500',
  rock: 'bg-yellow-700',
  ghost: 'bg-purple-700',
  dragon: 'bg-indigo-700',
  dark: 'bg-gray-700',
  steel: 'bg-gray-500',
  fairy: 'bg-pink-300',
};

// Typ-Übersetzungen Englisch -> Deutsch
const typeTranslations: { [key: string]: string } = {
  normal: 'Normal',
  fire: 'Feuer',
  water: 'Wasser',
  electric: 'Elektro',
  grass: 'Pflanze',
  ice: 'Eis',
  fighting: 'Kampf',
  poison: 'Gift',
  ground: 'Boden',
  flying: 'Flug',
  psychic: 'Psycho',
  bug: 'Käfer',
  rock: 'Gestein',
  ghost: 'Geist',
  dragon: 'Drache',
  dark: 'Unlicht',
  steel: 'Stahl',
  fairy: 'Fee',
};

export default function PokemonCard({
  pokemon,
  nickname,
  size = 'medium',
  showStats = false,
  stats,
}: PokemonCardProps) {
  const types = parseTypes(pokemon.types);
  
  const sizeClasses = {
    small: 'w-20 h-20',
    medium: 'w-32 h-32',
    large: 'w-48 h-48',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
      {/* Sprite */}
      <div className={`relative ${sizeClasses[size]} mx-auto mb-2`}>
        {pokemon.spriteUrl ? (
          <Image
            src={pokemon.spriteUrl}
            alt={pokemon.name}
            fill
            className="object-contain"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded">
            <span className="text-gray-400 text-sm">Kein Bild</span>
          </div>
        )}
      </div>

      {/* Name */}
      <div className="text-center">
        <p className="text-xs text-gray-500">#{pokemon.pokedexId}</p>
        <h3 className="font-bold text-lg">
          {pokemon.nameGerman || pokemon.name}
        </h3>
        {nickname && (
          <p className="text-sm text-gray-600 italic">&quot;{nickname}&quot;</p>
        )}
      </div>

      {/* Typen */}
      <div className="flex justify-center gap-2 mt-2 flex-wrap">
        {types.map((type) => (
          <span
            key={type}
            className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${
              typeColors[type] || 'bg-gray-400'
            }`}
          >
            {typeTranslations[type] || type}
          </span>
        ))}
      </div>

      {/* Stats (optional) */}
      {showStats && stats && (
        <div className="mt-4 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">HP:</span>
            <span className="font-semibold">{stats.hp}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Angriff:</span>
            <span className="font-semibold">{stats.attack}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Verteidigung:</span>
            <span className="font-semibold">{stats.defense}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Sp. Ang.:</span>
            <span className="font-semibold">{stats.spAttack}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Sp. Vert.:</span>
            <span className="font-semibold">{stats.spDefense}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Initiative:</span>
            <span className="font-semibold">{stats.speed}</span>
          </div>
        </div>
      )}
    </div>
  );
}

