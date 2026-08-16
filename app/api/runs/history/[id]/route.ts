import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateRunDurationMs } from '@/lib/run-statistics';

export const dynamic = 'force-dynamic';

function parseRunId(rawId: string): number | null {
  if (!/^\d+$/.test(rawId)) return null;
  const id = Number(rawId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = parseRunId(rawId);
    if (id === null) {
      return NextResponse.json({ error: 'Ungültige Run-ID' }, { status: 400 });
    }

    const run = await prisma.run.findUnique({
      where: { id },
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
            id: true,
            runId: true,
            playerName: true,
            knockedOutCount: true,
            notCaughtCount: true,
            isLoser: true,
          },
          orderBy: { playerName: 'asc' },
        },
      },
    });

    if (!run) {
      return NextResponse.json({ error: 'Run nicht gefunden' }, { status: 404 });
    }

    const isLive = run.status === 'active';
    const [snapshotEncounters, currentEncounters, currentPlayers] = await Promise.all([
      !isLive
        ? prisma.runEncounter.findMany({
            where: { runId: run.id },
            select: {
              id: true,
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
          })
        : Promise.resolve([]),
      isLive
        ? prisma.encounter.findMany({
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
          })
        : Promise.resolve([]),
      isLive
        ? prisma.player.findMany({ select: { name: true }, orderBy: { name: 'asc' } })
        : Promise.resolve([]),
    ]);

    const encounters = isLive
      ? currentEncounters.map(encounter => ({
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
          koDate: encounter.koDate,
          isNotCaught: encounter.isNotCaught,
          notCaughtBy: encounter.notCaughtBy,
          notCaughtReason: encounter.notCaughtReason,
          notCaughtDate: encounter.notCaughtDate,
          caughtAt: encounter.createdAt,
        }))
      : snapshotEncounters.map(encounter => ({
          ...encounter,
          spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${encounter.pokemonPokedexId}.png`,
        }));

    const playerStats = isLive
      ? currentPlayers.map(player => {
          const knockedOutRoutes = new Set(
            currentEncounters
              .filter(encounter => encounter.koCausedBy === player.name)
              .map(encounter => encounter.routeId)
          );
          const notCaughtRoutes = new Set(
            currentEncounters
              .filter(encounter => encounter.notCaughtBy === player.name)
              .map(encounter => encounter.routeId)
          );
          return {
            id: null,
            runId: run.id,
            playerName: player.name,
            knockedOutCount: knockedOutRoutes.size,
            notCaughtCount: notCaughtRoutes.size,
            isLoser: false,
          };
        })
      : run.playerStats;

    const counts = encounters.reduce(
      (result, encounter) => {
        result.encounters += 1;
        result.caught += encounter.isNotCaught ? 0 : 1;
        result.knockedOut += encounter.isKnockedOut ? 1 : 0;
        result.notCaught += encounter.isNotCaught ? 1 : 0;
        return result;
      },
      { encounters: 0, caught: 0, knockedOut: 0, notCaught: 0 }
    );

    const runSummary = {
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
      isLive,
      counts,
      durationMs: calculateRunDurationMs(run),
    };

    return NextResponse.json(
      { run: runSummary, isLive, playerStats, encounters },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error fetching run details:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Run-Details' },
      { status: 500 }
    );
  }
}
