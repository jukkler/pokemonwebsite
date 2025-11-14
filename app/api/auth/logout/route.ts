/**
 * POST /api/auth/logout
 * Admin-Logout Endpoint
 */

import { NextResponse } from 'next/server';
import { logoutAdmin } from '@/lib/auth';

export async function POST() {
  try {
    await logoutAdmin();

    return NextResponse.json(
      { success: true, message: 'Logout erfolgreich' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

