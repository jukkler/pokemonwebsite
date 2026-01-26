/**
 * Public API: Players
 * GET /api/players - Liste aller Spieler mit aktuellen Teams
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Performance: Nur benötigte Felder selektieren statt include: true
    const players = await prisma.player.findMany({
      select: {
        id: true,
        name: true,
        color: true,
        avatar: true,
        createdAt: true,
        encounters: {
          where: {
            teamSlot: { not: null }, // Nur Team-Encounters
          },
          select: {
            id: true,
            teamSlot: true,
            nickname: true,
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
            route: {
              select: {
                id: true,
                name: true,
              },
            },
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

    return NextResponse.json(playersWithTeams, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Spieler' },
      { status: 500 }
    );
  }
}

