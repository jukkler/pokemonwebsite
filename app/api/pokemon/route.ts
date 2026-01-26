/**
 * Public API: Pokemon
 * GET /api/pokemon - Liste aller gecachten Pokémon
 * Performance: Mit unstable_cache für Server-Side Caching
 */

import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';

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
  { revalidate: 300 } // 5 Minuten
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
        // Pokémon-Daten ändern sich selten - längeres Caching
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
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

