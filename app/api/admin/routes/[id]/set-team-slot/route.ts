/**
 * Admin API: Setze Team-Slot für eine Route
 * POST /api/admin/routes/[id]/set-team-slot
 * Alle Encounters dieser Route werden auf den angegebenen Slot gesetzt
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
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
    const { teamSlot } = body;

    // Validierung: Slot muss 1-6 oder null sein
    if (teamSlot !== null && (teamSlot < 1 || teamSlot > 6)) {
      return NextResponse.json(
        { error: 'Team-Slot muss zwischen 1 und 6 liegen oder null sein' },
        { status: 400 }
      );
    }

    // Wenn Slot nicht null: Prüfe, ob der Slot bereits von einer anderen Route belegt ist
    if (teamSlot !== null) {
      const conflictingRoute = await prisma.encounter.findFirst({
        where: {
          teamSlot,
          routeId: { not: routeId },
        },
        include: {
          route: true,
        },
      });

      if (conflictingRoute) {
        return NextResponse.json(
          { 
            error: `Slot ${teamSlot} ist bereits von Route "${conflictingRoute.route.name}" belegt` 
          },
          { status: 409 }
        );
      }
    }

    // Aktualisiere alle Encounters dieser Route
    const updated = await prisma.encounter.updateMany({
      where: { routeId },
      data: { teamSlot },
    });

    return NextResponse.json({
      success: true,
      count: updated.count,
      teamSlot,
    });
  } catch (error: any) {
    console.error('Error setting team slot:', error);
    return NextResponse.json(
      { error: 'Fehler beim Setzen des Team-Slots' },
      { status: 500 }
    );
  }
}

