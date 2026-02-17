/**
 * Admin API: Stream löschen
 * DELETE /api/admin/streams/[id] - Einzelnen Stream entfernen
 */

import { NextRequest } from 'next/server';
import { withAdminAuthAndErrorHandling, parseId, success } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuthAndErrorHandling(async () => {
    const { id } = await params;
    const streamId = parseId(id, 'Stream-ID');

    await prisma.stream.delete({ where: { id: streamId } });

    return success({ message: 'Stream entfernt' });
  }, 'deleting stream');
}
