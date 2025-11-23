/**
 * Admin API: Routes CRUD
 * GET /api/admin/routes - Liste aller Routen
 * POST /api/admin/routes - Neue Route erstellen
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withAdminAuthAndErrorHandling,
  validateRequired,
  badRequest,
  created,
} from '@/lib/api-utils';
import prisma from '@/lib/prisma';

// GET: Alle Routen abrufen
export async function GET() {
  return withAdminAuthAndErrorHandling(async () => {
    const routes = await prisma.route.findMany({
      include: {
        _count: {
          select: {
            encounters: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(routes);
  }, 'fetching routes');
}

// POST: Neue Route erstellen
export async function POST(request: NextRequest) {
  return withAdminAuthAndErrorHandling(async () => {
    const body = await request.json();
    const { name, order } = body;

    // Validierung
    try {
      validateRequired(body, ['name']);
    } catch (error) {
      return badRequest(
        error instanceof Error ? error.message : 'Name ist erforderlich'
      );
    }

    // Route erstellen
    const route = await prisma.route.create({
      data: {
        name: String(name).trim(),
        order: typeof order === 'number' ? order : 0,
      },
    });

    return created(route);
  }, 'creating route');
}

