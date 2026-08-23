/**
 * Public API: Game Events Polling
 * GET /api/events/latest?since=<timestamp> - Neue Events seit Timestamp
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEventsSince } from '@/lib/event-store';
import { getLiveRevisions } from '@/lib/live-updates.server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestedSince = Number(request.nextUrl.searchParams.get('since') || '0');
  const since = Number.isFinite(requestedSince) && requestedSince >= 0
    ? requestedSince
    : 0;

  // Der Cursor wird vor jedem await und vor dem Event-Snapshot erfasst.
  // Zusammen mit der inklusiven Event-Abfrage geht dadurch auch dann kein
  // Event verloren, wenn es in derselben Millisekunde emittiert wird.
  const serverTime = Date.now();
  const events = getEventsSince(since);
  const revisions = await getLiveRevisions();

  return NextResponse.json({
    events,
    serverTime,
    revisions,
  }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
