import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { resolveRunScope, runWhereForScope } from '@/lib/run-statistics';

export const dynamic = 'force-dynamic';

interface PlayerAggregate {
  playerName: string;
  totalKnockedOut: number;
  totalNotCaught: number;
  runsLost: number;
  runsParticipated: number;
}

interface PokemonAggregate {
  pokedexId: number;
  name: string;
  nameGerman: string | null;
  count: number;
  spriteUrl: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const scope = await resolveRunScope(request.nextUrl.searchParams.get('game'));
    if (!scope) {
      return NextResponse.json({ error: 'Unbekannte Spielversion' }, { status: 400 });
    }

    const runs = await prisma.run.findMany({
      where: runWhereForScope(scope),
      select: {
        id: true,
        runNumber: true,
        status: true,
        startedAt: true,
        endedAt: true,
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
        },
      },
    });
    const historicalRunIds = runs.filter(run => run.status !== 'active').map(run => run.id);
    const hasLiveRun = runs.some(run => run.status === 'active');

    const [historicalEncounters, currentEncounters, players] = await Promise.all([
      historicalRunIds.length > 0
        ? prisma.runEncounter.findMany({
            where: { runId: { in: historicalRunIds } },
            select: {
              runId: true,
              pokemonPokedexId: true,
              pokemonName: true,
              pokemonNameGerman: true,
              isKnockedOut: true,
              isNotCaught: true,
              caughtAt: true,
              notCaughtDate: true,
            },
          })
        : Promise.resolve([]),
      hasLiveRun
        ? prisma.encounter.findMany({
            select: {
              routeId: true,
              createdAt: true,
              nickname: true,
              isKnockedOut: true,
              koDate: true,
              koCausedBy: true,
              isNotCaught: true,
              notCaughtBy: true,
              player: { select: { name: true } },
              route: { select: { name: true } },
              pokemon: {
                select: {
                  pokedexId: true,
                  name: true,
                  nameGerman: true,
                  spriteUrl: true,
                },
              },
            },
          })
        : Promise.resolve([]),
      hasLiveRun
        ? prisma.player.findMany({ select: { name: true } })
        : Promise.resolve([]),
    ]);

    const playerStats = new Map<string, PlayerAggregate>();
    const ensurePlayer = (playerName: string): PlayerAggregate => {
      const existing = playerStats.get(playerName);
      if (existing) return existing;
      const created = {
        playerName,
        totalKnockedOut: 0,
        totalNotCaught: 0,
        runsLost: 0,
        runsParticipated: 0,
      };
      playerStats.set(playerName, created);
      return created;
    };

    for (const run of runs.filter(run => run.status !== 'active')) {
      for (const stat of run.playerStats) {
        const aggregate = ensurePlayer(stat.playerName);
        aggregate.totalKnockedOut += stat.knockedOutCount;
        aggregate.totalNotCaught += stat.notCaughtCount;
        aggregate.runsLost += stat.isLoser ? 1 : 0;
        aggregate.runsParticipated += 1;
      }
    }

    if (hasLiveRun) {
      const livePlayerNames = new Set(players.map(player => player.name));
      for (const encounter of currentEncounters) {
        livePlayerNames.add(encounter.player.name);
        if (encounter.koCausedBy) livePlayerNames.add(encounter.koCausedBy);
        if (encounter.notCaughtBy) livePlayerNames.add(encounter.notCaughtBy);
      }

      for (const playerName of livePlayerNames) {
        const aggregate = ensurePlayer(playerName);
        aggregate.totalKnockedOut += new Set(
          currentEncounters
            .filter(encounter => encounter.koCausedBy === playerName)
            .map(encounter => encounter.routeId)
        ).size;
        aggregate.totalNotCaught += new Set(
          currentEncounters
            .filter(encounter => encounter.notCaughtBy === playerName)
            .map(encounter => encounter.routeId)
        ).size;
        aggregate.runsParticipated += 1;
      }
    }

    const pokemonStats = new Map<number, PokemonAggregate>();
    const addPokemon = (
      pokedexId: number,
      name: string,
      nameGerman: string | null,
      spriteUrl: string | null
    ) => {
      const existing = pokemonStats.get(pokedexId);
      if (existing) {
        existing.count += 1;
        existing.nameGerman ??= nameGerman;
        existing.spriteUrl ??= spriteUrl;
        return;
      }
      pokemonStats.set(pokedexId, { pokedexId, name, nameGerman, count: 1, spriteUrl });
    };

    for (const encounter of historicalEncounters) {
      if (!encounter.isNotCaught) {
        addPokemon(
          encounter.pokemonPokedexId,
          encounter.pokemonName,
          encounter.pokemonNameGerman,
          `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${encounter.pokemonPokedexId}.png`
        );
      }
    }
    for (const encounter of currentEncounters) {
      if (!encounter.isNotCaught) {
        addPokemon(
          encounter.pokemon.pokedexId,
          encounter.pokemon.name,
          encounter.pokemon.nameGerman,
          encounter.pokemon.spriteUrl
        );
      }
    }

    const now = new Date();
    const longestTeamMembers = currentEncounters
      .filter(encounter => !encounter.isNotCaught)
      .map(encounter => {
        const endDate = encounter.isKnockedOut && encounter.koDate ? encounter.koDate : now;
        return {
          pokedexId: encounter.pokemon.pokedexId,
          name: encounter.pokemon.name,
          nameGerman: encounter.pokemon.nameGerman,
          playerName: encounter.player.name,
          routeName: encounter.route.name,
          nickname: encounter.nickname,
          daysInTeam: Math.max(
            0,
            Math.floor(
              (endDate.getTime() - encounter.createdAt.getTime()) / (1000 * 60 * 60 * 24)
            )
          ),
          isActive: !encounter.isKnockedOut,
          spriteUrl: encounter.pokemon.spriteUrl,
        };
      })
      .sort((a, b) => b.daysInTeam - a.daysInTeam)
      .slice(0, 10);

    const historicalEncountersByRun = new Map<
      number,
      typeof historicalEncounters
    >();
    for (const encounter of historicalEncounters) {
      const runEncounters = historicalEncountersByRun.get(encounter.runId) ?? [];
      runEncounters.push(encounter);
      historicalEncountersByRun.set(encounter.runId, runEncounters);
    }

    // Encounter ist ein globaler Live-Datensatz. Falls inkonsistente Altdaten
    // mehrere aktive Runs enthalten, wird er nur dem neuesten zugeordnet.
    const liveRunId = runs
      .filter(run => run.status === 'active')
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0]?.id;

    const runTrends = [...runs]
      .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime() || a.id - b.id)
      .map(run => {
        const isCurrentLiveRun = run.id === liveRunId;
        const historicalForRun = historicalEncountersByRun.get(run.id) ?? [];
        const encounters = isCurrentLiveRun
          ? currentEncounters
          : historicalForRun;

        // Ein historischer Run ohne Snapshot kann entweder wirklich leer oder
        // vor der Encounter-Historie entstanden sein. Deshalb bleiben seine
        // Werte unbekannt statt als erfundene Nullen in der Reihe zu landen.
        if (!isCurrentLiveRun && encounters.length === 0) {
          return {
            id: run.id,
            runNumber: run.runNumber,
            status: run.status,
            startedAt: run.startedAt,
            endedAt: run.endedAt,
            gameVersion: run.gameVersion,
            sampleSize: null,
            caughtCount: null,
            knockedOutCount: null,
            notCaughtCount: null,
            catchRate: null,
            detailCoverage: {
              status: 'missing' as const,
              documented: null,
              total: null,
            },
          };
        }

        const sampleSize = encounters.length;
        const caughtCount = encounters.filter(encounter => !encounter.isNotCaught).length;
        const knockedOutCount = encounters.filter(encounter => encounter.isKnockedOut).length;
        const notCaughtCount = encounters.filter(encounter => encounter.isNotCaught).length;
        const documentedDetails = isCurrentLiveRun
          ? sampleSize
          : historicalForRun.filter(encounter => (
              encounter.isNotCaught
                ? encounter.notCaughtDate !== null
                : encounter.caughtAt !== null
            )).length;
        const coverageStatus = isCurrentLiveRun
          ? 'live' as const
          : documentedDetails === sampleSize
            ? 'complete' as const
            : 'partial' as const;

        return {
          id: run.id,
          runNumber: run.runNumber,
          status: run.status,
          startedAt: run.startedAt,
          endedAt: run.endedAt,
          gameVersion: run.gameVersion,
          sampleSize,
          caughtCount,
          knockedOutCount,
          notCaughtCount,
          catchRate: sampleSize > 0 ? Math.round((caughtCount / sampleSize) * 100) : null,
          detailCoverage: {
            status: coverageStatus,
            documented: documentedDetails,
            total: sampleSize,
          },
        };
      });

    return NextResponse.json(
      {
        scope,
        playerStats: Array.from(playerStats.values()).sort((a, b) =>
          a.playerName.localeCompare(b.playerName, 'de')
        ),
        mostCaught: Array.from(pokemonStats.values())
          .sort((a, b) => b.count - a.count || a.pokedexId - b.pokedexId)
          .slice(0, 10),
        longestTeamMembers,
        runTrends,
        dataCoverage: {
          historicalEncounterCount: historicalEncounters.length,
          historicalEncountersWithDetails: historicalEncounters.filter(
            encounter => encounter.isNotCaught
              ? encounter.notCaughtDate !== null
              : encounter.caughtAt !== null
          ).length,
          historicalEncountersMissingDetails: historicalEncounters.filter(
            encounter => encounter.isNotCaught
              ? encounter.notCaughtDate === null
              : encounter.caughtAt === null
          ).length,
          liveEncounterCount: currentEncounters.length,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error fetching run analytics:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Analytics' },
      { status: 500 }
    );
  }
}
