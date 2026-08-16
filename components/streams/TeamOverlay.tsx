'use client';

/**
 * TeamOverlay - Zeigt 6 kleine Team-Sprites als Overlay auf einem Stream
 */

import { useSpriteMode } from '@/lib/contexts/SpriteContext';
import { getSpriteUrl } from '@/lib/sprite-utils';

interface TeamPokemon {
  pokedexId: number;
  name: string;
  nameGerman: string | null;
  spriteUrl: string | null;
  spriteGifUrl: string | null;
}

interface TeamEncounter {
  teamSlot: number | null;
  pokemon: TeamPokemon;
}

interface TeamOverlayProps {
  encounters: TeamEncounter[];
}

export default function TeamOverlay({ encounters }: TeamOverlayProps) {
  const { spriteMode } = useSpriteMode();

  // 6 Slots befüllen
  const slots = Array.from({ length: 6 }, (_, i) => {
    return encounters.find(e => e.teamSlot === i + 1) || null;
  });

  return (
    <div className="pointer-events-none absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 gap-1 border-x border-t border-white/25 bg-black/80 px-2 py-1 sm:gap-2 sm:px-4">
      {slots.map((slot, i) => (
        <div key={i} className="flex h-10 w-10 items-center justify-center sm:h-14 sm:w-14">
          {slot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getSpriteUrl(slot.pokemon, spriteMode) || ''}
              alt={slot.pokemon.nameGerman || slot.pokemon.name}
              className="h-9 w-9 object-contain pixelated sm:h-12 sm:w-12"
            />
          ) : (
            <div className="h-7 w-7 border border-dashed border-white/35 bg-white/5" />
          )}
        </div>
      ))}
    </div>
  );
}
