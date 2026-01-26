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

    // Debug: Zeige ENV-Variablen Status (ohne sensible Daten)
    const envDebug = {
      adminUsernameSet: !!process.env.ADMIN_USERNAME,
      adminPasswordSet: !!process.env.ADMIN_PASSWORD,
      adminUsernameLength: process.env.ADMIN_USERNAME?.length || 0,
      adminPasswordLength: process.env.ADMIN_PASSWORD?.length || 0,
      inputUsernameLength: String(username).length,
      inputPasswordLength: String(password).length,
      usernameMatch: String(username) === (process.env.ADMIN_USERNAME || 'admin'),
      passwordMatch: String(password) === (process.env.ADMIN_PASSWORD || 'admin'),
    };
    console.log('[Login Debug]', JSON.stringify(envDebug));

    // Credentials prüfen
    if (!validateAdminCredentials(String(username), String(password))) {
      return NextResponse.json({ 
        error: 'Ungültige Zugangsdaten',
        debug: envDebug // Temporär für Debugging
      }, { status: 401 });
    }

    // Session setzen
    await loginAdmin(String(username));

    return success({ message: 'Login erfolgreich' });
  }, 'login');
}

