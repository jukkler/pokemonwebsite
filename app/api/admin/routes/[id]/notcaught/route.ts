/**
 * Admin API: Route "Nicht gefangen" Status
 * POST /api/admin/routes/[id]/notcaught - Route als "Nicht gefangen" markieren
 * DELETE /api/admin/routes/[id]/notcaught - Route reaktivieren
 */

import { NextRequest } from 'next/server';
import {
  withAdminAuthAndErrorHandling,
  parseId,
  validateRequired,
  badRequest,
  success,
} from '@/lib/api-utils';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuthAndErrorHandling(async () => {
    const { id } = await params;
    let routeId: number;

    try {
      routeId = parseId(id, 'Routen-ID');
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : 'Ungültige Routen-ID');
    }

    const body = await request.json();
    const { causedBy, reason } = body;

    try {
      validateRequired(body, ['causedBy']);
    } catch (error) {
      return badRequest(
        error instanceof Error ? error.message : 'Verursacher ist erforderlich'
      );
    }

    // Setze alle Encounters dieser Route auf "Nicht gefangen"
    await prisma.encounter.updateMany({
      where: { routeId },
      data: {
        isNotCaught: true,
        notCaughtBy: String(causedBy).trim(),
        notCaughtReason: reason && String(reason).trim() ? String(reason).trim() : null,
        notCaughtDate: new Date(),
        teamSlot: null, // Entferne aus Team
      },
    });

    return success({ message: `Route ${routeId} als "Nicht gefangen" markiert.` });
  }, 'setting route not-caught status');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuthAndErrorHandling(async () => {
    const { id } = await params;
    let routeId: number;

    try {
      routeId = parseId(id, 'Routen-ID');
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : 'Ungültige Routen-ID');
    }

    // Reaktiviere alle Encounters dieser Route
    await prisma.encounter.updateMany({
      where: { routeId },
      data: {
        isNotCaught: false,
        notCaughtBy: null,
        notCaughtReason: null,
        notCaughtDate: null,
      },
    });

    return success({ message: `Route ${routeId} reaktiviert.` });
  }, 'reactivating route');
}

