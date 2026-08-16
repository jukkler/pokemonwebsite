/** Legacy adapter. New clients use PATCH /api/admin/encounter-links/[routeId]. */

import { NextRequest, NextResponse } from 'next/server';
import { badRequest, withAdminAuthAndErrorHandling } from '@/lib/api-utils';
import { parseEncounterLinkAdminAction } from '@/lib/encounter-link-admin';
import { executeEncounterLinkAdminAction } from '@/lib/encounter-link-admin.server';

function responseFor(result: Awaited<ReturnType<typeof executeEncounterLinkAdminAction>>) {
  return result.ok
    ? NextResponse.json(result.response)
    : NextResponse.json(
        { error: result.error, conflict: result.conflict },
        { status: result.status },
      );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAdminAuthAndErrorHandling(async () => {
    const routeId = Number((await params).id);
    if (!Number.isInteger(routeId) || routeId < 1) return badRequest('Ungültige Routen-ID');

    let body: unknown;
    try {
      const requestBody = await request.json() as Record<string, unknown>;
      body = {
        action: 'knockout',
        causedBy: requestBody.causedBy,
        reason: requestBody.reason,
      };
    } catch {
      return badRequest('Der Request-Body muss gültiges JSON enthalten');
    }
    const parsed = parseEncounterLinkAdminAction(body);
    if (!parsed.ok) return badRequest(parsed.error);
    return responseFor(await executeEncounterLinkAdminAction(routeId, parsed.action));
  }, 'knocking out encounter link');
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAdminAuthAndErrorHandling(async () => {
    const routeId = Number((await params).id);
    if (!Number.isInteger(routeId) || routeId < 1) return badRequest('Ungültige Routen-ID');
    return responseFor(
      await executeEncounterLinkAdminAction(routeId, { action: 'reactivate' }),
    );
  }, 'reactivating encounter link');
}
