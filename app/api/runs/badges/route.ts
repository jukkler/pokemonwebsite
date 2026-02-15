/**
 * API Route: Update Badge Count
 * POST /api/runs/badges - Aktualisiert den Orden-Zähler des aktiven Runs
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getBadgesForGame } from '@/lib/badge-data';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action !== 'increment' && action !== 'decrement') {
      return NextResponse.json(
        { error: 'Ungültige Aktion. Erlaubt: increment, decrement' },
        { status: 400 }
      );
    }

    const activeRun = await prisma.run.findFirst({
      where: { status: 'active' },
      orderBy: { startedAt: 'desc' },
    });

    if (!activeRun) {
      return NextResponse.json(
        { error: 'Kein aktiver Run gefunden' },
        { status: 404 }
      );
    }

    // Maximale Badges basierend auf Spielversion
    const badges = activeRun.gameVersionKey
      ? getBadgesForGame(activeRun.gameVersionKey)
      : null;
    const maxBadges = badges?.length ?? 8;

    let newCount = activeRun.badgesEarned;
    if (action === 'increment') {
      newCount = Math.min(newCount + 1, maxBadges);
    } else {
      newCount = Math.max(newCount - 1, 0);
    }

    await prisma.run.update({
      where: { id: activeRun.id },
      data: { badgesEarned: newCount },
    });

    return NextResponse.json({
      success: true,
      badgesEarned: newCount,
    });
  } catch (error) {
    console.error('Error updating badges:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Orden' },
      { status: 500 }
    );
  }
}
