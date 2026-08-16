import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import {
  buildPokeradarHref,
  type PokeradarPlayerTeam,
  type PokeradarSelectionStatus,
  type PokeradarTeamsResponse,
} from '@/lib/pokeradar-team-data';

function getEncounterStatus(encounter: {
  isKnockedOut: boolean;
  isNotCaught: boolean;
}): PokeradarSelectionStatus {
  if (encounter.isNotCaught) return 'not-caught';
  if (encounter.isKnockedOut) return 'ko';
  return 'team';
}

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      select: {
        id: true,
        name: true,
        color: true,
        encounters: {
          where: { teamSlot: { not: null } },
          select: {
            id: true,
            teamSlot: true,
            nickname: true,
            isKnockedOut: true,
            isNotCaught: true,
            pokemon: {
              select: {
                pokedexId: true,
                name: true,
                nameGerman: true,
                spriteUrl: true,
              },
            },
            route: {
              select: { name: true },
            },
          },
          orderBy: [{ teamSlot: 'asc' }, { id: 'asc' }],
        },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    const response: PokeradarTeamsResponse = {
      players: players.map((player): PokeradarPlayerTeam => {
        const occupiedSlots = new Set<number>();
        const teamSlots = player.encounters.flatMap((encounter) => {
          const teamSlot = encounter.teamSlot;

          // Team-Slots sind im Schema nullable und in älteren Imports nicht
          // zwingend eindeutig. Ungültige bzw. doppelte Plätze überspringen wir.
          if (
            teamSlot === null ||
            teamSlot < 1 ||
            teamSlot > 6 ||
            occupiedSlots.has(teamSlot)
          ) {
            return [];
          }

          occupiedSlots.add(teamSlot);

          return [
            {
              encounterId: encounter.id,
              teamSlot,
              pokedexId: encounter.pokemon.pokedexId,
              pokemonName: encounter.pokemon.name,
              pokemonNameGerman: encounter.pokemon.nameGerman,
              spriteUrl: encounter.pokemon.spriteUrl,
              nickname: encounter.nickname,
              routeName: encounter.route.name,
              status: getEncounterStatus(encounter),
            },
          ];
        });

        return {
          id: player.id,
          name: player.name,
          color: player.color,
          teamSlots,
          comparisonHref: buildPokeradarHref(teamSlots, {
            source: 'team',
            sourceLabel: `Team von ${player.name}`,
          }),
        };
      }),
    };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Error fetching Pokeradar teams:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Teams' },
      { status: 500 },
    );
  }
}
