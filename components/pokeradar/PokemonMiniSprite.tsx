'use client';

import Image from 'next/image';
import { useSpriteMode } from '@/lib/contexts/SpriteContext';
import { getSpriteUrl } from '@/lib/sprite-utils';
import type { Pokemon } from '@/lib/types';

interface PokemonMiniSpriteProps {
  pokemon: Pick<Pokemon, 'spriteUrl' | 'spriteGifUrl'>;
  size?: 'inline' | 'xs' | 'sm' | 'md';
  className?: string;
}

const spriteSizes = {
  inline: { dimensions: 18, className: 'h-[18px] w-[18px]' },
  xs: { dimensions: 24, className: 'h-6 w-6' },
  sm: { dimensions: 32, className: 'h-8 w-8' },
  md: { dimensions: 40, className: 'h-10 w-10' },
} as const;

export default function PokemonMiniSprite({
  pokemon,
  size = 'md',
  className = '',
}: PokemonMiniSpriteProps) {
  const { spriteMode } = useSpriteMode();
  const spriteUrl = getSpriteUrl(pokemon, spriteMode);
  const sizeConfig = spriteSizes[size];

  if (!spriteUrl) {
    return (
      <span
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center text-[var(--text-tertiary)] ${sizeConfig.className} ${className}`}
      >
        <svg viewBox="0 0 24 24" className="h-3/4 w-3/4" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h6m6 0h6" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </span>
    );
  }

  return (
    <Image
      src={spriteUrl}
      alt=""
      width={sizeConfig.dimensions}
      height={sizeConfig.dimensions}
      unoptimized={spriteMode === 'animated'}
      className={`shrink-0 object-contain [image-rendering:pixelated] ${sizeConfig.className} ${className}`}
    />
  );
}
