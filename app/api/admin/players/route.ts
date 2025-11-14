/**
 * Admin API: Players CRUD
 * GET /api/admin/players - Liste aller Spieler
 * POST /api/admin/players - Neuen Spieler erstellen
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { isAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Alle Spieler abrufen
export async function GET() {
  try {
    // Auth-Check
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const players = await prisma.player.findMany({
      include: {
        _count: {
          select: {
            encounters: true,
            teamMembers: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Spieler' },
      { status: 500 }
    );
  }
}

// POST: Neuen Spieler erstellen
export async function POST(request: NextRequest) {
  try {
    // Auth-Check
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await request.json();
    const { name, color } = body;

    // Validierung
    if (!name || !color) {
      return NextResponse.json(
        { error: 'Name und Farbe sind erforderlich' },
        { status: 400 }
      );
    }

    // Spieler erstellen
    const player = await prisma.player.create({
      data: {
        name,
        color,
      },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error('Error creating player:', error);
    
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Ein Spieler mit diesem Namen existiert bereits' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Spielers' },
      { status: 500 }
    );
  }
}

