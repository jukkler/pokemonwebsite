/**
 * Admin API: Einzelner Spieler
 * PUT /api/admin/players/[id] - Spieler aktualisieren
 * DELETE /api/admin/players/[id] - Spieler löschen
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withAdminAuthAndErrorHandling,
  parseId,
  validateRequired,
  badRequest,
  conflict,
  success,
} from '@/lib/api-utils';
import prisma from '@/lib/prisma';

// PUT: Spieler aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuthAndErrorHandling(async () => {
    const { id } = await params;
    let playerId: number;

    try {
      playerId = parseId(id, 'Spieler-ID');
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : 'Ungültige ID');
    }

    const body = await request.json();
    const { name, color, avatar } = body;

    try {
      validateRequired(body, ['name', 'color']);
    } catch (error) {
      return badRequest(
        error instanceof Error ? error.message : 'Name und Farbe sind erforderlich'
      );
    }

    try {
      // Spieler aktualisieren
      const player = await prisma.player.update({
        where: { id: playerId },
        data: {
          name: String(name).trim(),
          color: String(color).trim(),
          avatar: avatar && avatar !== 'none' ? String(avatar).trim() : null,
        },
      });

      return NextResponse.json(player);
    } catch (error) {
      // Spezifische Fehlerbehandlung
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2025') {
        return NextResponse.json({ error: 'Spieler nicht gefunden' }, { status: 404 });
      }
      if (prismaError.code === 'P2002') {
        return conflict('Ein Spieler mit diesem Namen existiert bereits');
      }
      throw error;
    }
  }, 'updating player');
}

// DELETE: Spieler löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuthAndErrorHandling(async () => {
    const { id } = await params;
    let playerId: number;

    try {
      playerId = parseId(id, 'Spieler-ID');
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : 'Ungültige ID');
    }

    try {
      // Spieler löschen (Cascade löscht auch Encounters und TeamMembers)
      await prisma.player.delete({
        where: { id: playerId },
      });

      return success();
    } catch (error) {
      // Spezifische Fehlerbehandlung
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2025') {
        return NextResponse.json({ error: 'Spieler nicht gefunden' }, { status: 404 });
      }
      throw error;
    }
  }, 'deleting player');
}

