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
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-1.5 pointer-events-none">
      {slots.map((slot, i) => (
        <div key={i} className="w-14 h-14 flex items-center justify-center">
          {slot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getSpriteUrl(slot.pokemon, spriteMode) || ''}
              alt={slot.pokemon.nameGerman || slot.pokemon.name}
              className="w-12 h-12 object-contain pixelated"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-600/50" />
          )}
        </div>
      ))}
    </div>
  );
}
