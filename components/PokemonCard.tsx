/**
 * Pokémon-Karte Komponente
 * Modernes Design mit farbigen Karten basierend auf Typ
 * Performance: Mit React.memo für weniger Re-Renders
 */

'use client';

import Image from 'next/image';
import { parseTypes } from '@/lib/typeEffectiveness';
import { getTypeColor, hexToRgb } from '@/lib/design-tokens';
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
  size?: 'tiny' | 'small' | 'medium' | 'large';
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
  /** K.O. Status - zeigt grayscale + Overlay */
  isKnockedOut?: boolean;
  /** Zeige BP-Summe statt Pokedex-Nummer (nur wenn stats vorhanden) */
  showBPSum?: boolean;
  /** Zeige Stats beim Hover (nur für Team-Ansicht) */
  showStatsOnHover?: boolean;
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
  isKnockedOut = false,
  showBPSum = false,
  showStatsOnHover = false,
}: PokemonCardProps) {
  const types = parseTypes(pokemon.types);
  const primaryType = types[0] || 'normal';
  const typeColor = getTypeColor(primaryType);
  const [isHovered, setIsHovered] = useState(false);
  const { spriteMode } = useSpriteMode();
  const displaySpriteUrl = getSpriteUrl(pokemon, spriteMode);

  // Berechne BP-Summe wenn stats vorhanden
  const bpSum = stats
    ? stats.hp + stats.attack + stats.defense + stats.spAttack + stats.spDefense + stats.speed
    : 0;
  
  const sizeClasses = {
    tiny: {
      card: 'p-3',
      image: 'w-16 h-16',
      name: 'text-xs',
      number: 'text-[10px]',
    },
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
      className={`relative rounded-xl border-2 transition-all duration-300 cursor-pointer overflow-hidden h-full flex flex-col ${currentSize.card} bg-[var(--card-bg)] hover:scale-105 hover:shadow-[0_0_25px_rgba(var(--player-color-rgb),0.4)] ${
        isKnockedOut ? 'grayscale opacity-70' : ''
      }`}
      style={{
        borderColor: isHovered
          ? `rgba(${hexToRgb(typeColor)}, 0.6)`
          : `rgba(${hexToRgb(typeColor)}, 0.2)`,
        '--player-color': typeColor,
        '--player-color-rgb': hexToRgb(typeColor),
      } as React.CSSProperties}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* K.O. Overlay */}
      {isKnockedOut && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl z-20 pointer-events-none">
          <span className="text-6xl drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">💀</span>
        </div>
      )}

      {/* Stats Hover Overlay */}
      {showStatsOnHover && stats && isHovered && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 rounded-xl z-20 pointer-events-none p-2">
          <div className="text-white text-[10px] space-y-0.5 w-full">
            <div className="flex justify-between px-1">
              <span>KP:</span>
              <span className="font-bold">{stats.hp}</span>
            </div>
            <div className="flex justify-between px-1">
              <span>Angr:</span>
              <span className="font-bold">{stats.attack}</span>
            </div>
            <div className="flex justify-between px-1">
              <span>Vert:</span>
              <span className="font-bold">{stats.defense}</span>
            </div>
            <div className="flex justify-between px-1">
              <span>Sp.A:</span>
              <span className="font-bold">{stats.spAttack}</span>
            </div>
            <div className="flex justify-between px-1">
              <span>Sp.V:</span>
              <span className="font-bold">{stats.spDefense}</span>
            </div>
            <div className="flex justify-between px-1">
              <span>Init:</span>
              <span className="font-bold">{stats.speed}</span>
            </div>
          </div>
        </div>
      )}
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
      <div className={`relative ${currentSize.image} mx-auto ${size === 'tiny' ? 'mb-2' : 'mb-3'} transition-all duration-300 ${isHovered ? 'scale-110 animate-[bounce-subtle_0.4s_ease-in-out]' : 'scale-100'}`}>
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

      {/* Name und Nummer/BP */}
      <div className={`text-center ${size === 'tiny' ? 'mb-2' : 'mb-3'}`}>
        <p className={`${currentSize.number} font-semibold text-[var(--text-tertiary)] mb-0.5`}>
          {showBPSum && stats ? `BP: ${bpSum}` : `N°${String(pokemon.pokedexId).padStart(3, '0')}`}
        </p>
        <h3 className={`${currentSize.name} font-bold text-[var(--foreground)} ${size === 'tiny' ? 'mb-0.5 leading-tight' : 'mb-1'}`}>
          {pokemon.nameGerman || pokemon.name}
        </h3>
        {nickname && (
          <p className={`${size === 'tiny' ? 'text-[10px]' : 'text-xs'} text-[var(--text-secondary)] italic line-clamp-1`}>&quot;{nickname}&quot;</p>
        )}
      </div>

      {/* Typ-Badges - feste Mindesthöhe für konsistente Kartengröße */}
      <div className={`flex flex-col items-center justify-end gap-1 mt-auto ${size === 'tiny' ? 'min-h-[40px]' : size === 'small' ? 'min-h-[52px]' : 'min-h-[60px]'}`}>
        {types.map((type) => (
          <TypeBadge key={type} type={type} size={size === 'tiny' || size === 'small' ? 'sm' : 'md'} />
        ))}
      </div>

      {/* Stats (optional) */}
      {showStats && stats && (
        <div className="mt-4 text-xs space-y-1 bg-[var(--background-secondary)] rounded-lg p-2 border border-[var(--border-default)]">
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">HP:</span>
            <span className="font-semibold text-[var(--foreground)]">{stats.hp}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Angriff:</span>
            <span className="font-semibold text-[var(--foreground)]">{stats.attack}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Verteidigung:</span>
            <span className="font-semibold text-[var(--foreground)]">{stats.defense}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Sp. Ang.:</span>
            <span className="font-semibold text-[var(--foreground)]">{stats.spAttack}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Sp. Vert.:</span>
            <span className="font-semibold text-[var(--foreground)]">{stats.spDefense}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Initiative:</span>
            <span className="font-semibold text-[var(--foreground)]">{stats.speed}</span>
          </div>
        </div>
      )}
    </div>
  );
});

export default PokemonCard;

