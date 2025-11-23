/**
 * Admin API: Encounters CRUD
 * GET /api/admin/encounters - Liste aller Encounters
 * POST /api/admin/encounters - Neuen Encounter erstellen
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withAdminAuthAndErrorHandling,
  validateRequired,
  parseId,
  badRequest,
  created,
  conflict,
} from '@/lib/api-utils';
import prisma from '@/lib/prisma';

// GET: Alle Encounters abrufen
export async function GET() {
  return withAdminAuthAndErrorHandling(async () => {
    const encounters = await prisma.encounter.findMany({
      include: {
        player: true,
        route: true,
        pokemon: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(encounters);
  }, 'fetching encounters');
}

// POST: Neuen Encounter erstellen
export async function POST(request: NextRequest) {
  return withAdminAuthAndErrorHandling(async () => {
    const body = await request.json();
    const { playerId, routeId, pokemonId, nickname } = body;

    // Validierung
    try {
      validateRequired(body, ['playerId', 'routeId', 'pokemonId']);
    } catch (error) {
      return badRequest(
        error instanceof Error
          ? error.message
          : 'Spieler, Route und Pokémon sind erforderlich'
      );
    }

    // IDs parsen
    let parsedPlayerId: number;
    let parsedRouteId: number;
    let parsedPokemonId: number;

    try {
      parsedPlayerId = parseId(String(playerId), 'Spieler-ID');
      parsedRouteId = parseId(String(routeId), 'Routen-ID');
      parsedPokemonId = parseId(String(pokemonId), 'Pokémon-ID');
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : 'Ungültige ID');
    }

    // REGEL: Prüfe, ob Spieler bereits ein Pokémon auf dieser Route hat
    const existingEncounter = await prisma.encounter.findFirst({
      where: {
        playerId: parsedPlayerId,
        routeId: parsedRouteId,
      },
      include: {
        pokemon: true,
        route: true,
      },
    });

    if (existingEncounter) {
      const pokemonName =
        existingEncounter.pokemon.nameGerman || existingEncounter.pokemon.name;
      return conflict(
        `Dieser Spieler hat bereits ein Pokémon auf dieser Route gefangen: ${pokemonName} auf ${existingEncounter.route.name}. Jeder Spieler darf nur 1 Pokémon pro Route fangen.`
      );
    }

    try {
      // Encounter erstellen
      const encounter = await prisma.encounter.create({
        data: {
          playerId: parsedPlayerId,
          routeId: parsedRouteId,
          pokemonId: parsedPokemonId,
          nickname: nickname ? String(nickname).trim() : null,
        },
        include: {
          player: true,
          route: true,
          pokemon: true,
        },
      });

      return created(encounter);
    } catch (error) {
      // Spezifische Fehlerbehandlung
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2003') {
        return badRequest('Ungültige Spieler-, Routen- oder Pokémon-ID');
      }
      if (prismaError.code === 'P2002') {
        return conflict(
          'Dieser Spieler hat bereits ein Pokémon auf dieser Route gefangen. Jeder Spieler darf nur 1 Pokémon pro Route fangen.'
        );
      }
      throw error;
    }
  }, 'creating encounter');
}

