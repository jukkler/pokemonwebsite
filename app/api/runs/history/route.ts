/**
 * Public API: Run History
 * GET /api/runs/history - Alle Runs mit Encounters für Statistik-Seite
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const includeOptions = {
      gameVersion: true,
      playerStats: true,
      encounters: {
        orderBy: [
          { playerName: 'asc' as const },
          { routeName: 'asc' as const },
        ],
      },
    };

    const [runs, archivedRuns] = await Promise.all([
      prisma.run.findMany({
        where: { archived: false },
        include: includeOptions,
        orderBy: { runNumber: 'desc' },
      }),
      prisma.run.findMany({
        where: { archived: true },
        include: includeOptions,
        orderBy: [{ gameVersionKey: 'asc' }, { runNumber: 'desc' }],
      }),
    ]);

    return NextResponse.json({
      runs,
      archivedRuns,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Error fetching run history:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Run-Historie' },
      { status: 500 }
    );
  }
}
