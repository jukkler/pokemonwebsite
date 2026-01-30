/**
 * Admin API: Runs
 * GET /api/admin/runs - Alle Runs abrufen (aktueller + historische)
 * POST /api/admin/runs - Neuen Run starten
 */

import { NextRequest } from 'next/server';
import { withAdminAuthAndErrorHandling, success, badRequest } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

export async function GET() {
  return withAdminAuthAndErrorHandling(async () => {
    const runs = await prisma.run.findMany({
      include: {
        gameVersion: true,
        playerStats: true,
      },
      orderBy: { runNumber: 'desc' },
    });

    // Finde den aktiven Run
    const activeRun = runs.find(r => r.status === 'active');
    const historicalRuns = runs.filter(r => r.status !== 'active');

    return success({
      activeRun,
      historicalRuns,
      totalRuns: runs.length,
      failedRuns: runs.filter(r => r.status === 'failed').length,
      completedRuns: runs.filter(r => r.status === 'completed').length,
    });
  }, 'fetching runs');
}

export async function POST(request: NextRequest) {
  return withAdminAuthAndErrorHandling(async () => {
    const body = await request.json();
    const { gameVersionKey } = body;

    // Prüfe ob bereits ein aktiver Run existiert
    const existingActiveRun = await prisma.run.findFirst({
      where: { status: 'active' },
    });

    if (existingActiveRun) {
      return badRequest('Es existiert bereits ein aktiver Run. Bitte beende diesen zuerst.');
    }

    // Berechne die nächste Run-Nummer
    const lastRun = await prisma.run.findFirst({
      orderBy: { runNumber: 'desc' },
    });
    const nextRunNumber = (lastRun?.runNumber ?? 0) + 1;

    // Erstelle den neuen Run
    const run = await prisma.run.create({
      data: {
        runNumber: nextRunNumber,
        gameVersionKey: gameVersionKey || null,
        status: 'active',
      },
      include: {
        gameVersion: true,
      },
    });

    return success(run);
  }, 'creating run');
}
