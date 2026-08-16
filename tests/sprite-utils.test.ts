import { describe, expect, it } from 'vitest';
import { getSpriteUrl } from '@/lib/sprite-utils';

describe('getSpriteUrl', () => {
  const pokemon = {
    spriteUrl: '/sprites/static.png',
    spriteGifUrl: '/sprites/animated.gif',
  };

  it('verwendet im GIF-Modus den animierten Sprite', () => {
    expect(getSpriteUrl(pokemon, 'animated')).toBe('/sprites/animated.gif');
  });

  it('fällt ohne GIF auf den statischen Sprite zurück', () => {
    expect(getSpriteUrl({ ...pokemon, spriteGifUrl: null }, 'animated')).toBe('/sprites/static.png');
  });

  it('verwendet im statischen Modus immer den statischen Sprite', () => {
    expect(getSpriteUrl(pokemon, 'static')).toBe('/sprites/static.png');
  });
});
