/**
 * Public API: Pokemon Evolutions
 * GET /api/pokemon/[pokedexId]/evolutions - Holt alle Vor- und Nachentwicklungen
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchEvolutionChain } from '@/lib/pokeapi';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pokedexId: string }> }
) {
  try {
    const { pokedexId: pokedexIdStr } = await params;
    const pokedexId = parseInt(pokedexIdStr, 10);

    if (isNaN(pokedexId) || pokedexId < 1) {
      return NextResponse.json(
        { error: 'Ungültige Pokédex-ID' },
        { status: 400 }
      );
    }

    const evolutionChain = await fetchEvolutionChain(pokedexId);

    return NextResponse.json(evolutionChain);
  } catch (error) {
    console.error('Error fetching evolution chain:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Evolutionen' },
      { status: 500 }
    );
  }
}
