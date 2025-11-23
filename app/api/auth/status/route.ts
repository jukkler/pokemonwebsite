/**
 * GET /api/auth/status
 * Prüft den aktuellen Authentifizierungs-Status
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { withErrorHandling } from '@/lib/api-utils';

export async function GET() {
  return withErrorHandling(async () => {
    const session = await getSession();

    return NextResponse.json({
      isAdmin: session.isAdmin,
      username: session.username || null,
    });
  }, 'status check');
}

