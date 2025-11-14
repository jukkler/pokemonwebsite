/**
 * Public API: Players
 * GET /api/players - Liste aller Spieler mit aktuellen Teams
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      include: {
        encounters: {
          where: {
            teamSlot: { not: null }, // Nur Team-Encounters
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

    // Mappe encounters zu teamMembers für Kompatibilität
    const playersWithTeams = players.map(player => ({
      ...player,
      teamMembers: player.encounters,
    }));

    return NextResponse.json(playersWithTeams);
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Spieler' },
      { status: 500 }
    );
  }
}

