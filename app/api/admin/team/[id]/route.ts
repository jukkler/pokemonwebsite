/**
 * Admin API: Einzelner Team-Member
 * DELETE /api/admin/team/[id] - Team-Member entfernen
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';

// DELETE: Team-Member entfernen
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
    const teamMemberId = parseInt(id);

    if (isNaN(teamMemberId)) {
      return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 });
    }

    // Team-Member entfernen
    await prisma.teamMember.delete({
      where: { id: teamMemberId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting team member:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Team-Member nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Fehler beim Entfernen des Team-Members' },
      { status: 500 }
    );
  }
}

