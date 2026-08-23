/**
 * Public API: Pokemon
 * GET /api/pokemon - Liste aller gecachten Pokémon
 * Performance: Mit unstable_cache für Server-Side Caching
 */

import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import { POKEMON_LIST_CACHE_TAG } from '@/lib/pokemon-cache.server';

// Performance: Server-Side Cache für Pokémon-Daten (5 Minuten)
const getCachedPokemonList = unstable_cache(
  async () => {
    return prisma.pokemon.findMany({
      select: {
        id: true,
        pokedexId: true,
        name: true,
        nameGerman: true,
        types: true,
        hp: true,
        attack: true,
        defense: true,
        spAttack: true,
        spDefense: true,
        speed: true,
        spriteUrl: true,
        spriteGifUrl: true,
      },
      orderBy: { pokedexId: 'asc' },
    });
  },
  ['pokemon-list'],
  { revalidate: 300, tags: [POKEMON_LIST_CACHE_TAG] } // 5 Minuten
);

export async function GET() {
  try {
    const pokemon = await getCachedPokemonList();
    const count = pokemon.length;

    return NextResponse.json({
      pokemon,
      count,
    }, {
      headers: {
        // Die DB-Abfrage bleibt serverseitig getaggt gecacht. Der HTTP-Client
        // muss nach einer Live-Revision aber garantiert die neue Liste sehen.
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error fetching pokemon:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Pokémon' },
      { status: 500 }
    );
  }
}

