/**
 * Admin API: Team Management
 * POST /api/admin/team - Team-Member hinzufügen/aktualisieren
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { isAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST: Team-Member setzen (upsert)
export async function POST(request: NextRequest) {
  try {
    // Auth-Check
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await request.json();
    const { playerId, pokemonId, nickname, position } = body;

    // Validierung
    if (!playerId || !pokemonId || !position) {
      return NextResponse.json(
        { error: 'Spieler, Pokémon und Position sind erforderlich' },
        { status: 400 }
      );
    }

    // Position muss zwischen 1 und 6 sein
    if (position < 1 || position > 6) {
      return NextResponse.json(
        { error: 'Position muss zwischen 1 und 6 liegen' },
        { status: 400 }
      );
    }

    // Team-Member erstellen oder aktualisieren (upsert)
    const teamMember = await prisma.teamMember.upsert({
      where: {
        playerId_position: {
          playerId: parseInt(playerId),
          position: parseInt(position),
        },
      },
      update: {
        pokemonId: parseInt(pokemonId),
        nickname: nickname || null,
      },
      create: {
        playerId: parseInt(playerId),
        pokemonId: parseInt(pokemonId),
        nickname: nickname || null,
        position: parseInt(position),
      },
      include: {
        player: true,
        pokemon: true,
      },
    });

    return NextResponse.json(teamMember, { status: 201 });
  } catch (error) {
    console.error('Error creating team member:', error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    ) {
      return NextResponse.json(
        { error: 'Ungültige Spieler- oder Pokémon-ID' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Fehler beim Setzen des Team-Members' },
      { status: 500 }
    );
  }
}

