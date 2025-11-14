/**
 * GET /api/auth/status
 * Prüft den aktuellen Authentifizierungs-Status
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();

    return NextResponse.json({
      isAdmin: session.isAdmin,
      username: session.username || null,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

