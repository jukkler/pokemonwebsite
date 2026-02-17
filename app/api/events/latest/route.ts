/**
 * Public API: Game Events Polling
 * GET /api/events/latest?since=<timestamp> - Neue Events seit Timestamp
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEventsSince } from '@/lib/event-store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const since = Number(request.nextUrl.searchParams.get('since') || '0');

  const events = getEventsSince(since);

  return NextResponse.json({
    events,
    serverTime: Date.now(),
  }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
