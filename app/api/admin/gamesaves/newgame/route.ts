/**
 * Admin API: Neues Spiel starten
 * POST /api/admin/gamesaves/newgame - Startet ein neues Spiel (nach Auto-Save)
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
        message: 'Datenbank ist bereits leer, kein Auto-Save erstellt',
      });
    }

    // Erstelle automatischen Spielstand vor dem Löschen
    const players = await prisma.player.findMany({
      include: {
        encounters: {
          include: {
            pokemon: true,
            route: true,
          },
        },
      },
    });

    const routes = await prisma.route.findMany({
      include: {
        encounters: {
          include: {
            pokemon: true,
            player: true,
          },
        },
      },
    });

    const gameData = {
      players,
      routes,
      savedAt: new Date().toISOString(),
    };

    const autoSaveName = `Auto-Save (${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString('de-DE')})`;

    await prisma.gameSave.create({
      data: {
        name: autoSaveName,
        description: 'Automatisch erstellt vor "Neues Spiel"',
        data: JSON.stringify(gameData),
      },
    });

    // Lösche alle Spieldaten
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
      message: `Neues Spiel gestartet. Auto-Save "${autoSaveName}" wurde erstellt.`,
    });
  } catch (error) {
    console.error('Error starting new game:', error);
    return NextResponse.json(
      { error: 'Fehler beim Starten eines neuen Spiels' },
      { status: 500 }
    );
  }
}

