/**
 * Admin API: Spiel zurücksetzen
 * POST /api/admin/gamesaves/reset - Löscht alle Spieldaten OHNE Auto-Save
 */

import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { bumpLiveRevisions } from '@/lib/live-updates.server';

export async function POST() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Prüfe ob überhaupt Daten vorhanden sind
    const playerCount = await prisma.player.count();
    const routeCount = await prisma.route.count();
    const encounterCount = await prisma.encounter.count();

    if (playerCount === 0 && routeCount === 0 && encounterCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'Datenbank ist bereits leer',
      });
    }

    // Lösche alle Spieldaten (OHNE Auto-Save!)
    await prisma.$transaction(async (tx) => {
      await tx.encounter.deleteMany({});
      await tx.route.deleteMany({});
      await tx.player.deleteMany({});
      await bumpLiveRevisions(tx, [
        'players',
        'routes',
        'encounters',
        'streams',
      ]);
    });

    return NextResponse.json({
      success: true,
      message: `Spiel wurde zurückgesetzt. ${playerCount} Spieler, ${routeCount} Routen und ${encounterCount} Encounters wurden gelöscht.`,
    });
  } catch (error) {
    console.error('Error resetting game:', error);
    return NextResponse.json(
      { error: 'Fehler beim Zurücksetzen des Spiels' },
      { status: 500 }
    );
  }
}

