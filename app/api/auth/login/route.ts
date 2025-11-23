/**
 * POST /api/auth/login
 * Admin-Login Endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAdminCredentials, loginAdmin } from '@/lib/auth';
import {
  withErrorHandling,
  validateRequired,
  badRequest,
  internalError,
  success,
} from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const { username, password } = body;

    // Validierung
    try {
      validateRequired(body, ['username', 'password']);
    } catch (error) {
      return badRequest(
        error instanceof Error
          ? error.message
          : 'Username und Password sind erforderlich'
      );
    }

    // Credentials prüfen
    if (!validateAdminCredentials(String(username), String(password))) {
      return NextResponse.json({ error: 'Ungültige Zugangsdaten' }, { status: 401 });
    }

    // Session setzen
    await loginAdmin(String(username));

    return success({ message: 'Login erfolgreich' });
  }, 'login');
}

