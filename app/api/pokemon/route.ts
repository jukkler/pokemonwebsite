/**
 * Public API: Pokemon
 * GET /api/pokemon - Liste aller gecachten Pokémon
 */

import { NextResponse } from 'next/server';
import { getAllCachedPokemon, getCachedPokemonCount } from '@/lib/pokeapi';

export async function GET() {
  try {
    const pokemon = await getAllCachedPokemon();
    const count = await getCachedPokemonCount();

    return NextResponse.json({
      pokemon,
      count,
    });
  } catch (error) {
    console.error('Error fetching pokemon:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Pokémon' },
      { status: 500 }
    );
  }
}

