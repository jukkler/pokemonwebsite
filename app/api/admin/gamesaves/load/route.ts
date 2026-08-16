/**
 * Admin API: Spielstand laden
 * POST /api/admin/gamesaves/load - Lädt einen gespeicherten Spielstand
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import {
  GameSaveValidationError,
  validateGameSaveData,
} from '@/lib/gamesave-validation';

export async function POST(request: NextRequest) {
  return withAdminAuth(async () => {
    try {
    const body = await request.json();
    const { gameSaveId } = body;

    if (!gameSaveId) {
      return NextResponse.json(
        { error: 'GameSave-ID ist erforderlich' },
        { status: 400 }
      );
    }

    const parsedGameSaveId = parseInt(String(gameSaveId), 10);
    if (Number.isNaN(parsedGameSaveId) || parsedGameSaveId < 1) {
      return NextResponse.json(
        { error: 'Ungültige GameSave-ID' },
        { status: 400 }
      );
    }

    // Lade den Spielstand
    const gameSave = await prisma.gameSave.findUnique({
      where: { id: parsedGameSaveId },
    });

    if (!gameSave) {
      return NextResponse.json(
        { error: 'Spielstand nicht gefunden' },
        { status: 404 }
      );
    }

    let parsedGameData: unknown;
    try {
      parsedGameData = JSON.parse(gameSave.data);
    } catch {
      return NextResponse.json(
        { error: 'Spielstand enthält ungültiges JSON' },
        { status: 400 }
      );
    }

    let gameData: ReturnType<typeof validateGameSaveData>;
    try {
      gameData = validateGameSaveData(parsedGameData);
    } catch (error) {
      if (error instanceof GameSaveValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    // Atomarer Import: Löschen + Wiederherstellen in EINER Transaktion
    await prisma.$transaction(async (tx) => {
      await tx.runEncounter.deleteMany({});
      await tx.runPlayerStats.deleteMany({});
      await tx.run.deleteMany({});
      await tx.encounter.deleteMany({});
      await tx.route.deleteMany({});
      await tx.player.deleteMany({});

      const playerIdMap = new Map<number, number>();
      for (const player of gameData.players) {
        const newPlayer = await tx.player.create({
          data: {
            name: player.name,
            color: player.color,
            avatar: player.avatar || null,
          },
        });
        playerIdMap.set(player.id, newPlayer.id);
      }

      const routeIdMap = new Map<number, number>();
      for (const route of gameData.routes) {
        const newRoute = await tx.route.create({
          data: {
            name: route.name,
            order: route.order,
          },
        });
        routeIdMap.set(route.id, newRoute.id);
      }

      for (const player of gameData.players) {
        const mappedPlayerId = playerIdMap.get(player.id);
        if (!mappedPlayerId) {
          throw new Error(`Spieler-Mapping für ID ${player.id} fehlt`);
        }

        for (const encounter of player.encounters) {
          const mappedRouteId = routeIdMap.get(encounter.routeId);
          if (!mappedRouteId) {
            throw new Error(`Routen-Mapping für ID ${encounter.routeId} fehlt`);
          }

          await tx.encounter.create({
            data: {
              playerId: mappedPlayerId,
              routeId: mappedRouteId,
              pokemonId: encounter.pokemonId,
              nickname: encounter.nickname || null,
              teamSlot: encounter.teamSlot ?? null,
              isKnockedOut: encounter.isKnockedOut || false,
              koCausedBy: encounter.koCausedBy || null,
              koReason: encounter.koReason || null,
              koDate: encounter.koDate ? new Date(encounter.koDate) : null,
              isNotCaught: encounter.isNotCaught || false,
              notCaughtBy: encounter.notCaughtBy || null,
              notCaughtReason: encounter.notCaughtReason || null,
              notCaughtDate: encounter.notCaughtDate
                ? new Date(encounter.notCaughtDate)
                : null,
            },
          });
        }
      }

      if (gameData.runs) {
        for (const run of gameData.runs) {
          const newRun = await tx.run.create({
            data: {
              runNumber: run.runNumber,
              gameVersionKey: run.gameVersionKey || null,
              status: run.status,
              loserPlayerName: run.loserPlayerName || null,
              startedAt: new Date(run.startedAt),
              endedAt: run.endedAt ? new Date(run.endedAt) : null,
              badgesEarned: run.badgesEarned ?? 0,
              pausedAt: run.pausedAt ? new Date(run.pausedAt) : null,
              totalPausedMs: run.totalPausedMs ?? 0,
            },
          });

          if (run.playerStats) {
            for (const stat of run.playerStats) {
              await tx.runPlayerStats.create({
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

          if (run.encounters) {
            for (const enc of run.encounters) {
              await tx.runEncounter.create({
                data: {
                  runId: newRun.id,
                  playerName: enc.playerName,
                  pokemonPokedexId: enc.pokemonPokedexId,
                  pokemonName: enc.pokemonName,
                  pokemonNameGerman: enc.pokemonNameGerman || null,
                  routeName: enc.routeName,
                  nickname: enc.nickname || null,
                  teamSlot: enc.teamSlot ?? null,
                  isKnockedOut: enc.isKnockedOut || false,
                  koCausedBy: enc.koCausedBy || null,
                  koReason: enc.koReason || null,
                  koDate: enc.koDate ? new Date(enc.koDate) : null,
                  isNotCaught: enc.isNotCaught || false,
                  notCaughtBy: enc.notCaughtBy || null,
                  notCaughtReason: enc.notCaughtReason || null,
                  notCaughtDate: enc.notCaughtDate
                    ? new Date(enc.notCaughtDate)
                    : null,
                  caughtAt: enc.caughtAt ? new Date(enc.caughtAt) : null,
                },
              });
            }
          }
        }
      }
    });

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
  });
}
