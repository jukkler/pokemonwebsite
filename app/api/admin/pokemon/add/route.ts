/**
 * Admin API: Pokemon Add
 * POST /api/admin/pokemon/add - Einzelnes Pokémon per Pokedex-ID hinzufügen
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { fetchPokemonById } from '@/lib/pokeapi';

// POST: Einzelnes Pokémon hinzufügen
export async function POST(request: NextRequest) {
  try {
    // Auth-Check
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await request.json();
    const { pokedexId } = body;

    // Validierung
    if (!pokedexId || isNaN(parseInt(pokedexId))) {
      return NextResponse.json(
        { error: 'Gültige Pokedex-ID ist erforderlich' },
        { status: 400 }
      );
    }

    const id = parseInt(pokedexId);

    // ID muss zwischen 1 und 493 liegen (Gen 1-4)
    if (id < 1 || id > 493) {
      return NextResponse.json(
        { error: 'Pokedex-ID muss zwischen 1 und 493 liegen' },
        { status: 400 }
      );
    }

    // Pokémon holen und cachen
    const pokemon = await fetchPokemonById(id);

    return NextResponse.json({
      success: true,
      pokemon,
      message: `Pokémon #${id} erfolgreich hinzugefügt`,
    });
  } catch (error) {
    console.error('Error adding pokemon:', error);
    return NextResponse.json(
      { error: 'Fehler beim Hinzufügen des Pokémon' },
      { status: 500 }
    );
  }
}

