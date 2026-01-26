/**
 * Public API: Routes
 * GET /api/routes - Liste aller Routen mit Encounters
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Performance: Nur benötigte Felder selektieren statt include: true
    const routes = await prisma.route.findMany({
      select: {
        id: true,
        name: true,
        order: true,
        encounters: {
          select: {
            id: true,
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
            player: {
              select: {
                id: true,
                name: true,
                color: true,
                avatar: true,
              },
            },
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
        },
      },
      orderBy: { order: 'asc' },
    });

    // Stelle sicher, dass teamSlot included ist
    return NextResponse.json(routes, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Routen' },
      { status: 500 }
    );
  }
}

