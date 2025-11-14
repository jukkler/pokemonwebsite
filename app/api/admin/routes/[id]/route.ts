/**
 * Admin API: Einzelne Route
 * PUT /api/admin/routes/[id] - Route aktualisieren
 * DELETE /api/admin/routes/[id] - Route löschen
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PUT: Route aktualisieren
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
    const routeId = parseInt(id);

    if (isNaN(routeId)) {
      return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, order } = body;

    // Validierung
    if (!name) {
      return NextResponse.json(
        { error: 'Name ist erforderlich' },
        { status: 400 }
      );
    }

    // Route aktualisieren
    const route = await prisma.route.update({
      where: { id: routeId },
      data: { name, order },
    });

    return NextResponse.json(route);
  } catch (error: any) {
    console.error('Error updating route:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Route nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Route' },
      { status: 500 }
    );
  }
}

// DELETE: Route löschen
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
    const routeId = parseInt(id);

    if (isNaN(routeId)) {
      return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 });
    }

    // Route löschen (Cascade löscht auch Encounters)
    await prisma.route.delete({
      where: { id: routeId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting route:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Route nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Fehler beim Löschen der Route' },
      { status: 500 }
    );
  }
}

