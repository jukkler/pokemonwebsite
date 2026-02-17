/**
 * API Route: Update Badge Count
 * POST /api/runs/badges - Aktualisiert den Orden-Zähler des aktiven Runs (Admin-geschützt)
 */

import { NextRequest } from 'next/server';
import { withAdminAuthAndErrorHandling, success, badRequest, notFound } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { getBadgesForGame } from '@/lib/badge-data';
import { emitEvent } from '@/lib/event-store';

export async function POST(request: NextRequest) {
  return withAdminAuthAndErrorHandling(async () => {
    const { action } = await request.json();

    if (action !== 'increment' && action !== 'decrement') {
      return badRequest('Ungültige Aktion. Erlaubt: increment, decrement');
    }

    const activeRun = await prisma.run.findFirst({
      where: { status: 'active' },
      orderBy: { startedAt: 'desc' },
    });

    if (!activeRun) {
      return notFound('Kein aktiver Run gefunden');
    }

    const badges = activeRun.gameVersionKey
      ? getBadgesForGame(activeRun.gameVersionKey)
      : null;
    const maxBadges = badges?.length ?? 8;

    let newCount = activeRun.badgesEarned;
    if (action === 'increment') {
      newCount = Math.min(newCount + 1, maxBadges);
    } else {
      newCount = Math.max(newCount - 1, 0);
    }

    await prisma.run.update({
      where: { id: activeRun.id },
      data: { badgesEarned: newCount },
    });

    // Event emittieren bei Badge-Increment
    if (action === 'increment' && badges) {
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
