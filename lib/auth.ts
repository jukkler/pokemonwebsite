/**
 * Authentifizierungs-Helper-Funktionen
 */

import crypto from 'crypto';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions, defaultSession } from './session';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

/**
 * Holt die aktuelle Session aus den Cookies
 */
export async function getSession(): Promise<SessionData> {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore as unknown as ReadonlyRequestCookies,
      sessionOptions
    );
    
    // Wenn Session leer ist, default-Werte setzen
    if (!session.isAdmin) {
      session.isAdmin = defaultSession.isAdmin;
    }
    
    return {
      isAdmin: session.isAdmin || false,
      username: session.username,
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return defaultSession;
  }
}

/**
 * Prüft Admin-Credentials
 */
export function validateAdminCredentials(username: string, password: string): boolean {
  const adminUsername = process.env.ADMIN_USERNAME?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Fail closed: niemals auf unsichere Defaults zurückfallen
  if (!adminUsername || !adminPassword) {
    console.error('ADMIN_USERNAME und ADMIN_PASSWORD müssen gesetzt sein');
    return false;
  }

  // Timing-safe Vergleich gegen Timing-Attacks
  const usernameBuffer = Buffer.from(username);
  const adminUsernameBuffer = Buffer.from(adminUsername);
  const passwordBuffer = Buffer.from(password);
  const adminPasswordBuffer = Buffer.from(adminPassword);

  const usernameMatch =
    usernameBuffer.length === adminUsernameBuffer.length &&
    crypto.timingSafeEqual(usernameBuffer, adminUsernameBuffer);
  const passwordMatch =
    passwordBuffer.length === adminPasswordBuffer.length &&
    crypto.timingSafeEqual(passwordBuffer, adminPasswordBuffer);

  return usernameMatch && passwordMatch;
}

/**
 * Prüft, ob der aktuelle User ein Admin ist
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session.isAdmin === true;
}

/**
 * Setzt die Session auf Admin
 */
export async function loginAdmin(username: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore as unknown as ReadonlyRequestCookies,
      sessionOptions
    );
    session.isAdmin = true;
    session.username = username;
    await session.save();
  } catch (error) {
    console.error('Error setting session:', error);
    throw error;
  }
}

/**
 * Löscht die Session (Logout)
 */
export async function logoutAdmin(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore as unknown as ReadonlyRequestCookies,
      sessionOptions
    );
    session.destroy();
  } catch (error) {
    console.error('Error destroying session:', error);
    throw error;
  }
}

