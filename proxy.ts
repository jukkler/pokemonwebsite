/**
 * Next.js 16 Proxy (vormals Middleware)
 * - Rate Limiting für Login-Endpoint
 * - Security Headers für alle Responses
 *
 * HINWEIS: Auth-Prüfung wird in app/admin/layout.tsx durchgeführt,
 * da iron-session in der Proxy mit Next.js Probleme verursacht.
 */

import { NextRequest, NextResponse } from 'next/server';

// In-Memory Rate-Limit Store (resets bei Server-Neustart)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 Minuten

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https://raw.githubusercontent.com data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  );
  return response;
}

export async function proxy(request: NextRequest) {
  // Rate Limiting für Login-Endpoint
  if (
    request.nextUrl.pathname === '/api/auth/login' &&
    request.method === 'POST'
  ) {
    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return addSecurityHeaders(
        NextResponse.json(
          { error: 'Zu viele Anmeldeversuche. Bitte warte 15 Minuten.' },
          { status: 429 }
        )
      );
    }
  }

  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|icons/).*)'],
};
