/**
 * Sprite-Utilities
 * Hilfsfunktionen für die Sprite-Auswahl basierend auf dem Modus
 */

import type { SpriteMode } from './contexts/SpriteContext';

interface PokemonWithSprites {
  spriteUrl: string | null;
  spriteGifUrl?: string | null;
}

/**
 * Gibt die richtige Sprite-URL basierend auf dem Modus zurück
 * Falls kein GIF vorhanden ist, wird auf den statischen Sprite zurückgegriffen
 */
export function getSpriteUrl(
  pokemon: PokemonWithSprites | null | undefined,
  mode: SpriteMode
): string | null {
  if (!pokemon) return null;
  
  if (mode === 'animated' && pokemon.spriteGifUrl) {
    return pokemon.spriteGifUrl;
  }
  
  return pokemon.spriteUrl;
}

/**
 * Prüft, ob ein Pokemon einen animierten Sprite hat
 */
export function hasAnimatedSprite(pokemon: PokemonWithSprites | null | undefined): boolean {
  return !!pokemon?.spriteGifUrl;
}
