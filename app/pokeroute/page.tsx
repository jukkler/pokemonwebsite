/**
 * Pokeroute Page
 * Zeigt aktuelle Teams und Routen mit Encounters
 */

import PokerouteClient from './PokerouteClient';
import prisma from '@/lib/prisma';

async function getPlayers() {
  try {
    const players = await prisma.player.findMany({
      include: {
        encounters: {
          where: {
            teamSlot: { not: null }, // Nur Encounters im Team
          },
          include: {
            pokemon: true,
            route: true,
          },
          orderBy: {
            teamSlot: 'asc',
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return players;
  } catch (error) {
    console.error('Error fetching players:', error);
    return [];
  }
}

async function getRoutes() {
  try {
    const routes = await prisma.route.findMany({
      include: {
        encounters: {
          include: {
            player: true,
            pokemon: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });
    
    // Serialize für Client-Komponente
    return routes.map((route) => ({
      id: route.id,
      name: route.name,
      order: route.order,
      encounters: route.encounters.map((e) => ({
        id: e.id,
        nickname: e.nickname,
        teamSlot: e.teamSlot,
        isKnockedOut: e.isKnockedOut,
        koCausedBy: e.koCausedBy,
        koReason: e.koReason,
        koDate: e.koDate ? e.koDate.toISOString() : null,
        isNotCaught: e.isNotCaught,
        notCaughtBy: e.notCaughtBy,
        notCaughtReason: e.notCaughtReason,
        notCaughtDate: e.notCaughtDate ? e.notCaughtDate.toISOString() : null,
        player: {
          id: e.player.id,
          name: e.player.name,
          color: e.player.color,
        },
        pokemon: {
          pokedexId: e.pokemon.pokedexId,
          name: e.pokemon.name,
          nameGerman: e.pokemon.nameGerman,
          types: e.pokemon.types,
          spriteUrl: e.pokemon.spriteUrl,
          hp: e.pokemon.hp,
          attack: e.pokemon.attack,
          defense: e.pokemon.defense,
          spAttack: e.pokemon.spAttack,
          spDefense: e.pokemon.spDefense,
          speed: e.pokemon.speed,
        },
      })),
    }));
  } catch (error) {
    console.error('Error fetching routes:', error);
    return [];
  }
}

export default async function PokeroutePage() {
  const [players, routes] = await Promise.all([
    getPlayers(),
    getRoutes(),
  ]);

  return (
    <PokerouteClient 
      initialPlayers={players}
      initialRoutes={routes}
    />
  );
}

