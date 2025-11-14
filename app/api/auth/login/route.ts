/**
 * POST /api/auth/login
 * Admin-Login Endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAdminCredentials, loginAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validierung
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username und Password sind erforderlich' },
        { status: 400 }
      );
    }

    // Credentials prüfen
    if (!validateAdminCredentials(username, password)) {
      return NextResponse.json(
        { error: 'Ungültige Zugangsdaten' },
        { status: 401 }
      );
    }

    // Session setzen
    await loginAdmin(username);

    return NextResponse.json(
      { success: true, message: 'Login erfolgreich' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

