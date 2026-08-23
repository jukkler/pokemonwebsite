/**
 * Admin API: Pokemon Add
 * POST /api/admin/pokemon/add - Einzelnes Pokémon per Pokedex-ID hinzufügen
 */

import { NextRequest } from 'next/server';
import {
  withAdminAuthAndErrorHandling,
  parseId,
  validateRequired,
  badRequest,
  success,
} from '@/lib/api-utils';
import { fetchPokemonById } from '@/lib/pokeapi';
import prisma from '@/lib/prisma';
import { bumpLiveRevisions } from '@/lib/live-updates.server';
import { invalidatePokemonListCache } from '@/lib/pokemon-cache.server';

export async function POST(request: NextRequest) {
  return withAdminAuthAndErrorHandling(async () => {
    const body = await request.json();
    validateRequired(body, ['pokedexId']);

    const id = parseId(String(body.pokedexId), 'Pokedex-ID');

    // ID muss zwischen 1 und 493 liegen (Gen 1-4)
    if (id < 1 || id > 493) {
      return badRequest('Pokedex-ID muss zwischen 1 und 493 liegen');
    }

    const pokemon = await fetchPokemonById(id);
    invalidatePokemonListCache();
    await bumpLiveRevisions(prisma, ['pokemon']);

    return success({
      pokemon,
      message: `Pokémon #${id} erfolgreich hinzugefügt`,
    });
  }, 'adding pokemon');
}
