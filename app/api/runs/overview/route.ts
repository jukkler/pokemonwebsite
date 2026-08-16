import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  calculateRunDurationMs,
  emptyEncounterCounts,
  loadEncounterCountsByRun,
  resolveRunScope,
  type EncounterCounts,
  type GameVersionInfo,
} from '@/lib/run-statistics';

export const dynamic = 'force-dynamic';

interface OverviewTotals extends EncounterCounts {
  gameCount: number;
  runCount: number;
  activeRuns: number;
  failedRuns: number;
  completedRuns: number;
  totalEncounters: number;
  caughtCount: number;
  knockedOutCount: number;
  notCaughtCount: number;
  totalDurationMs: number;
  maxBadges: number;
}

function createTotals(): OverviewTotals {
  return {
    ...emptyEncounterCounts(),
    gameCount: 0,
    runCount: 0,
    activeRuns: 0,
    failedRuns: 0,
    completedRuns: 0,
    totalEncounters: 0,
    caughtCount: 0,
    knockedOutCount: 0,
    notCaughtCount: 0,
    totalDurationMs: 0,
    maxBadges: 0,
  };
}

export async function GET(request: NextRequest) {
  try {
    const scope = await resolveRunScope(request.nextUrl.searchParams.get('game'));
    if (!scope) {
      return NextResponse.json({ error: 'Unbekannte Spielversion' }, { status: 400 });
    }

    const runs = await prisma.run.findMany({
      select: {
        id: true,
        status: true,
        startedAt: true,
        endedAt: true,
        pausedAt: true,
        totalPausedMs: true,
        badgesEarned: true,
        gameVersionKey: true,
        gameVersion: {
          select: { key: true, name: true, generation: true },
        },
      },
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
    });
    const countsByRun = await loadEncounterCountsByRun(runs);
    const now = new Date();
    const gameGroups = new Map<
      string,
      {
        gameVersion: GameVersionInfo | null;
        gameCount: number;
        runCount: number;
        activeRuns: number;
        failedRuns: number;
        completedRuns: number;
        totalEncounters: number;
        caughtCount: number;
        knockedOutCount: number;
        notCaughtCount: number;
        totalDurationMs: number;
        maxBadges: number;
        firstStartedAt: Date;
        lastStartedAt: Date;
      }
    >();

    for (const run of runs) {
      const key = run.gameVersion?.key ?? 'unknown';
      const counts = countsByRun.get(run.id) ?? emptyEncounterCounts();
      const group = gameGroups.get(key) ?? {
        gameVersion: run.gameVersion,
        gameCount: 1,
        runCount: 0,
        activeRuns: 0,
        failedRuns: 0,
        completedRuns: 0,
        totalEncounters: 0,
        caughtCount: 0,
        knockedOutCount: 0,
        notCaughtCount: 0,
        totalDurationMs: 0,
        maxBadges: 0,
        firstStartedAt: run.startedAt,
        lastStartedAt: run.startedAt,
      };

      group.runCount += 1;
      group.activeRuns += run.status === 'active' ? 1 : 0;
      group.failedRuns += run.status === 'failed' ? 1 : 0;
      group.completedRuns += run.status === 'completed' ? 1 : 0;
      group.totalEncounters += counts.encounters;
      group.caughtCount += counts.caught;
      group.knockedOutCount += counts.knockedOut;
      group.notCaughtCount += counts.notCaught;
      group.totalDurationMs += calculateRunDurationMs(run, now);
      group.maxBadges = Math.max(group.maxBadges, run.badgesEarned);
      group.firstStartedAt = new Date(
        Math.min(group.firstStartedAt.getTime(), run.startedAt.getTime())
      );
      group.lastStartedAt = new Date(
        Math.max(group.lastStartedAt.getTime(), run.startedAt.getTime())
      );
      gameGroups.set(key, group);
    }

    const games = Array.from(gameGroups.values()).sort(
      (a, b) => b.lastStartedAt.getTime() - a.lastStartedAt.getTime()
    );
    const selectedGames = games.filter(game => {
      if (scope.type === 'all') return true;
      if (scope.type === 'unknown') return game.gameVersion === null;
      return game.gameVersion?.key === scope.gameKey;
    });

    const totals = selectedGames.reduce((result, game) => {
      result.gameCount += game.gameCount;
      result.runCount += game.runCount;
      result.activeRuns += game.activeRuns;
      result.failedRuns += game.failedRuns;
      result.completedRuns += game.completedRuns;
      result.totalEncounters += game.totalEncounters;
      result.caughtCount += game.caughtCount;
      result.knockedOutCount += game.knockedOutCount;
      result.notCaughtCount += game.notCaughtCount;
      result.totalDurationMs += game.totalDurationMs;
      result.maxBadges = Math.max(result.maxBadges, game.maxBadges);
      return result;
    }, createTotals());

    // Alias-Felder halten das kompakte Counts-Schema und die benannten KPI-Felder
    // synchron, ohne dass Clients selbst umrechnen müssen.
    totals.encounters = totals.totalEncounters;
    totals.caught = totals.caughtCount;
    totals.knockedOut = totals.knockedOutCount;
    totals.notCaught = totals.notCaughtCount;

    return NextResponse.json(
      { scope, totals, games },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error fetching run overview:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Statistik-Übersicht' },
      { status: 500 }
    );
  }
}
