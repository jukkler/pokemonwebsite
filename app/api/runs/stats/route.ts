/**
 * Public API: Run Statistics
 * GET /api/runs/stats - Aggregierte Run-Statistiken für die Startseite
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface PlayerAggregatedStats {
  playerName: string;
  totalKnockedOut: number;
  totalNotCaught: number;
  runsLost: number;
}

export async function GET() {
  try {
    // Hole alle Runs mit Statistiken
    const runs = await prisma.run.findMany({
      include: {
        gameVersion: true,
        playerStats: true,
      },
      orderBy: { runNumber: 'desc' },
    });

    // Finde den aktiven Run
    const activeRun = runs.find(r => r.status === 'active');
    const completedRuns = runs.filter(r => r.status !== 'active');

    // Aggregiere Statistiken pro Spieler über alle Runs
    const playerStatsMap = new Map<string, PlayerAggregatedStats>();

    for (const run of completedRuns) {
      for (const stat of run.playerStats) {
        const existing = playerStatsMap.get(stat.playerName) || {
          playerName: stat.playerName,
          totalKnockedOut: 0,
          totalNotCaught: 0,
          runsLost: 0,
        };

        existing.totalKnockedOut += stat.knockedOutCount;
        existing.totalNotCaught += stat.notCaughtCount;
        if (stat.isLoser) {
          existing.runsLost += 1;
        }

        playerStatsMap.set(stat.playerName, existing);
      }
    }

    // Konvertiere zu Array und sortiere nach Namen
    const aggregatedPlayerStats = Array.from(playerStatsMap.values())
      .sort((a, b) => a.playerName.localeCompare(b.playerName));

    // Zähle Runs nach Status
    const failedRunsCount = runs.filter(r => r.status === 'failed').length;
    const completedRunsCount = runs.filter(r => r.status === 'completed').length;

    // Falls kein aktiver Run existiert, hole aktuellen K.O./Nicht gefangen Status
    let currentRunStats: PlayerAggregatedStats[] = [];
    if (activeRun) {
      const players = await prisma.player.findMany();
      const encounters = await prisma.encounter.findMany({
        include: { player: true },
      });

      currentRunStats = players.map(player => {
        const playerEncounters = encounters.filter(e => e.playerId === player.id);
        return {
          playerName: player.name,
          totalKnockedOut: playerEncounters.filter(e => e.isKnockedOut).length,
          totalNotCaught: playerEncounters.filter(e => e.isNotCaught).length,
          runsLost: 0,
        };
      });
    }

    return NextResponse.json({
      activeRun: activeRun ? {
        id: activeRun.id,
        runNumber: activeRun.runNumber,
        gameVersion: activeRun.gameVersion,
        startedAt: activeRun.startedAt,
      } : null,
      totalRuns: runs.length,
      failedRuns: failedRunsCount,
      completedRuns: completedRunsCount,
      aggregatedPlayerStats,
      currentRunStats,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Error fetching run stats:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Statistiken' },
      { status: 500 }
    );
  }
}
