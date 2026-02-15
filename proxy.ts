/**
 * Next.js 16 Proxy (vormals Middleware) für Route Protection
 *
 * HINWEIS: Auth-Prüfung wird in app/admin/layout.tsx durchgeführt,
 * da iron-session in der Proxy/Middleware mit Next.js Probleme verursacht.
 * Dieser Proxy dient nur als Platzhalter für zukünftige Features.
 */

import { NextResponse } from 'next/server';

export async function proxy() {
  // Keine Proxy-basierte Auth mehr (vormals Middleware)
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

