/**
 * Admin API: Routes CRUD
 * GET /api/admin/routes - Liste aller Routen
 * POST /api/admin/routes - Neue Route erstellen
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Alle Routen abrufen
export async function GET() {
  try {
    // Auth-Check
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

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
  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Routen' },
      { status: 500 }
    );
  }
}

// POST: Neue Route erstellen
export async function POST(request: NextRequest) {
  try {
    // Auth-Check
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await request.json();
    const { name, order } = body;

    // Validierung
    if (!name) {
      return NextResponse.json(
        { error: 'Name ist erforderlich' },
        { status: 400 }
      );
    }

    // Route erstellen
    const route = await prisma.route.create({
      data: {
        name,
        order: order || 0,
      },
    });

    return NextResponse.json(route, { status: 201 });
  } catch (error) {
    console.error('Error creating route:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Route' },
      { status: 500 }
    );
  }
}

