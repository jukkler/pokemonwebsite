/**
 * Admin API: K.O.-Verwaltung für Routen
 * POST /api/admin/routes/[id]/knockout - Setzt alle Encounters einer Route K.O.
 * DELETE /api/admin/routes/[id]/knockout - Reaktiviert alle Encounters einer Route
 */

import { NextRequest } from 'next/server';
import {
  withAdminAuthAndErrorHandling,
  parseId,
  validateRequired,
  success,
} from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { emitEvent } from '@/lib/event-store';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuthAndErrorHandling(async () => {
    const { id } = await params;
    const routeId = parseId(id, 'Routen-ID');
    const body = await request.json();

    validateRequired(body, ['causedBy', 'reason']);
    const { causedBy, reason } = body;

    // Pokemon-Namen vor dem Update laden (für Event)
    const encounters = await prisma.encounter.findMany({
      where: { routeId },
      include: { pokemon: true, route: true, player: true },
    });

    const result = await prisma.encounter.updateMany({
      where: { routeId },
      data: {
        isKnockedOut: true,
        koCausedBy: String(causedBy).trim(),
        koReason: String(reason).trim(),
        koDate: new Date(),
        teamSlot: null,
      },
    });

    // Event emittieren (Pokemon des Verursachers)
    if (encounters.length > 0) {
      const causedByName = String(causedBy).trim();
      const match = encounters.find(e => e.player.name === causedByName) || encounters[0];
      emitEvent('pokemon_ko', {
        pokemonName: match.pokemon.name,
        pokemonNameGerman: match.pokemon.nameGerman ?? undefined,
        playerName: causedByName,
        routeName: match.route.name,
      });
    }

    return success({
      message: `${result.count} Pokémon wurden K.O. gesetzt`,
      count: result.count,
    });
  }, 'knocking out encounters');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuthAndErrorHandling(async () => {
    const { id } = await params;
    const routeId = parseId(id, 'Routen-ID');

    const result = await prisma.encounter.updateMany({
      where: { routeId },
      data: {
        isKnockedOut: false,
        koCausedBy: null,
        koReason: null,
        koDate: null,
      },
    });

    return success({
      message: `${result.count} Pokémon wurden reaktiviert`,
      count: result.count,
    });
  }, 'reactivating encounters');
}
