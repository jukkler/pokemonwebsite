/**
 * Admin API: Einzelner Encounter
 * PUT /api/admin/encounters/[id] - Encounter aktualisieren (Legacy)
 * PATCH /api/admin/encounters/[id] - Pokémon/Spitzname einzeln ändern
 * DELETE /api/admin/encounters/[id] - Reparatur-API für einen Encounter
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
import {
  buildEncounterAdminUpdate,
  parseEncounterAdminAction,
  type EncounterAdminResponse,
} from '@/lib/encounter-admin';
import {
  encounterAdminInclude,
  serializeEncounterAdminTarget,
} from '@/lib/encounter-admin.server';

// PATCH: Nur individuelle Pokémon-/Spitznamenattribute ändern.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAdminAuthAndErrorHandling(async () => {
    const { id } = await params;
    let encounterId: number;
    try {
      encounterId = parseId(id, 'Encounter-ID');
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : 'Ungültige ID');
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest('Der Request-Body muss gültiges JSON enthalten');
    }

    const parsed = parseEncounterAdminAction(body);
    if (!parsed.ok) return badRequest(parsed.error);

    try {
      const update = buildEncounterAdminUpdate(parsed.action);
      if (!update.ok) return badRequest(update.error);
      const encounter = await prisma.encounter.update({
        where: { id: encounterId },
        data: update.data,
        include: encounterAdminInclude,
      });
      const response: EncounterAdminResponse = {
        success: true,
        encounter: serializeEncounterAdminTarget(encounter),
      };
      return NextResponse.json(response);
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2025') {
        return NextResponse.json({ error: 'Encounter nicht gefunden' }, { status: 404 });
      }
      if (prismaError.code === 'P2003') return badRequest('Ungültige Pokémon-ID');
      throw error;
    }
  }, 'administering encounter');
}

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

