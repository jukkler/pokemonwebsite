/** Legacy adapter. New clients use PATCH /api/admin/encounter-links/[routeId]. */

import { NextRequest, NextResponse } from 'next/server';
import { badRequest, withAdminAuthAndErrorHandling } from '@/lib/api-utils';
import { parseEncounterLinkAdminAction } from '@/lib/encounter-link-admin';
import { executeEncounterLinkAdminAction } from '@/lib/encounter-link-admin.server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAdminAuthAndErrorHandling(async () => {
    const routeId = Number((await params).id);
    if (!Number.isInteger(routeId) || routeId < 1) return badRequest('Ungültige Routen-ID');

    let body: unknown;
    try {
      const requestBody = await request.json() as { teamSlot?: unknown };
      body = { action: 'set-team-slot', teamSlot: requestBody.teamSlot };
    } catch {
      return badRequest('Der Request-Body muss gültiges JSON enthalten');
    }
    const parsed = parseEncounterLinkAdminAction(body);
    if (!parsed.ok) return badRequest(parsed.error);

    const result = await executeEncounterLinkAdminAction(routeId, parsed.action);
    return result.ok
      ? NextResponse.json(result.response)
      : NextResponse.json(
          { error: result.error, conflict: result.conflict },
          { status: result.status },
        );
  }, 'setting encounter-link team slot');
}
