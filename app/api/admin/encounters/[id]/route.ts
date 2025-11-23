/**
 * Admin API: Einzelner Encounter
 * PUT /api/admin/encounters/[id] - Encounter aktualisieren
 * DELETE /api/admin/encounters/[id] - Encounter löschen
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withAdminAuthAndErrorHandling,
  parseId,
  validateRequired,
  badRequest,
  success,
} from '@/lib/api-utils';
import prisma from '@/lib/prisma';

// PUT: Encounter aktualisieren (Pokémon/Nickname)
export async function PUT(
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
    const { pokemonId, nickname } = body;

    try {
      validateRequired(body, ['pokemonId']);
    } catch (error) {
      return badRequest(
        error instanceof Error ? error.message : 'Pokémon-ID ist erforderlich'
      );
    }

    let parsedPokemonId: number;
    try {
      parsedPokemonId = parseId(String(pokemonId), 'Pokémon-ID');
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : 'Ungültige Pokémon-ID');
    }

    try {
      const updatedEncounter = await prisma.encounter.update({
        where: { id: encounterId },
        data: {
          pokemonId: parsedPokemonId,
          nickname: nickname?.trim() ? nickname.trim() : null,
        },
        include: {
          player: true,
          route: true,
          pokemon: true,
        },
      });

      return NextResponse.json(updatedEncounter);
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2025') {
        return NextResponse.json({ error: 'Encounter nicht gefunden' }, { status: 404 });
      }
      if (prismaError.code === 'P2003') {
        return badRequest('Ungültige Pokémon-ID');
      }
      throw error;
    }
  }, 'updating encounter');
}

// DELETE: Encounter löschen
export async function DELETE(
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

    try {
      await prisma.encounter.delete({
        where: { id: encounterId },
      });

      return success();
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2025') {
        return NextResponse.json({ error: 'Encounter nicht gefunden' }, { status: 404 });
      }
      throw error;
    }
  }, 'deleting encounter');
}

