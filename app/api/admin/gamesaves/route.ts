/**
 * Admin API: GameSaves
 * GET /api/admin/gamesaves - Liste aller Spielstände
 * POST /api/admin/gamesaves - Aktuelles Spiel speichern
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Alle Spielstände abrufen
export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const gameSaves = await prisma.gameSave.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        // data nicht laden (kann groß sein)
      },
    });

    return NextResponse.json(gameSaves);
  } catch (error) {
    console.error('Error fetching game saves:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Spielstände' },
      { status: 500 }
    );
  }
}

// POST: Aktuelles Spiel speichern
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name ist erforderlich' },
        { status: 400 }
      );
    }

    // Exportiere alle Spieldaten
    const players = await prisma.player.findMany({
      include: {
        encounters: {
          include: {
            pokemon: true,
            route: true,
          },
        },
      },
    });

    const routes = await prisma.route.findMany({
      include: {
        encounters: {
          include: {
            pokemon: true,
            player: true,
          },
        },
      },
    });

    const gameData = {
      players,
      routes,
      savedAt: new Date().toISOString(),
    };

    // Speichere als GameSave
    const gameSave = await prisma.gameSave.create({
      data: {
        name,
        description: description || null,
        data: JSON.stringify(gameData),
      },
    });

    return NextResponse.json({
      success: true,
      gameSave: {
        id: gameSave.id,
        name: gameSave.name,
        description: gameSave.description,
        createdAt: gameSave.createdAt,
      },
    });
  } catch (error) {
    console.error('Error saving game:', error);
    return NextResponse.json(
      { error: 'Fehler beim Speichern des Spielstands' },
      { status: 500 }
    );
  }
}

