/**
 * Admin API: Run neu starten
 * POST /api/admin/runs/restart - Aktuellen Run beenden und neuen starten
 * Spieler und Routen bleiben erhalten, nur Encounters werden gelöscht
 */

import { NextRequest } from 'next/server';
import { withAdminAuthAndErrorHandling, success, badRequest } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { emitEvent } from '@/lib/event-store';

interface RestartRunBody {
  loserPlayerName: string;
  gameVersionKey?: string;
}

export async function POST(request: NextRequest) {
  return withAdminAuthAndErrorHandling(async () => {
    const body: RestartRunBody = await request.json();
    const { loserPlayerName, gameVersionKey } = body;

    if (!loserPlayerName) {
      return badRequest('Bitte gib an, wer den Run verloren hat');
    }

    // Finde den aktiven Run
    const activeRun = await prisma.run.findFirst({
      where: { status: 'active' },
    });

    // Sammle Statistiken aus den aktuellen Encounters
    const players = await prisma.player.findMany();
    const encounters = await prisma.encounter.findMany({
      include: { 
        player: true,
        pokemon: true,
        route: true,
      },
    });

    // Effektive Version für den neuen Run
    const effectiveVersionKey = gameVersionKey || activeRun?.gameVersionKey || null;
    const isVersionChange = !!(effectiveVersionKey && activeRun && activeRun.gameVersionKey !== effectiveVersionKey);

    // Führe alles in einer Transaktion aus
    const result = await prisma.$transaction(async (tx) => {
      // 1. Falls es einen aktiven Run gibt, beende ihn und speichere Statistiken
      if (activeRun) {
        // Spieler-Statistiken speichern (zähle verursachte K.O.s/Nicht-gefangen)
        const playerStatsData = players.map(player => {
          const koRoutes = new Set(
            encounters.filter(e => e.koCausedBy === player.name).map(e => e.routeId)
          );
          const notCaughtRoutes = new Set(
            encounters.filter(e => e.notCaughtBy === player.name).map(e => e.routeId)
          );
          const isLoser = loserPlayerName === player.name;

          return {
            runId: activeRun.id,
            playerName: player.name,
            knockedOutCount: koRoutes.size,
            notCaughtCount: notCaughtRoutes.size,
            isLoser,
          };
        });

        if (playerStatsData.length > 0) {
          await tx.runPlayerStats.createMany({
            data: playerStatsData,
          });
        }

        // Alle Encounters als RunEncounter speichern (Snapshot)
        const runEncounterData = encounters.map(e => ({
          runId: activeRun.id,
          playerName: e.player.name,
          pokemonPokedexId: e.pokemon.pokedexId,
          pokemonName: e.pokemon.name,
          pokemonNameGerman: e.pokemon.nameGerman,
          routeName: e.route.name,
          isKnockedOut: e.isKnockedOut,
          isNotCaught: e.isNotCaught,
        }));

        if (runEncounterData.length > 0) {
          await tx.runEncounter.createMany({
            data: runEncounterData,
          });
        }

        await tx.run.update({
          where: { id: activeRun.id },
          data: {
            status: 'failed',
            loserPlayerName,
            endedAt: new Date(),
          },
        });
      }

      // 2. Lösche nur Encounters (Routen und Spieler bleiben!)
      await tx.encounter.deleteMany({});

      // 3. Versionswechsel? → Alle nicht-archivierten Runs archivieren
      let nextRunNumber: number;
      if (isVersionChange) {
        await tx.run.updateMany({
          where: { archived: false },
          data: { archived: true },
        });
        nextRunNumber = 1;
      } else {
        const lastRun = await tx.run.findFirst({
          where: { archived: false },
          orderBy: { runNumber: 'desc' },
        });
        nextRunNumber = (lastRun?.runNumber ?? 0) + 1;
      }

      // 4. Erstelle neuen Run
      const newRun = await tx.run.create({
        data: {
          runNumber: nextRunNumber,
          gameVersionKey: effectiveVersionKey,
          status: 'active',
        },
        include: {
          gameVersion: true,
        },
      });

      return newRun;
    });

    // Event emittieren für den gescheiterten Run
    if (activeRun) {
      emitEvent('run_failed', {
        runNumber: activeRun.runNumber,
      });
    }

    return success({
      message: `Run #${result.runNumber} gestartet. ${loserPlayerName} hat Run #${activeRun?.runNumber ?? 0} verloren.`,
      newRun: result,
    });
  }, 'restarting run');
}
