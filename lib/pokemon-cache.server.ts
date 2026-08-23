import { revalidateTag } from 'next/cache';

export const POKEMON_LIST_CACHE_TAG = 'pokemon-list';

/** Expires the public Pokemon list before its revision becomes observable. */
export function invalidatePokemonListCache(): void {
  revalidateTag(POKEMON_LIST_CACHE_TAG, { expire: 0 });
}
