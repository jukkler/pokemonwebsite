/**
 * Admin API: Einzelne Route
 * PUT /api/admin/routes/[id] - Route aktualisieren
 * DELETE /api/admin/routes/[id] - Route löschen
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withAdminAuthAndErrorHandling,
  parseId,
  validateRequired,
  badRequest,
  success,
} from '@/lib/api-utils';
import prisma from '@/lib/prisma';

// PUT: Route aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuthAndErrorHandling(async () => {
    const { id } = await params;
    let routeId: number;

    try {
      routeId = parseId(id, 'Routen-ID');
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : 'Ungültige ID');
    }

    const body = await request.json();
    const { name, order } = body;

    try {
      validateRequired(body, ['name']);
    } catch (error) {
      return badRequest(
        error instanceof Error ? error.message : 'Name ist erforderlich'
      );
    }

    try {
      // Route aktualisieren
      const route = await prisma.route.update({
        where: { id: routeId },
        data: {
          name: String(name).trim(),
          order: typeof order === 'number' ? order : undefined,
        },
      });

      return NextResponse.json(route);
    } catch (error) {
      // Spezifische Fehlerbehandlung
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2025') {
        return NextResponse.json({ error: 'Route nicht gefunden' }, { status: 404 });
      }
      throw error;
    }
  }, 'updating route');
}

// DELETE: Route löschen
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
      return badRequest(error instanceof Error ? error.message : 'Ungültige ID');
    }

    try {
      // Route löschen (Cascade löscht auch Encounters)
      await prisma.route.delete({
        where: { id: routeId },
      });

      return success();
    } catch (error) {
      // Spezifische Fehlerbehandlung
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2025') {
        return NextResponse.json({ error: 'Route nicht gefunden' }, { status: 404 });
      }
      throw error;
    }
  }, 'deleting route');
}

