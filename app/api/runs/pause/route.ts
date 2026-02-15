/**
 * API Route: Toggle Run Pause
 * POST /api/runs/pause - Pausiert oder setzt den aktiven Run fort
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    // Hole aktiven Run
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

    // Toggle Pause-Status
    if (activeRun.pausedAt) {
      // Run ist pausiert → fortsetzen
      const pauseDuration = now.getTime() - new Date(activeRun.pausedAt).getTime();

      await prisma.run.update({
        where: { id: activeRun.id },
        data: {
          pausedAt: null,
          totalPausedMs: activeRun.totalPausedMs + pauseDuration,
        },
      });

      return NextResponse.json({
        success: true,
        action: 'resumed',
        message: 'Run fortgesetzt',
      });
    } else {
      // Run läuft → pausieren
      await prisma.run.update({
        where: { id: activeRun.id },
        data: {
          pausedAt: now,
        },
      });

      return NextResponse.json({
        success: true,
        action: 'paused',
        message: 'Run pausiert',
      });
    }
  } catch (error) {
    console.error('Error toggling run pause:', error);
    return NextResponse.json(
      { error: 'Fehler beim Pausieren/Fortsetzen' },
      { status: 500 }
    );
  }
}
