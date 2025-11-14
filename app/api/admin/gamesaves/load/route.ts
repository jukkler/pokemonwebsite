/**
 * Admin API: Spielstand laden
 * POST /api/admin/gamesaves/load - Lädt einen gespeicherten Spielstand
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await request.json();
    const { gameSaveId } = body;

    if (!gameSaveId) {
      return NextResponse.json(
        { error: 'GameSave-ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Lade den Spielstand
    const gameSave = await prisma.gameSave.findUnique({
      where: { id: parseInt(gameSaveId) },
    });

    if (!gameSave) {
      return NextResponse.json(
        { error: 'Spielstand nicht gefunden' },
        { status: 404 }
      );
    }

    // Parse die Spieldaten
    const gameData = JSON.parse(gameSave.data);

    // Lösche alle aktuellen Spieldaten (Cascade löscht auch Encounters)
    await prisma.$transaction([
      prisma.encounter.deleteMany({}),
      prisma.route.deleteMany({}),
      prisma.player.deleteMany({}),
    ]);

    // Importiere die gespeicherten Daten
    // 1. Players importieren
    const playerIdMap = new Map<number, number>(); // alt -> neu
    for (const player of gameData.players) {
      const newPlayer = await prisma.player.create({
        data: {
          name: player.name,
          color: player.color,
        },
      });
      playerIdMap.set(player.id, newPlayer.id);
    }

    // 2. Routes importieren
    const routeIdMap = new Map<number, number>(); // alt -> neu
    for (const route of gameData.routes) {
      const newRoute = await prisma.route.create({
        data: {
          name: route.name,
          order: route.order,
        },
      });
      routeIdMap.set(route.id, newRoute.id);
    }

    // 3. Encounters importieren (aus Players, da dort die vollständigen Daten sind)
    for (const player of gameData.players) {
      for (const encounter of player.encounters) {
        await prisma.encounter.create({
          data: {
            playerId: playerIdMap.get(player.id)!,
            routeId: routeIdMap.get(encounter.routeId)!,
            pokemonId: encounter.pokemonId,
            nickname: encounter.nickname,
            teamSlot: encounter.teamSlot,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Spielstand "${gameSave.name}" erfolgreich geladen`,
    });
  } catch (error) {
    console.error('Error loading game save:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden des Spielstands' },
      { status: 500 }
    );
  }
}

