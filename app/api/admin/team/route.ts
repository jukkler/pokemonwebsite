/**
 * Admin API: Team Management
 * POST /api/admin/team - Team-Member hinzufügen/aktualisieren
 */

import { NextRequest } from 'next/server';
import {
  withAdminAuthAndErrorHandling,
  parseId,
  validateRequired,
  badRequest,
  created,
} from '@/lib/api-utils';
import prisma from '@/lib/prisma';

// POST: Team-Member setzen (upsert)
export async function POST(request: NextRequest) {
  return withAdminAuthAndErrorHandling(async () => {
    const body = await request.json();
    const { playerId, pokemonId, nickname, position } = body;

    // Validierung
    try {
      validateRequired(body, ['playerId', 'pokemonId', 'position']);
    } catch (error) {
      return badRequest(
        error instanceof Error
          ? error.message
          : 'Spieler, Pokémon und Position sind erforderlich'
      );
    }

    // Position-Validierung
    const positionNum = Number(position);
    if (isNaN(positionNum) || positionNum < 1 || positionNum > 6) {
      return badRequest('Position muss zwischen 1 und 6 liegen');
    }

    // IDs parsen
    let parsedPlayerId: number;
    let parsedPokemonId: number;

    try {
      parsedPlayerId = parseId(String(playerId), 'Spieler-ID');
      parsedPokemonId = parseId(String(pokemonId), 'Pokémon-ID');
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : 'Ungültige ID');
    }

    try {
      // Team-Member erstellen oder aktualisieren (upsert)
      const teamMember = await prisma.teamMember.upsert({
        where: {
          playerId_position: {
            playerId: parsedPlayerId,
            position: positionNum,
          },
        },
        update: {
          pokemonId: parsedPokemonId,
          nickname: nickname ? String(nickname).trim() : null,
        },
        create: {
          playerId: parsedPlayerId,
          pokemonId: parsedPokemonId,
          nickname: nickname ? String(nickname).trim() : null,
          position: positionNum,
        },
        include: {
          player: true,
          pokemon: true,
        },
      });

      return created(teamMember);
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2003') {
        return badRequest('Ungültige Spieler- oder Pokémon-ID');
      }
      throw error;
    }
  }, 'creating team member');
}

