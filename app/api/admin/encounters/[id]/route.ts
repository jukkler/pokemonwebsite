/**
 * Admin API: Einzelner Encounter
 * PUT /api/admin/encounters/[id] - Encounter aktualisieren
 * DELETE /api/admin/encounters/[id] - Encounter löschen
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { isAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';

const parseEncounterId = async (params: Promise<{ id: string }>) => {
  const { id } = await params;
  const encounterId = parseInt(id, 10);
  if (Number.isNaN(encounterId)) {
    throw new Error('invalid-id');
  }
  return encounterId;
};

// PUT: Encounter aktualisieren (Pokémon/Nickname)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    let encounterId: number;
    try {
      encounterId = await parseEncounterId(params);
    } catch {
      return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 });
    }

    const body = await request.json();
    const { pokemonId, nickname } = body;

    if (!pokemonId) {
      return NextResponse.json(
        { error: 'Pokémon-ID ist erforderlich' },
        { status: 400 }
      );
    }

    const parsedPokemonId = parseInt(pokemonId, 10);
    if (Number.isNaN(parsedPokemonId)) {
      return NextResponse.json(
        { error: 'Ungültige Pokémon-ID' },
        { status: 400 }
      );
    }

    const updatedEncounter = await prisma.encounter.update({
      where: { id: encounterId },
      data: {
        pokemonId: parsedPokemonId,
        nickname: nickname?.trim() ? nickname.trim() : null,
      },
      include: {
        player: true,
        route: true,
        pokemon: true,
      },
    });

    return NextResponse.json(updatedEncounter);
  } catch (error) {
    console.error('Error updating encounter:', error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return NextResponse.json(
        { error: 'Encounter nicht gefunden' },
        { status: 404 }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    ) {
      return NextResponse.json(
        { error: 'Ungültige Pokémon-ID' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Encounters' },
      { status: 500 }
    );
  }
}

// DELETE: Encounter löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    let encounterId: number;
    try {
      encounterId = await parseEncounterId(params);
    } catch {
      return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 });
    }

    await prisma.encounter.delete({
      where: { id: encounterId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting encounter:', error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return NextResponse.json(
        { error: 'Encounter nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Fehler beim Löschen des Encounters' },
      { status: 500 }
    );
  }
}

