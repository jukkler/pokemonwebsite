/**
 * Public API: Routes
 * GET /api/routes - Liste aller Routen mit Encounters
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
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

    // Stelle sicher, dass teamSlot included ist
    return NextResponse.json(routes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Routen' },
      { status: 500 }
    );
  }
}

