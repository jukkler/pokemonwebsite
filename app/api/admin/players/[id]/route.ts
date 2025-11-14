/**
 * Admin API: Einzelner Spieler
 * PUT /api/admin/players/[id] - Spieler aktualisieren
 * DELETE /api/admin/players/[id] - Spieler löschen
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { isAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PUT: Spieler aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth-Check
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const { id } = await params;
    const playerId = parseInt(id);

    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 });
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

    // Spieler aktualisieren
    const player = await prisma.player.update({
      where: { id: playerId },
      data: { name, color },
    });

    return NextResponse.json(player);
  } catch (error) {
    console.error('Error updating player:', error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return NextResponse.json(
        { error: 'Spieler nicht gefunden' },
        { status: 404 }
      );
    }

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
      { error: 'Fehler beim Aktualisieren des Spielers' },
      { status: 500 }
    );
  }
}

// DELETE: Spieler löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth-Check
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const { id } = await params;
    const playerId = parseInt(id);

    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 });
    }

    // Spieler löschen (Cascade löscht auch Encounters und TeamMembers)
    await prisma.player.delete({
      where: { id: playerId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting player:', error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return NextResponse.json(
        { error: 'Spieler nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Fehler beim Löschen des Spielers' },
      { status: 500 }
    );
  }
}

