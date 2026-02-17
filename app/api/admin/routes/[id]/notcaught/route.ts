/**
 * Admin API: Route "Nicht gefangen" Status
 * POST /api/admin/routes/[id]/notcaught - Route als "Nicht gefangen" markieren
 * DELETE /api/admin/routes/[id]/notcaught - Route reaktivieren
 */

import { NextRequest } from 'next/server';
import {
  withAdminAuthAndErrorHandling,
  parseId,
  validateRequired,
  badRequest,
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
    let routeId: number;

    try {
      routeId = parseId(id, 'Routen-ID');
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : 'Ungültige Routen-ID');
    }

    const body = await request.json();
    const { causedBy, reason } = body;

    try {
      validateRequired(body, ['causedBy']);
    } catch (error) {
      return badRequest(
        error instanceof Error ? error.message : 'Verursacher ist erforderlich'
      );
    }

    // Pokemon-Namen vor dem Update laden (für Event)
    const encounters = await prisma.encounter.findMany({
      where: { routeId },
      include: { pokemon: true, route: true, player: true },
    });

    // Setze alle Encounters dieser Route auf "Nicht gefangen"
    await prisma.encounter.updateMany({
      where: { routeId },
      data: {
        isNotCaught: true,
        notCaughtBy: String(causedBy).trim(),
        notCaughtReason: reason && String(reason).trim() ? String(reason).trim() : null,
        notCaughtDate: new Date(),
        teamSlot: null, // Entferne aus Team
      },
    });

    // Event emittieren (Pokemon des Verursachers)
    if (encounters.length > 0) {
      const causedByName = String(causedBy).trim();
      const match = encounters.find(e => e.player.name === causedByName) || encounters[0];
      emitEvent('pokemon_not_caught', {
        pokemonName: match.pokemon.name,
        pokemonNameGerman: match.pokemon.nameGerman ?? undefined,
        playerName: causedByName,
        routeName: match.route.name,
      });
    }

    return success({ message: `Route ${routeId} als "Nicht gefangen" markiert.` });
  }, 'setting route not-caught status');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuthAndErrorHandling(async () => {
    const { id } = await params;
    let routeId: number;

    try {
      routeId = parseId(id, 'Routen-ID');
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : 'Ungültige Routen-ID');
    }

    // Reaktiviere alle Encounters dieser Route
    await prisma.encounter.updateMany({
      where: { routeId },
      data: {
        isNotCaught: false,
        notCaughtBy: null,
        notCaughtReason: null,
        notCaughtDate: null,
      },
    });

    return success({ message: `Route ${routeId} reaktiviert.` });
  }, 'reactivating route');
}

