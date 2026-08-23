/**
 * API Route: Update Badge Count
 * POST /api/runs/badges - Aktualisiert den Orden-Zähler des aktiven Runs (Admin-geschützt)
 */

import { NextRequest } from 'next/server';
import { withAdminAuthAndErrorHandling, success, badRequest, notFound } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { getBadgesForGame } from '@/lib/badge-data';
import { emitEvent } from '@/lib/event-store';
import { bumpLiveRevisions } from '@/lib/live-updates.server';

export async function POST(request: NextRequest) {
  return withAdminAuthAndErrorHandling(async () => {
    const { action, badgesEarned, runId } = await request.json();

    if (action !== 'increment' && action !== 'decrement' && action !== 'set') {
      return badRequest('Ungültige Aktion. Erlaubt: increment, decrement, set');
    }

    if (runId !== undefined && (!Number.isInteger(runId) || runId <= 0)) {
      return badRequest('Ungültige Run-ID');
    }

    const activeRun = await prisma.run.findFirst({
      where: {
        status: 'active',
        archived: false,
        ...(runId !== undefined ? { id: runId } : {}),
      },
      orderBy: { startedAt: 'desc' },
    });

    if (!activeRun) {
      return notFound('Kein aktiver Run gefunden');
    }

    const badges = activeRun.gameVersionKey
      ? getBadgesForGame(activeRun.gameVersionKey)
      : null;
    const maxBadges = badges?.length ?? 8;

    let newCount: number;
    if (action === 'set') {
      if (!Number.isInteger(badgesEarned) || badgesEarned < 0 || badgesEarned > maxBadges) {
        return badRequest(`Ordenstand muss zwischen 0 und ${maxBadges} liegen`);
      }
      newCount = badgesEarned;
    } else if (action === 'increment') {
      newCount = Math.min(activeRun.badgesEarned + 1, maxBadges);
    } else {
      newCount = Math.max(activeRun.badgesEarned - 1, 0);
    }

    await prisma.$transaction(async (tx) => {
      await tx.run.update({
        where: { id: activeRun.id },
        data: { badgesEarned: newCount },
      });
      await bumpLiveRevisions(tx, ['runs']);
    });

    // Event emittieren bei Badge-Increment
    if (newCount > activeRun.badgesEarned && badges) {
      const badge = badges[newCount - 1]; // 0-indexed
      if (badge) {
        emitEvent('badge_unlocked', {
          badgeNumber: newCount,
          badgeName: badge.nameDe,
          badgeImagePath: badge.imagePath,
        });
      }
    }

    return success({ badgesEarned: newCount });
  }, 'updating badges');
}
