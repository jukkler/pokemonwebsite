/**
 * Admin API: Einzelner Team-Member
 * DELETE /api/admin/team/[id] - Team-Member entfernen
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withAdminAuthAndErrorHandling,
  parseId,
  badRequest,
  success,
} from '@/lib/api-utils';
import prisma from '@/lib/prisma';

// DELETE: Team-Member entfernen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuthAndErrorHandling(async () => {
    const { id } = await params;
    let teamMemberId: number;

    try {
      teamMemberId = parseId(id, 'Team-Member-ID');
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : 'Ungültige ID');
    }

    try {
      // Team-Member entfernen
      await prisma.teamMember.delete({
        where: { id: teamMemberId },
      });

      return success();
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2025') {
        return NextResponse.json({ error: 'Team-Member nicht gefunden' }, { status: 404 });
      }
      throw error;
    }
  }, 'deleting team member');
}

