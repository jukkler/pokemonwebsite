/**
 * Admin API: Setze Team-Slot für eine Route
 * POST /api/admin/routes/[id]/set-team-slot
 * Alle Encounters dieser Route werden auf den angegebenen Slot gesetzt
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { withAdminAuth } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async () => {
    try {
    const { id } = await params;
    const routeId = parseInt(id, 10);

    if (Number.isNaN(routeId) || routeId < 1) {
      return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 });
    }

    const body = await request.json();
    const { teamSlot } = body;

    // Strikte Validierung: Slot muss number (1-6) oder null sein
    const parsedTeamSlot =
      teamSlot === null
        ? null
        : typeof teamSlot === 'number' && Number.isInteger(teamSlot)
          ? teamSlot
          : NaN;

    if (
      parsedTeamSlot !== null &&
      (Number.isNaN(parsedTeamSlot) || parsedTeamSlot < 1 || parsedTeamSlot > 6)
    ) {
      return NextResponse.json(
        { error: 'Team-Slot muss zwischen 1 und 6 liegen oder null sein' },
        { status: 400 }
      );
    }

    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await prisma.$transaction(
          async (tx) => {
            // Wenn Slot nicht null: Konfliktprüfung atomar in gleicher Transaktion
            if (parsedTeamSlot !== null) {
              const conflictingRoute = await tx.encounter.findFirst({
                where: {
                  teamSlot: parsedTeamSlot,
                  routeId: { not: routeId },
                },
                include: {
                  route: true,
                },
              });

              if (conflictingRoute) {
                return {
                  ok: false as const,
                  conflictName: conflictingRoute.route.name,
                };
              }
            }

            const updated = await tx.encounter.updateMany({
              where: { routeId },
              data: { teamSlot: parsedTeamSlot },
            });

            return {
              ok: true as const,
              count: updated.count,
            };
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
        );

        if (!result.ok) {
          return NextResponse.json(
            {
              error: `Slot ${parsedTeamSlot} ist bereits von Route "${result.conflictName}" belegt`,
            },
            { status: 409 }
          );
        }

        return NextResponse.json({
          success: true,
          count: result.count,
          teamSlot: parsedTeamSlot,
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034'
        ) {
          if (attempt === maxRetries) {
            return NextResponse.json(
              { error: 'Konflikt bei parallelem Update. Bitte erneut versuchen.' },
              { status: 409 }
            );
          }
          continue;
        }
        throw error;
      }
    }
    return NextResponse.json(
      { error: 'Konflikt bei parallelem Update. Bitte erneut versuchen.' },
      { status: 409 }
    );
    } catch (error) {
      console.error('Error setting team slot:', error);
      return NextResponse.json(
        { error: 'Fehler beim Setzen des Team-Slots' },
        { status: 500 }
      );
    }
  });
}

