import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';

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

    const body = await request.json();
    const { causedBy, reason } = body;

    if (!causedBy) {
      return NextResponse.json(
        { error: 'Verursacher ist erforderlich' },
        { status: 400 }
      );
    }

    // Setze alle Encounters dieser Route auf "Nicht gefangen"
    await prisma.encounter.updateMany({
      where: { routeId },
      data: {
        isNotCaught: true,
        notCaughtBy: causedBy,
        notCaughtReason: reason && reason.trim() ? reason.trim() : null,
        notCaughtDate: new Date(),
        teamSlot: null, // Entferne aus Team
      },
    });

    return NextResponse.json({ message: `Route ${routeId} als "Nicht gefangen" markiert.` });
  } catch (error: any) {
    console.error('Error setting route not-caught status:', error);
    return NextResponse.json(
      { error: `Fehler beim Setzen des "Nicht gefangen"-Status: ${error.message || 'Unbekannter Fehler'}` },
      { status: 500 }
    );
  }
}

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
    await prisma.encounter.updateMany({
      where: { routeId },
      data: {
        isNotCaught: false,
        notCaughtBy: null,
        notCaughtReason: null,
        notCaughtDate: null,
      },
    });

    return NextResponse.json({ message: `Route ${routeId} reaktiviert.` });
  } catch (error) {
    console.error('Error reactivating route:', error);
    return NextResponse.json(
      { error: 'Fehler beim Reaktivieren der Route' },
      { status: 500 }
    );
  }
}

