import prisma from '@/lib/prisma';
import { getBadgesForGame } from '@/lib/badge-data';
import {
  getCurrentRunPlayerStats,
  getHistoricalPlayerStats,
  getRunsForDashboardGame,
} from '@/lib/dashboard-player-stats';
import { parseTypes } from '@/lib/typeEffectiveness';

export interface DashboardPokemon {
  id: number;
  pokedexId: number;
  name: string;
  nameGerman: string | null;
  types: string[];
  spriteUrl: string | null;
  spriteGifUrl: string | null;
  nickname: string | null;
  teamSlot: number;
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

export interface DashboardPlayer {
  id: number;
  name: string;
  color: string;
  avatar: string | null;
  team: DashboardPokemon[];
  stats: {
    knockedOut: number;
    notCaught: number;
  };
}

export interface DashboardData {
  run: {
    id: number;
    number: number;
    gameName: string;
    gameVersionKey: string | null;
    status: 'active' | 'paused' | 'won' | 'lost';
    statusLabel: string;
    badgesEarned: number;
    durationMs: number;
  } | null;
  badges: {
    key: string;
    name: string;
    leader: string;
    imagePath: string;
    earned: boolean;
    position: number;
  }[];
  players: DashboardPlayer[];
  playerTotals: {
    id: number;
    name: string;
    color: string;
    runs: number;
    knockedOut: number;
    notCaught: number;
    losses: number;
    lossRate: number | null;
  }[];
  totals: {
    wins: number;
    losses: number;
    winRate: number | null;
    knockedOut: number;
    notCaught: number;
  };
}

export async function loadDashboardData(): Promise<DashboardData> {
  const [runs, playerRecords, currentEncounterStats] = await Promise.all([
    prisma.run.findMany({
      where: { archived: false },
      select: {
        id: true,
        runNumber: true,
        status: true,
        startedAt: true,
        endedAt: true,
        pausedAt: true,
        totalPausedMs: true,
        badgesEarned: true,
        gameVersionKey: true,
        gameVersion: { select: { name: true } },
        playerStats: {
          select: {
            playerName: true,
            knockedOutCount: true,
            notCaughtCount: true,
            isLoser: true,
          },
        },
      },
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
    }),
    prisma.player.findMany({
      select: {
        id: true,
        name: true,
        color: true,
        avatar: true,
        encounters: {
          where: { teamSlot: { not: null } },
          select: {
            id: true,
            nickname: true,
            teamSlot: true,
            pokemon: {
              select: {
                pokedexId: true,
                name: true,
                nameGerman: true,
                types: true,
                spriteUrl: true,
                spriteGifUrl: true,
                hp: true,
                attack: true,
                defense: true,
                spAttack: true,
                spDefense: true,
                speed: true,
              },
            },
          },
          orderBy: { teamSlot: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.encounter.findMany({
      select: {
        routeId: true,
        koCausedBy: true,
        notCaughtBy: true,
      },
    }),
  ]);

  const liveRun = runs.find(run => run.status === 'active') ?? null;
  const latestRun = liveRun ?? runs[0] ?? null;
  const dashboardGameRuns = latestRun
    ? getRunsForDashboardGame(runs, latestRun.gameVersionKey)
    : [];
  const finishedRuns = dashboardGameRuns.filter(run => run.status !== 'active');
  const historicalPlayerStats = getHistoricalPlayerStats(
    playerRecords.map(player => player.name),
    dashboardGameRuns,
  );
  const currentRunPlayerStats = getCurrentRunPlayerStats(
    playerRecords.map(player => player.name),
    latestRun,
    currentEncounterStats,
  );

  const players = playerRecords.map((player): DashboardPlayer => {
    const team = player.encounters
      .filter(encounter => encounter.teamSlot !== null)
      .map((encounter): DashboardPokemon => {
        const pokemon = encounter.pokemon;
        return {
          id: encounter.id,
          pokedexId: pokemon.pokedexId,
          name: pokemon.name,
          nameGerman: pokemon.nameGerman,
          types: parseTypes(pokemon.types),
          spriteUrl: pokemon.spriteUrl,
          spriteGifUrl: pokemon.spriteGifUrl,
          nickname: encounter.nickname,
          teamSlot: encounter.teamSlot as number,
          hp: pokemon.hp,
          attack: pokemon.attack,
          defense: pokemon.defense,
          spAttack: pokemon.spAttack,
          spDefense: pokemon.spDefense,
          speed: pokemon.speed,
        };
      });

    return {
      id: player.id,
      name: player.name,
      color: player.color,
      avatar: player.avatar,
      team,
      stats: currentRunPlayerStats.get(player.name) ?? { knockedOut: 0, notCaught: 0 },
    };
  });

  const completedRuns = finishedRuns.filter(run => run.status === 'completed').length;
  const failedRuns = finishedRuns.filter(run => run.status === 'failed').length;
  const personalTotals = Array.from(historicalPlayerStats.values()).reduce(
    (totals, stats) => ({
      knockedOut: totals.knockedOut + stats.knockedOut,
      notCaught: totals.notCaught + stats.notCaught,
    }),
    { knockedOut: 0, notCaught: 0 }
  );
  const playerTotals = playerRecords.map(player => {
    const stats = historicalPlayerStats.get(player.name) ?? {
      runs: 0,
      knockedOut: 0,
      notCaught: 0,
      failed: 0,
    };

    return {
      id: player.id,
      name: player.name,
      color: player.color,
      runs: stats.runs,
      knockedOut: stats.knockedOut,
      notCaught: stats.notCaught,
      losses: stats.failed,
      lossRate: stats.runs > 0 ? Math.round((stats.failed / stats.runs) * 100) : null,
    };
  });
  const now = new Date();
  const badges = latestRun?.gameVersionKey ? getBadgesForGame(latestRun.gameVersionKey) : null;

  let status: NonNullable<DashboardData['run']>['status'] = 'active';
  if (latestRun?.status === 'completed') status = 'won';
  else if (latestRun?.status === 'failed') status = 'lost';
  else if (latestRun?.pausedAt) status = 'paused';

  const statusLabels = {
    active: 'Aktiv',
    paused: 'Pausiert',
    won: 'Gewonnen',
    lost: 'Verloren',
  } as const;

  const durationEnd = latestRun?.endedAt ?? latestRun?.pausedAt ?? now;
  const durationMs = latestRun
    ? Math.max(0, durationEnd.getTime() - latestRun.startedAt.getTime() - latestRun.totalPausedMs)
    : 0;

  return {
    run: latestRun
      ? {
          id: latestRun.id,
          number: latestRun.runNumber,
          gameName: latestRun.gameVersion?.name ?? 'Unbekannte Spielversion',
          gameVersionKey: latestRun.gameVersionKey,
          status,
          statusLabel: statusLabels[status],
          badgesEarned: latestRun.badgesEarned,
          durationMs,
        }
      : null,
    badges: (badges ?? []).map((badge, index) => ({
      key: badge.key,
      name: badge.nameDe,
      leader: badge.leaderDe,
      imagePath: badge.imagePath,
      earned: index < (latestRun?.badgesEarned ?? 0),
      position: index + 1,
    })),
    players,
    playerTotals,
    totals: {
      wins: completedRuns,
      losses: failedRuns,
      winRate: completedRuns + failedRuns > 0
        ? Math.round((completedRuns / (completedRuns + failedRuns)) * 100)
        : null,
      ...personalTotals,
    },
  };
}
