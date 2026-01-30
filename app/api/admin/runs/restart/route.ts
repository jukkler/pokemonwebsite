/**
 * Admin API: Run neu starten
 * POST /api/admin/runs/restart - Aktuellen Run beenden und neuen starten
 * Spieler und Routen bleiben erhalten, nur Encounters werden gelöscht
 */

import { NextRequest } from 'next/server';
import { withAdminAuthAndErrorHandling, success, badRequest } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

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

    // Berechne die nächste Run-Nummer
    const lastRun = await prisma.run.findFirst({
      orderBy: { runNumber: 'desc' },
    });
    const nextRunNumber = (lastRun?.runNumber ?? 0) + 1;

    // Führe alles in einer Transaktion aus
    const result = await prisma.$transaction(async (tx) => {
      // 1. Falls es einen aktiven Run gibt, beende ihn und speichere Statistiken
      if (activeRun) {
        // Spieler-Statistiken speichern
        const playerStatsData = players.map(player => {
          const playerEncounters = encounters.filter(e => e.playerId === player.id);
          const knockedOutCount = playerEncounters.filter(e => e.isKnockedOut).length;
          const notCaughtCount = playerEncounters.filter(e => e.isNotCaught).length;
          const isLoser = loserPlayerName === player.name;

          return {
            runId: activeRun.id,
            playerName: player.name,
            knockedOutCount,
            notCaughtCount,
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

      // 3. Erstelle neuen Run
      const newRun = await tx.run.create({
        data: {
          runNumber: nextRunNumber,
          gameVersionKey: gameVersionKey || activeRun?.gameVersionKey || null,
          status: 'active',
        },
        include: {
          gameVersion: true,
        },
      });

      return newRun;
    });

    return success({
      message: `Run #${result.runNumber} gestartet. ${loserPlayerName} hat Run #${activeRun?.runNumber ?? 0} verloren.`,
      newRun: result,
    });
  }, 'restarting run');
}
