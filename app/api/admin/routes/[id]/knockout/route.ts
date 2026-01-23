/**
 * Admin API: K.O.-Verwaltung für Routen
 * POST /api/admin/routes/[id]/knockout - Setzt alle Encounters einer Route K.O.
 * DELETE /api/admin/routes/[id]/knockout - Reaktiviert alle Encounters einer Route
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
    const routeId = parseId(id, 'Routen-ID');
    const body = await request.json();

    validateRequired(body, ['causedBy', 'reason']);
    const { causedBy, reason } = body;

    const result = await prisma.encounter.updateMany({
      where: { routeId },
      data: {
        isKnockedOut: true,
        koCausedBy: String(causedBy).trim(),
        koReason: String(reason).trim(),
        koDate: new Date(),
        teamSlot: null,
      },
    });

    return success({
      message: `${result.count} Pokémon wurden K.O. gesetzt`,
      count: result.count,
    });
  }, 'knocking out encounters');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuthAndErrorHandling(async () => {
    const { id } = await params;
    const routeId = parseId(id, 'Routen-ID');

    const result = await prisma.encounter.updateMany({
      where: { routeId },
      data: {
        isKnockedOut: false,
        koCausedBy: null,
        koReason: null,
        koDate: null,
      },
    });

    return success({
      message: `${result.count} Pokémon wurden reaktiviert`,
      count: result.count,
    });
  }, 'reactivating encounters');
}
