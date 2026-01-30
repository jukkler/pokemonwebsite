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

    // Lösche alle aktuellen Spieldaten (Cascade löscht auch Encounters, RunPlayerStats und RunEncounter)
    await prisma.$transaction([
      prisma.runEncounter.deleteMany({}),
      prisma.runPlayerStats.deleteMany({}),
      prisma.run.deleteMany({}),
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
          avatar: player.avatar || null,
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
            isKnockedOut: encounter.isKnockedOut || false,
            koCausedBy: encounter.koCausedBy || null,
            koReason: encounter.koReason || null,
            koDate: encounter.koDate ? new Date(encounter.koDate) : null,
            isNotCaught: encounter.isNotCaught || false,
            notCaughtBy: encounter.notCaughtBy || null,
            notCaughtReason: encounter.notCaughtReason || null,
            notCaughtDate: encounter.notCaughtDate ? new Date(encounter.notCaughtDate) : null,
          },
        });
      }
    }

    // 4. Runs, RunPlayerStats und RunEncounter importieren (falls vorhanden)
    if (gameData.runs && Array.isArray(gameData.runs)) {
      for (const run of gameData.runs) {
        const newRun = await prisma.run.create({
          data: {
            runNumber: run.runNumber,
            gameVersionKey: run.gameVersionKey || null,
            status: run.status,
            loserPlayerName: run.loserPlayerName || null,
            startedAt: new Date(run.startedAt),
            endedAt: run.endedAt ? new Date(run.endedAt) : null,
          },
        });

        // PlayerStats für diesen Run importieren
        if (run.playerStats && Array.isArray(run.playerStats)) {
          for (const stat of run.playerStats) {
            await prisma.runPlayerStats.create({
              data: {
                runId: newRun.id,
                playerName: stat.playerName,
                knockedOutCount: stat.knockedOutCount || 0,
                notCaughtCount: stat.notCaughtCount || 0,
                isLoser: stat.isLoser || false,
              },
            });
          }
        }

        // RunEncounter für diesen Run importieren
        if (run.encounters && Array.isArray(run.encounters)) {
          for (const enc of run.encounters) {
            await prisma.runEncounter.create({
              data: {
                runId: newRun.id,
                playerName: enc.playerName,
                pokemonPokedexId: enc.pokemonPokedexId,
                pokemonName: enc.pokemonName,
                pokemonNameGerman: enc.pokemonNameGerman || null,
                routeName: enc.routeName,
                isKnockedOut: enc.isKnockedOut || false,
                isNotCaught: enc.isNotCaught || false,
              },
            });
          }
        }
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

