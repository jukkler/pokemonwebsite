/**
 * Tabelle Page
 * Vergleich aller gefangenen Pokémon nach Route und Spielern
 */

import TabelleClient, { RouteRow } from './TabelleClient';
import prisma from '@/lib/prisma';
import { parseTypes } from '@/lib/typeEffectiveness';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PlayerInfo = {
  id: number;
  name: string;
  color: string;
};

type EncounterStatus = 'ko' | 'notCaught' | null;

async function getTableData(): Promise<{
  players: PlayerInfo[];
  rows: RouteRow[];
}> {
  try {
    const [players, routes] = await Promise.all([
      prisma.player.findMany({
        select: {
          id: true,
          name: true,
          color: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.route.findMany({
        include: {
          encounters: {
            include: {
              player: true,
              pokemon: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      }),
    ]);

    const rows: RouteRow[] = routes.map((route) => {
      let rowStatus: EncounterStatus = null;

      const playerCells = players.map((player) => {
        const encounter = route.encounters.find(
          (enc) => enc.playerId === player.id
        );

        if (!encounter) {
          return null;
        }

        const { pokemon } = encounter;
        const status: EncounterStatus = encounter.isKnockedOut
          ? 'ko'
          : encounter.isNotCaught
            ? 'notCaught'
            : null;

        if (status) {
          if (status === 'ko') {
            rowStatus = 'ko';
          } else if (rowStatus !== 'ko') {
            rowStatus = 'notCaught';
          }
        }

        const basePoints =
          pokemon.hp +
          pokemon.attack +
          pokemon.defense +
          pokemon.spAttack +
          pokemon.spDefense +
          pokemon.speed;

        return {
          playerId: player.id,
          pokedexId: pokemon.pokedexId ?? null,
          pokemonName: pokemon.name,
          pokemonGermanName: pokemon.nameGerman,
          types: parseTypes(pokemon.types),
          basePoints,
          status,
          spriteUrl: pokemon.spriteUrl,
          spriteGifUrl: pokemon.spriteGifUrl,
        };
      });

      const basePointValues = playerCells
        .map((cell) => cell?.basePoints)
        .filter((value): value is number => typeof value === 'number');

      const averageBasePoints =
        basePointValues.length > 0
          ? basePointValues.reduce((sum, value) => sum + value, 0) /
            basePointValues.length
          : null;

      return {
        id: route.id,
        name: route.name,
        order: route.order,
        players: playerCells,
        averageBasePoints,
        status: rowStatus,
      };
    });

    return { players, rows };
  } catch (error) {
    console.error('Error building table data:', error);
    return { players: [], rows: [] };
  }
}

export default async function TabellePage() {
  const data = await getTableData();

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 max-w-7xl">
      <div className="mb-6 md:mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 mb-2">
          Übersicht
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-3">Tabelle</h1>
        <p className="text-gray-600 max-w-3xl">
          Vergleich aller gefangenen Pokémon je Route. Die Spalten zeigen das
          aktuell gefangene Pokémon pro Spieler inklusive Typen und
          Basispunkte (Summe aller Statuswerte). Der Durchschnitt berechnet
          sich aus den Basispunkten aller auf der Route gefangenen Pokémon.
          Über die Spaltenüberschriften lässt sich die Tabelle sortieren.
        </p>
      </div>

      <TabelleClient players={data.players} rows={data.rows} />
    </div>
  );
}


