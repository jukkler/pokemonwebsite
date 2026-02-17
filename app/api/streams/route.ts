/**
 * Public API: Streams
 * GET /api/streams - Alle Streams mit Player-Teams und Run-Daten
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const [streams, activeRun, players, encounters] = await Promise.all([
      prisma.stream.findMany({
        include: {
          player: {
            include: {
              encounters: {
                where: { teamSlot: { not: null } },
                include: {
                  pokemon: {
                    select: {
                      pokedexId: true,
                      name: true,
                      nameGerman: true,
                      spriteUrl: true,
                      spriteGifUrl: true,
                    },
                  },
                },
                orderBy: { teamSlot: 'asc' },
              },
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.run.findFirst({
        where: { status: 'active' },
        include: { gameVersion: true },
      }),
      prisma.player.findMany(),
      prisma.encounter.findMany({
        include: { player: true },
      }),
    ]);

    // Berechne aktuelle Run-Stats pro Spieler
    let currentRunStats: { playerName: string; totalKnockedOut: number; totalNotCaught: number }[] = [];
    if (activeRun) {
      currentRunStats = players.map(player => {
        const koRoutes = new Set(
          encounters.filter(e => e.koCausedBy === player.name).map(e => e.routeId)
        );
        const notCaughtRoutes = new Set(
          encounters.filter(e => e.notCaughtBy === player.name).map(e => e.routeId)
        );
        return {
          playerName: player.name,
          totalKnockedOut: koRoutes.size,
          totalNotCaught: notCaughtRoutes.size,
        };
      });
    }

    return NextResponse.json({
      streams,
      activeRun: activeRun ? {
        id: activeRun.id,
        runNumber: activeRun.runNumber,
        gameVersion: activeRun.gameVersion,
        startedAt: activeRun.startedAt,
        pausedAt: activeRun.pausedAt,
        totalPausedMs: activeRun.totalPausedMs,
        badgesEarned: activeRun.badgesEarned,
      } : null,
      currentRunStats,
    }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error fetching streams:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Streams' },
      { status: 500 }
    );
  }
}
