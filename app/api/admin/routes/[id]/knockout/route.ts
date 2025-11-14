/**
 * Admin API: K.O.-Verwaltung für Routen
 * POST /api/admin/routes/[id]/knockout - Setzt alle Encounters einer Route K.O.
 * DELETE /api/admin/routes/[id]/knockout - Reaktiviert alle Encounters einer Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST: Encounters K.O. setzen
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const { id } = await params;
    const routeId = parseInt(id);

    if (isNaN(routeId)) {
      return NextResponse.json({ error: 'Ungültige Routen-ID' }, { status: 400 });
    }

    const { causedBy, reason } = await request.json();

    if (!causedBy || !reason) {
      return NextResponse.json(
        { error: 'Verursacher und Grund sind erforderlich' },
        { status: 400 }
      );
    }

    // Setze alle Encounters dieser Route K.O.
    const result = await prisma.encounter.updateMany({
      where: { routeId },
      data: {
        isKnockedOut: true,
        koCausedBy: causedBy,
        koReason: reason,
        koDate: new Date(),
        teamSlot: null, // Entferne aus Team
      },
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} Pokémon wurden K.O. gesetzt`,
      count: result.count,
    });
  } catch (error) {
    console.error('Error knocking out encounters:', error);
    return NextResponse.json(
      { error: 'Fehler beim K.O.-Setzen' },
      { status: 500 }
    );
  }
}

// DELETE: Encounters reaktivieren
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const { id } = await params;
    const routeId = parseInt(id);

    if (isNaN(routeId)) {
      return NextResponse.json({ error: 'Ungültige Routen-ID' }, { status: 400 });
    }

    // Reaktiviere alle Encounters dieser Route
    const result = await prisma.encounter.updateMany({
      where: { routeId },
      data: {
        isKnockedOut: false,
        koCausedBy: null,
        koReason: null,
        koDate: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} Pokémon wurden reaktiviert`,
      count: result.count,
    });
  } catch (error) {
    console.error('Error reactivating encounters:', error);
    return NextResponse.json(
      { error: 'Fehler beim Reaktivieren' },
      { status: 500 }
    );
  }
}

