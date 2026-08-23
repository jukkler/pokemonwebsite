/**
 * API Route: Toggle Run Pause
 * POST /api/runs/pause - Pausiert oder setzt den aktiven Run fort (Admin-geschützt)
 */

import { NextResponse } from 'next/server';
import { withAdminAuthAndErrorHandling, success } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { bumpLiveRevisions } from '@/lib/live-updates.server';

export async function POST() {
  return withAdminAuthAndErrorHandling(async () => {
    const activeRun = await prisma.run.findFirst({
      where: { status: 'active' },
      orderBy: { startedAt: 'desc' },
    });

    if (!activeRun) {
      return NextResponse.json(
        { error: 'Kein aktiver Run gefunden' },
        { status: 404 }
      );
    }

    const now = new Date();

    if (activeRun.pausedAt) {
      const pauseDuration = now.getTime() - new Date(activeRun.pausedAt).getTime();
      await prisma.$transaction(async (tx) => {
        await tx.run.update({
          where: { id: activeRun.id },
          data: {
            pausedAt: null,
            totalPausedMs: activeRun.totalPausedMs + pauseDuration,
          },
        });
        await bumpLiveRevisions(tx, ['runs']);
      });
      return success({ action: 'resumed', message: 'Run fortgesetzt' });
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.run.update({
          where: { id: activeRun.id },
          data: { pausedAt: now },
        });
        await bumpLiveRevisions(tx, ['runs']);
      });
      return success({ action: 'paused', message: 'Run pausiert' });
    }
  }, 'toggling run pause');
}
