/**
 * Public API: Run History
 * GET /api/runs/history - Alle Runs mit Encounters für Statistik-Seite
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const runs = await prisma.run.findMany({
      include: {
        gameVersion: true,
        playerStats: true,
        encounters: {
          orderBy: [
            { playerName: 'asc' },
            { routeName: 'asc' },
          ],
        },
      },
      orderBy: { runNumber: 'desc' },
    });

    return NextResponse.json({
      runs,
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
