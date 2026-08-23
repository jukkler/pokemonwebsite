/**
 * Admin API: Pokémon entwickeln
 * POST /api/admin/encounters/[id]/evolve - Entwickelt ein Pokémon zu einer Vor- oder Nachentwicklung
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withAdminAuthAndErrorHandling,
  parseId,
  validateRequired,
  badRequest,
  notFound,
} from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { isInEvolutionChain, fetchPokemonById } from '@/lib/pokeapi';
import { bumpLiveRevisions } from '@/lib/live-updates.server';
import { invalidatePokemonListCache } from '@/lib/pokemon-cache.server';

// POST: Pokémon entwickeln
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuthAndErrorHandling(async () => {
    const { id } = await params;
    let encounterId: number;

    try {
      encounterId = parseId(id, 'Encounter-ID');
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : 'Ungültige ID');
    }

    const body = await request.json();
    const { targetPokedexId } = body;

    try {
      validateRequired(body, ['targetPokedexId']);
    } catch (error) {
      return badRequest(
        error instanceof Error ? error.message : 'Ziel-Pokédex-ID ist erforderlich'
      );
    }

    const parsedTargetPokedexId = parseInt(String(targetPokedexId), 10);
    if (isNaN(parsedTargetPokedexId) || parsedTargetPokedexId < 1) {
      return badRequest('Ungültige Ziel-Pokédex-ID');
    }

    // 1. Encounter mit aktuellem Pokémon laden
    const encounter = await prisma.encounter.findUnique({
      where: { id: encounterId },
      include: { pokemon: true },
    });

    if (!encounter) {
      return notFound('Encounter nicht gefunden');
    }

    const currentPokedexId = encounter.pokemon.pokedexId;

    // 2. Prüfen, ob das Ziel-Pokémon in der Evolution-Chain ist
    const isValidEvolution = await isInEvolutionChain(currentPokedexId, parsedTargetPokedexId);
    if (!isValidEvolution) {
      return badRequest(
        `${parsedTargetPokedexId} ist keine gültige Entwicklung von ${currentPokedexId}`
      );
    }

    // 3. Ziel-Pokémon aus DB holen (oder von API fetchen falls nicht vorhanden)
    const targetPokemon = await fetchPokemonById(parsedTargetPokedexId);
    // fetchPokemonById darf den Cache anlegen/aktualisieren und laeuft wegen
    // externer Netzwerkzugriffe bewusst ausserhalb der Encounter-Transaktion.
    invalidatePokemonListCache();
    await bumpLiveRevisions(prisma, ['pokemon']);

    // 4. Encounter aktualisieren
    const updatedEncounter = await prisma.$transaction(async (tx) => {
      const changed = await tx.encounter.update({
        where: { id: encounterId },
        data: {
          pokemonId: targetPokemon.id,
        },
        include: {
          player: true,
          route: true,
          pokemon: true,
        },
      });
      await bumpLiveRevisions(tx, ['encounters']);
      return changed;
    });

    return NextResponse.json({
      success: true,
      encounter: updatedEncounter,
      message: `${encounter.pokemon.nameGerman || encounter.pokemon.name} wurde zu ${targetPokemon.nameGerman || targetPokemon.name} entwickelt!`,
    });
  }, 'evolving pokemon');
}
