/**
 * Admin API: Encounters CRUD
 * GET /api/admin/encounters - Liste aller Encounters
 * POST /api/admin/encounters - Neuen Encounter erstellen
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Alle Encounters abrufen
export async function GET() {
  try {
    // Auth-Check
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const encounters = await prisma.encounter.findMany({
      include: {
        player: true,
        route: true,
        pokemon: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(encounters);
  } catch (error) {
    console.error('Error fetching encounters:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Encounters' },
      { status: 500 }
    );
  }
}

// POST: Neuen Encounter erstellen
export async function POST(request: NextRequest) {
  try {
    // Auth-Check
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await request.json();
    const { playerId, routeId, pokemonId, nickname } = body;

    // Validierung
    if (!playerId || !routeId || !pokemonId) {
      return NextResponse.json(
        { error: 'Spieler, Route und Pokémon sind erforderlich' },
        { status: 400 }
      );
    }

    // REGEL: Prüfe, ob Spieler bereits ein Pokémon auf dieser Route hat
    const existingEncounter = await prisma.encounter.findFirst({
      where: {
        playerId: parseInt(playerId),
        routeId: parseInt(routeId),
      },
      include: {
        pokemon: true,
        route: true,
      },
    });

    if (existingEncounter) {
      return NextResponse.json(
        { 
          error: `Dieser Spieler hat bereits ein Pokémon auf dieser Route gefangen: ${existingEncounter.pokemon.nameGerman || existingEncounter.pokemon.name} auf ${existingEncounter.route.name}. Jeder Spieler darf nur 1 Pokémon pro Route fangen.` 
        },
        { status: 409 }
      );
    }

    // Encounter erstellen
    const encounter = await prisma.encounter.create({
      data: {
        playerId: parseInt(playerId),
        routeId: parseInt(routeId),
        pokemonId: parseInt(pokemonId),
        nickname: nickname || null,
      },
      include: {
        player: true,
        route: true,
        pokemon: true,
      },
    });

    return NextResponse.json(encounter, { status: 201 });
  } catch (error: any) {
    console.error('Error creating encounter:', error);

    // Unique Constraint Error
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Dieser Spieler hat bereits ein Pokémon auf dieser Route gefangen. Jeder Spieler darf nur 1 Pokémon pro Route fangen.' },
        { status: 409 }
      );
    }

    // Foreign Key Constraint Error
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Ungültige Spieler-, Routen- oder Pokémon-ID' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Encounters' },
      { status: 500 }
    );
  }
}

