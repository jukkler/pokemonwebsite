/**
 * Admin API: Einzelner Encounter
 * DELETE /api/admin/encounters/[id] - Encounter löschen
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';

// DELETE: Encounter löschen
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
    const encounterId = parseInt(id);

    if (isNaN(encounterId)) {
      return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 });
    }

    // Encounter löschen
    await prisma.encounter.delete({
      where: { id: encounterId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting encounter:', error);

    if (error.code === 'P2025') {
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

