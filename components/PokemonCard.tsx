/**
 * Pokémon-Karte Komponente
 * Modernes Design mit farbigen Karten basierend auf Typ
 * Performance: Mit React.memo für weniger Re-Renders
 */

'use client';

import Image from 'next/image';
import { parseTypes } from '@/lib/typeEffectiveness';
import { getTypeColor } from '@/lib/design-tokens';
import TypeBadge from './ui/TypeBadge';
import { useState, memo } from 'react';
import { useSpriteMode } from '@/lib/contexts/SpriteContext';
import { getSpriteUrl } from '@/lib/sprite-utils';

interface PokemonCardProps {
  pokemon: {
    pokedexId: number;
    name: string;
    nameGerman: string | null;
    types: string;
    spriteUrl: string | null;
    spriteGifUrl?: string | null;
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
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  onClick?: () => void;
  /** Performance: Priorität für Above-the-Fold Bilder */
  priority?: boolean;
}

const PokemonCard = memo(function PokemonCard({
  pokemon,
  nickname,
  size = 'medium',
  showStats = false,
  stats,
  isFavorite = false,
  onFavoriteToggle,
  onClick,
  priority = false,
}: PokemonCardProps) {
  const types = parseTypes(pokemon.types);
  const primaryType = types[0] || 'normal';
  const typeColor = getTypeColor(primaryType);
  const [isHovered, setIsHovered] = useState(false);
  const { spriteMode } = useSpriteMode();
  const displaySpriteUrl = getSpriteUrl(pokemon, spriteMode);
  
  const sizeClasses = {
    small: {
      card: 'p-3 md:p-4',
      image: 'w-16 h-16 md:w-20 md:h-20',
      name: 'text-sm',
      number: 'text-xs',
    },
    medium: {
      card: 'p-4',
      image: 'w-24 h-24',
      name: 'text-base',
      number: 'text-xs',
    },
    large: {
      card: 'p-6',
      image: 'w-32 h-32',
      name: 'text-lg',
      number: 'text-sm',
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <div
      className={`relative rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden h-full flex flex-col ${currentSize.card}`}
      style={{
        backgroundColor: `${typeColor}15`,
        border: `2px solid ${typeColor}40`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Herz-Icon für Favoriten */}
      {onFavoriteToggle && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle();
          }}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors"
          aria-label={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
        >
          <svg
            className={`w-5 h-5 transition-colors ${
              isFavorite ? 'text-red-600 fill-current' : 'text-gray-400'
            }`}
            fill={isFavorite ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      )}

      {/* Pokémon-Bild */}
      <div className={`relative ${currentSize.image} mx-auto mb-3 transition-transform ${isHovered ? 'scale-110' : 'scale-100'}`}>
        {displaySpriteUrl ? (
          <Image
            src={displaySpriteUrl}
            alt={pokemon.nameGerman || pokemon.name}
            fill
            className="object-contain"
            unoptimized={spriteMode === 'animated'}
            priority={priority}
            loading={priority ? undefined : 'lazy'}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg">
            <span className="text-gray-400 text-xs">Kein Bild</span>
          </div>
        )}
      </div>

      {/* Name und Nummer */}
      <div className="text-center mb-3">
        <p className={`${currentSize.number} font-semibold text-gray-600 mb-1`}>
          N°{String(pokemon.pokedexId).padStart(3, '0')}
        </p>
        <h3 className={`${currentSize.name} font-bold text-gray-900 mb-1`}>
          {pokemon.nameGerman || pokemon.name}
        </h3>
        {nickname && (
          <p className="text-xs text-gray-500 italic">&quot;{nickname}&quot;</p>
        )}
      </div>

      {/* Typ-Badges - feste Mindesthöhe für konsistente Kartengröße */}
      <div className={`flex flex-col items-center justify-end gap-1.5 mt-auto ${size === 'small' ? 'min-h-[52px]' : 'min-h-[60px]'}`}>
        {types.map((type) => (
          <TypeBadge key={type} type={type} size={size === 'small' ? 'sm' : 'md'} />
        ))}
      </div>

      {/* Stats (optional) */}
      {showStats && stats && (
        <div className="mt-4 text-xs space-y-1 bg-white/50 rounded-lg p-2">
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
});

export default PokemonCard;

