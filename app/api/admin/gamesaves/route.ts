/**
 * Admin API: GameSaves
 * GET /api/admin/gamesaves - Liste aller Spielstände
 * POST /api/admin/gamesaves - Aktuelles Spiel speichern
 */

import { NextRequest } from 'next/server';
import {
  withAdminAuthAndErrorHandling,
  validateRequired,
  success,
} from '@/lib/api-utils';
import prisma from '@/lib/prisma';

export async function GET() {
  return withAdminAuthAndErrorHandling(async () => {
    const gameSaves = await prisma.gameSave.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return success(gameSaves);
  }, 'fetching game saves');
}

export async function POST(request: NextRequest) {
  return withAdminAuthAndErrorHandling(async () => {
    const body = await request.json();
    validateRequired(body, ['name']);
    const { name, description } = body;

    // Exportiere alle Spieldaten
    const [players, routes] = await Promise.all([
      prisma.player.findMany({
        include: {
          encounters: {
            include: { pokemon: true, route: true },
          },
        },
      }),
      prisma.route.findMany({
        include: {
          encounters: {
            include: { pokemon: true, player: true },
          },
        },
      }),
    ]);

    const gameData = {
      players,
      routes,
      savedAt: new Date().toISOString(),
    };

    const gameSave = await prisma.gameSave.create({
      data: {
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        data: JSON.stringify(gameData),
      },
    });

    return success({
      gameSave: {
        id: gameSave.id,
        name: gameSave.name,
        description: gameSave.description,
        createdAt: gameSave.createdAt,
      },
    });
  }, 'saving game');
}
