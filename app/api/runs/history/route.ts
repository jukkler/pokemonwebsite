import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  calculateRunDurationMs,
  emptyEncounterCounts,
  loadEncounterCountsByRun,
  resolveRunScope,
  runWhereForScope,
  type GameVersionInfo,
} from '@/lib/run-statistics';

export const dynamic = 'force-dynamic';

const RUN_SELECT = {
  id: true,
  runNumber: true,
  status: true,
  loserPlayerName: true,
  startedAt: true,
  endedAt: true,
  badgesEarned: true,
  pausedAt: true,
  totalPausedMs: true,
  archived: true,
  gameVersionKey: true,
  gameVersion: {
    select: { key: true, name: true, generation: true },
  },
} as const;

type HistoryRun = Awaited<ReturnType<typeof loadHistoryRuns>>[number];

async function loadHistoryRuns(where: ReturnType<typeof runWhereForScope>) {
  return prisma.run.findMany({
    where,
    select: RUN_SELECT,
    orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
  });
}

function parseLimit(rawLimit: string | null): number | null {
  if (rawLimit === null) return 10;
  if (!/^\d+$/.test(rawLimit)) return null;
  const limit = Number(rawLimit);
  return limit >= 1 && limit <= 50 ? limit : null;
}

function parseCursor(rawCursor: string | null): number | null | undefined {
  if (rawCursor === null) return undefined;
  if (!/^\d+$/.test(rawCursor)) return null;
  const cursor = Number(rawCursor);
  return Number.isSafeInteger(cursor) && cursor > 0 ? cursor : null;
}

function gameGroupKey(gameVersion: GameVersionInfo | null): string {
  return gameVersion?.key ?? 'unknown';
}

export async function GET(request: NextRequest) {
  try {
    const scope = await resolveRunScope(request.nextUrl.searchParams.get('game'));
    if (!scope) {
      return NextResponse.json({ error: 'Unbekannte Spielversion' }, { status: 400 });
    }

    const limit = parseLimit(request.nextUrl.searchParams.get('limit'));
    if (limit === null) {
      return NextResponse.json(
        { error: 'limit muss eine ganze Zahl zwischen 1 und 50 sein' },
        { status: 400 }
      );
    }

    const cursor = parseCursor(request.nextUrl.searchParams.get('cursor'));
    if (cursor === null) {
      return NextResponse.json({ error: 'Ungültiger Cursor' }, { status: 400 });
    }
    if (scope.type === 'all' && cursor !== undefined) {
      return NextResponse.json(
        { error: 'Cursor-Paginierung benötigt eine konkrete Spielversion' },
        { status: 400 }
      );
    }

    const allRuns = await loadHistoryRuns(runWhereForScope(scope));
    const groupedRuns = new Map<
      string,
      { gameVersion: GameVersionInfo | null; runs: HistoryRun[] }
    >();

    for (const run of allRuns) {
      const key = gameGroupKey(run.gameVersion);
      const group = groupedRuns.get(key) ?? { gameVersion: run.gameVersion, runs: [] };
      group.runs.push(run);
      groupedRuns.set(key, group);
    }

    const pagedGroups = Array.from(groupedRuns.values())
      .map(group => {
        let startIndex = 0;
        if (cursor !== undefined) {
          const cursorIndex = group.runs.findIndex(run => run.id === cursor);
          if (cursorIndex === -1) return null;
          startIndex = cursorIndex + 1;
        }

        const runs = group.runs.slice(startIndex, startIndex + limit);
        return {
          gameVersion: group.gameVersion,
          totalRuns: group.runs.length,
          runs,
          nextCursor:
            startIndex + runs.length < group.runs.length && runs.length > 0
              ? runs[runs.length - 1].id
              : null,
        };
      });

    if (cursor !== undefined && pagedGroups.some(group => group === null)) {
      return NextResponse.json(
        { error: 'Cursor gehört nicht zur ausgewählten Spielversion' },
        { status: 400 }
      );
    }

    const returnedRuns = pagedGroups.flatMap(group => group?.runs ?? []);
    const countsByRun = await loadEncounterCountsByRun(returnedRuns);
    const now = new Date();

    const groups = pagedGroups
      .filter((group): group is NonNullable<typeof group> => group !== null)
      .map(group => ({
        gameVersion: group.gameVersion,
        totalRuns: group.totalRuns,
        nextCursor: group.nextCursor,
        runs: group.runs.map(run => ({
          id: run.id,
          runNumber: run.runNumber,
          status: run.status,
          loserPlayerName: run.loserPlayerName,
          startedAt: run.startedAt,
          endedAt: run.endedAt,
          badgesEarned: run.badgesEarned,
          pausedAt: run.pausedAt,
          totalPausedMs: run.totalPausedMs,
          archived: run.archived,
          gameVersion: run.gameVersion,
          isLive: run.status === 'active',
          counts: countsByRun.get(run.id) ?? emptyEncounterCounts(),
          durationMs: calculateRunDurationMs(run, now),
        })),
      }));

    return NextResponse.json(
      { scope, groups, totalRuns: allRuns.length },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error fetching run history:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Run-Historie' },
      { status: 500 }
    );
  }
}
