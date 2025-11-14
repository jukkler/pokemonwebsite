/**
 * Next.js Middleware für Route Protection
 * 
 * HINWEIS: Auth-Prüfung wird in app/admin/layout.tsx durchgeführt,
 * da iron-session in der Middleware mit Next.js 15 Probleme verursacht.
 * Diese Middleware dient nur als Platzhalter für zukünftige Features.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Keine Middleware-basierte Auth mehr
  // Auth-Prüfung erfolgt in Server Components (app/admin/layout.tsx)
  return NextResponse.next();
}

// Matcher-Konfiguration
export const config = {
  matcher: [
    // Aktuell keine Routen, da Auth in Server Components erfolgt
    // '/admin/:path*',
  ],
};

