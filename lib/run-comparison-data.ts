import type {
  PlayerRunStats,
  RunComparisonSide,
  RunEncounter,
  RunTrendCoverage,
} from '@/components/statistics/types';
import prisma from '@/lib/prisma';
import { calculateRunDurationMs } from '@/lib/run-statistics';

async function loadSelectedRuns(ids: number[]) {
  return prisma.run.findMany({
    where: { id: { in: ids } },
    select: {
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
      gameVersion: {
        select: { key: true, name: true, generation: true },
      },
      playerStats: {
        select: {
          playerName: true,
          knockedOutCount: true,
          notCaughtCount: true,
          isLoser: true,
        },
        orderBy: { playerName: 'asc' },
      },
    },
  });
}

type SelectedRun = Awaited<ReturnType<typeof loadSelectedRuns>>[number];

async function loadHistoricalEncounters(runIds: number[]) {
  if (runIds.length === 0) return [];

  return prisma.runEncounter.findMany({
    where: { runId: { in: runIds } },
    select: {
      id: true,
      runId: true,
      playerName: true,
      pokemonPokedexId: true,
      pokemonName: true,
      pokemonNameGerman: true,
      routeName: true,
      nickname: true,
      teamSlot: true,
      isKnockedOut: true,
      koCausedBy: true,
      koReason: true,
      koDate: true,
      isNotCaught: true,
      notCaughtBy: true,
      notCaughtReason: true,
      notCaughtDate: true,
      caughtAt: true,
    },
    orderBy: [{ playerName: 'asc' }, { routeName: 'asc' }, { id: 'asc' }],
  });
}

type HistoricalEncounter = Awaited<
  ReturnType<typeof loadHistoricalEncounters>
>[number];

async function loadLiveEncounters() {
  return prisma.encounter.findMany({
    select: {
      id: true,
      routeId: true,
      nickname: true,
      teamSlot: true,
      isKnockedOut: true,
      koCausedBy: true,
      koReason: true,
      koDate: true,
      isNotCaught: true,
      notCaughtBy: true,
      notCaughtReason: true,
      notCaughtDate: true,
      createdAt: true,
      player: { select: { name: true } },
      route: { select: { name: true, order: true } },
      pokemon: {
        select: {
          pokedexId: true,
          name: true,
          nameGerman: true,
          spriteUrl: true,
        },
      },
    },
    orderBy: [{ player: { name: 'asc' } }, { route: { order: 'asc' } }, { id: 'asc' }],
  });
}

type LiveEncounter = Awaited<ReturnType<typeof loadLiveEncounters>>[number];

function serializeDate(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}

function mapHistoricalEncounter(encounter: HistoricalEncounter): RunEncounter {
  return {
    id: encounter.id,
    playerName: encounter.playerName,
    pokemonPokedexId: encounter.pokemonPokedexId,
    pokemonName: encounter.pokemonName,
    pokemonNameGerman: encounter.pokemonNameGerman,
    spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${encounter.pokemonPokedexId}.png`,
    routeName: encounter.routeName,
    nickname: encounter.nickname,
    teamSlot: encounter.teamSlot,
    isKnockedOut: encounter.isKnockedOut,
    koCausedBy: encounter.koCausedBy,
    koReason: encounter.koReason,
    koDate: serializeDate(encounter.koDate),
    isNotCaught: encounter.isNotCaught,
    notCaughtBy: encounter.notCaughtBy,
    notCaughtReason: encounter.notCaughtReason,
    notCaughtDate: serializeDate(encounter.notCaughtDate),
    caughtAt: serializeDate(encounter.caughtAt),
  };
}

function mapLiveEncounter(encounter: LiveEncounter): RunEncounter {
  return {
    id: encounter.id,
    playerName: encounter.player.name,
    pokemonPokedexId: encounter.pokemon.pokedexId,
    pokemonName: encounter.pokemon.name,
    pokemonNameGerman: encounter.pokemon.nameGerman,
    spriteUrl: encounter.pokemon.spriteUrl,
    routeName: encounter.route.name,
    nickname: encounter.nickname,
    teamSlot: encounter.teamSlot,
    isKnockedOut: encounter.isKnockedOut,
    koCausedBy: encounter.koCausedBy,
    koReason: encounter.koReason,
    koDate: serializeDate(encounter.koDate),
    isNotCaught: encounter.isNotCaught,
    notCaughtBy: encounter.notCaughtBy,
    notCaughtReason: encounter.notCaughtReason,
    notCaughtDate: serializeDate(encounter.notCaughtDate),
    caughtAt: encounter.createdAt.toISOString(),
  };
}

function createLivePlayerStats(
  playerNames: string[],
  encounters: LiveEncounter[]
): PlayerRunStats[] {
  return playerNames.map(playerName => ({
    playerName,
    knockedOutCount: new Set(
      encounters
        .filter(encounter => encounter.koCausedBy === playerName)
        .map(encounter => encounter.routeId)
    ).size,
    notCaughtCount: new Set(
      encounters
        .filter(encounter => encounter.notCaughtBy === playerName)
        .map(encounter => encounter.routeId)
    ).size,
    isLoser: false,
  }));
}

function encounterCoverage(
  run: SelectedRun,
  isCurrentLiveRun: boolean,
  historicalEncounters: HistoricalEncounter[],
  liveEncounterCount: number
): RunComparisonSide['coverage']['encounters'] {
  if (isCurrentLiveRun) {
    return {
      status: 'live',
      documented: liveEncounterCount,
      total: liveEncounterCount,
    };
  }

  // Ein historischer Run ohne Snapshot ist von einem tatsaechlich leeren Run
  // nicht unterscheidbar. Wie in den Trends bleibt er deshalb unbekannt.
  if (run.status === 'active' || historicalEncounters.length === 0) {
    return { status: 'missing', documented: null, total: null };
  }

  const documented = historicalEncounters.filter(encounter =>
    encounter.isNotCaught
      ? encounter.notCaughtDate !== null
      : encounter.caughtAt !== null
  ).length;

  return {
    status: documented === historicalEncounters.length ? 'complete' : 'partial',
    documented,
    total: historicalEncounters.length,
  };
}

function playerCoverage(
  run: SelectedRun,
  isCurrentLiveRun: boolean
): RunTrendCoverage {
  if (isCurrentLiveRun) return 'live';
  if (run.status === 'active' || run.playerStats.length === 0) return 'missing';
  return 'complete';
}

function encounterCounts(encounters: RunEncounter[]) {
  return encounters.reduce(
    (counts, encounter) => {
      counts.encounters += 1;
      counts.caught += encounter.isNotCaught ? 0 : 1;
      counts.knockedOut += encounter.isKnockedOut ? 1 : 0;
      counts.notCaught += encounter.isNotCaught ? 1 : 0;
      return counts;
    },
    { encounters: 0, caught: 0, knockedOut: 0, notCaught: 0 }
  );
}

function createSide(
  run: SelectedRun,
  currentLiveRunId: number | null,
  historicalEncounters: HistoricalEncounter[],
  liveEncounters: LiveEncounter[],
  livePlayerNames: string[],
  now: Date
): RunComparisonSide {
  const isCurrentLiveRun = run.id === currentLiveRunId;
  const encounters = isCurrentLiveRun
    ? liveEncounters.map(mapLiveEncounter)
    : historicalEncounters.map(mapHistoricalEncounter);
  const coverage = {
    encounters: encounterCoverage(
      run,
      isCurrentLiveRun,
      historicalEncounters,
      liveEncounters.length
    ),
    playerStats: playerCoverage(run, isCurrentLiveRun),
  };
  const playerStats = isCurrentLiveRun
    ? createLivePlayerStats(livePlayerNames, liveEncounters)
    : run.status === 'active'
      ? []
      : run.playerStats;
  const counts = coverage.encounters.status === 'missing'
    ? undefined
    : encounterCounts(encounters);

  return {
    run: {
      id: run.id,
      runNumber: run.runNumber,
      status: run.status,
      loserPlayerName: run.loserPlayerName,
      startedAt: run.startedAt.toISOString(),
      endedAt: serializeDate(run.endedAt),
      badgesEarned: run.badgesEarned,
      pausedAt: serializeDate(run.pausedAt),
      totalPausedMs: run.totalPausedMs,
      archived: run.archived,
      gameVersion: run.gameVersion,
      isLive: run.status === 'active',
      durationMs: calculateRunDurationMs(run, now),
      ...(counts ? { counts } : {}),
    },
    isLive: run.status === 'active',
    playerStats,
    encounters,
    coverage,
  };
}

export async function loadRunComparisonSides(
  leftId: number,
  rightId: number
): Promise<{ left: RunComparisonSide; right: RunComparisonSide } | null> {
  const selectedRuns = await loadSelectedRuns([leftId, rightId]);
  if (selectedRuns.length !== 2) return null;

  const selectedById = new Map(selectedRuns.map(run => [run.id, run]));
  const leftRun = selectedById.get(leftId);
  const rightRun = selectedById.get(rightId);
  if (!leftRun || !rightRun) return null;

  const hasSelectedActiveRun = selectedRuns.some(run => run.status === 'active');
  const currentLiveRun = hasSelectedActiveRun
    ? await prisma.run.findFirst({
        where: { status: 'active' },
        select: { id: true },
        orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
      })
    : null;
  const selectedCurrentLiveRunId = selectedById.has(currentLiveRun?.id ?? -1)
    ? currentLiveRun?.id ?? null
    : null;
  const historicalRunIds = selectedRuns
    .filter(run => run.status !== 'active')
    .map(run => run.id);
  const [historicalEncounters, liveEncounters, livePlayers] = await Promise.all([
    loadHistoricalEncounters(historicalRunIds),
    selectedCurrentLiveRunId !== null ? loadLiveEncounters() : Promise.resolve([]),
    selectedCurrentLiveRunId !== null
      ? prisma.player.findMany({ select: { name: true }, orderBy: { name: 'asc' } })
      : Promise.resolve([]),
  ]);
  const historicalByRun = new Map<number, HistoricalEncounter[]>();
  for (const encounter of historicalEncounters) {
    const entries = historicalByRun.get(encounter.runId) ?? [];
    entries.push(encounter);
    historicalByRun.set(encounter.runId, entries);
  }
  const livePlayerNames = Array.from(new Set([
    ...livePlayers.map(player => player.name),
    ...liveEncounters.map(encounter => encounter.player.name),
    ...liveEncounters.flatMap(encounter => [
      encounter.koCausedBy,
      encounter.notCaughtBy,
    ]).filter((name): name is string => Boolean(name)),
  ])).sort((a, b) => a.localeCompare(b, 'de'));
  const now = new Date();

  return {
    left: createSide(
      leftRun,
      selectedCurrentLiveRunId,
      historicalByRun.get(leftRun.id) ?? [],
      liveEncounters,
      livePlayerNames,
      now
    ),
    right: createSide(
      rightRun,
      selectedCurrentLiveRunId,
      historicalByRun.get(rightRun.id) ?? [],
      liveEncounters,
      livePlayerNames,
      now
    ),
  };
}
