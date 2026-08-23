/**
 * Admin API: Run beenden
 * POST /api/admin/runs/[id]/end - Einen Run beenden (failed oder completed)
 */

import { NextRequest } from 'next/server';
import {
  withAdminAuthAndErrorHandling,
  success,
  badRequest,
  conflict,
  notFound,
  parseId,
} from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { emitEvent } from '@/lib/event-store';
import { bumpLiveRevisions } from '@/lib/live-updates.server';

interface EndRunBody {
  status: 'failed' | 'completed';
  loserPlayerName?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuthAndErrorHandling(async () => {
    const { id } = await params;
    const runId = parseId(id, 'Run-ID');
    const body: EndRunBody = await request.json();
    const { status } = body;
    const loserPlayerName = body.loserPlayerName?.trim() || null;

    if (!status || !['failed', 'completed'].includes(status)) {
      return badRequest('Status muss "failed" oder "completed" sein');
    }

    if (status === 'failed' && loserPlayerName === null) {
      return badRequest('Bei einem gescheiterten Run muss der Verlierer angegeben werden');
    }

    // Prüfe ob der Run existiert und aktiv ist
    const run = await prisma.run.findUnique({
      where: { id: runId },
    });

    if (!run) {
      return notFound('Run nicht gefunden');
    }

    if (run.status !== 'active') {
      return badRequest('Dieser Run ist bereits beendet');
    }

    // Sammle Statistiken aus den aktuellen Encounters
    const players = await prisma.player.findMany();
    const encounters = await prisma.encounter.findMany({
      include: { 
        player: true,
        pokemon: true,
        route: true,
      },
    });

    // Berechne Statistiken pro Spieler (zähle verursachte K.O.s/Nicht-gefangen, nicht eigene)
    const playerStatsData = players.map(player => {
      const koRoutes = new Set(
        encounters.filter(e => e.koCausedBy === player.name).map(e => e.routeId)
      );
      const notCaughtRoutes = new Set(
        encounters.filter(e => e.notCaughtBy === player.name).map(e => e.routeId)
      );
      const isLoser = loserPlayerName === player.name;

      return {
        runId,
        playerName: player.name,
        knockedOutCount: koRoutes.size,
        notCaughtCount: notCaughtRoutes.size,
        isLoser,
      };
    });

    // Alle Encounters als RunEncounter speichern (Snapshot)
    const runEncounterData = encounters.map(e => ({
      runId,
      playerName: e.player.name,
      pokemonPokedexId: e.pokemon.pokedexId,
      pokemonName: e.pokemon.name,
      pokemonNameGerman: e.pokemon.nameGerman,
      routeName: e.route.name,
      nickname: e.nickname,
      teamSlot: e.teamSlot,
      isKnockedOut: e.isKnockedOut,
      koCausedBy: e.koCausedBy,
      koReason: e.koReason,
      koDate: e.koDate,
      isNotCaught: e.isNotCaught,
      notCaughtBy: e.notCaughtBy,
      notCaughtReason: e.notCaughtReason,
      notCaughtDate: e.notCaughtDate,
      caughtAt: e.createdAt,
    }));

    // Den aktiven Run zuerst atomar beanspruchen. So können parallele Klicks
    // weder doppelte Snapshots noch zwei widersprüchliche Ergebnisse erzeugen.
    const updatedRun = await prisma.$transaction(async (tx) => {
      const claimedRun = await tx.run.updateMany({
        where: { id: runId, status: 'active' },
        data: {
          status,
          loserPlayerName: status === 'failed' ? loserPlayerName : null,
          endedAt: new Date(),
        },
      });

      if (claimedRun.count === 0) {
        return null;
      }

      // Erstelle Player-Statistiken
      if (playerStatsData.length > 0) {
        await tx.runPlayerStats.createMany({
          data: playerStatsData,
        });
      }

      // Erstelle RunEncounter-Snapshots
      if (runEncounterData.length > 0) {
        await tx.runEncounter.createMany({
          data: runEncounterData,
        });
      }

      const finishedRun = await tx.run.findUnique({
        where: { id: runId },
        include: {
          gameVersion: true,
          playerStats: true,
          encounters: true,
        },
      });
      await bumpLiveRevisions(tx, ['runs']);
      return finishedRun;
    });

    if (!updatedRun) {
      return conflict('Dieser Run wurde bereits durch eine andere Anfrage beendet');
    }

    // Event emittieren bei fehlgeschlagenem Run
    if (status === 'failed') {
      emitEvent('run_failed', {
        runNumber: run.runNumber,
      });
    } else {
      emitEvent('run_completed', {
        runNumber: run.runNumber,
      });
    }

    return success(updatedRun);
  }, 'ending run');
}
