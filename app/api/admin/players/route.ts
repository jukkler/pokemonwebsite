/**
 * Admin API: Players CRUD
 * GET /api/admin/players - Liste aller Spieler
 * POST /api/admin/players - Neuen Spieler erstellen
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withAdminAuthAndErrorHandling,
  validateRequired,
  badRequest,
  created,
  conflict,
  handlePrismaError,
} from '@/lib/api-utils';
import prisma from '@/lib/prisma';

// GET: Alle Spieler abrufen
export async function GET() {
  return withAdminAuthAndErrorHandling(async () => {
    const players = await prisma.player.findMany({
      include: {
        _count: {
          select: {
            encounters: true,
            teamMembers: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(players);
  }, 'fetching players');
}

// POST: Neuen Spieler erstellen
export async function POST(request: NextRequest) {
  return withAdminAuthAndErrorHandling(async () => {
    const body = await request.json();
    const { name, color, avatar } = body;

    // Validierung
    try {
      validateRequired(body, ['name', 'color']);
    } catch (error) {
      return badRequest(
        error instanceof Error ? error.message : 'Name und Farbe sind erforderlich'
      );
    }

    try {
      // Spieler erstellen
      const player = await prisma.player.create({
        data: {
          name: String(name).trim(),
          color: String(color).trim(),
          avatar: avatar && avatar !== 'none' ? String(avatar).trim() : null,
        },
      });

      return created(player);
    } catch (error) {
      // Spezifische Fehlerbehandlung für Unique Constraint
      const prismaError = handlePrismaError(error, 'creating player');
      if (prismaError.status === 409) {
        return conflict('Ein Spieler mit diesem Namen existiert bereits');
      }
      throw error;
    }
  }, 'creating player');
}

