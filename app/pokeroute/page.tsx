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
    return routes.map(route => ({
      ...route,
      encounters: route.encounters.map(e => ({
        ...e,
        teamSlot: e.teamSlot,
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

