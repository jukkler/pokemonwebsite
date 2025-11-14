/**
 * Authentifizierungs-Helper-Funktionen
 */

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
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
  
  return username === adminUsername && password === adminPassword;
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

