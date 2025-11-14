/**
 * iron-session Konfiguration und Typen
 */

import { SessionOptions } from 'iron-session';

// Session-Daten Interface
export interface SessionData {
  isAdmin: boolean;
  username?: string;
}

// Funktion zum Abrufen des SESSION_SECRET mit Fallback
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  
  if (!secret) {
    console.error('SESSION_SECRET ist nicht in .env gesetzt!');
    // Fallback für Development (NIEMALS in Production verwenden!)
    if (process.env.NODE_ENV === 'development') {
      return 'development-secret-key-min-32-chars-long-change-in-prod';
    }
    throw new Error('SESSION_SECRET muss in .env gesetzt sein');
  }
  
  if (secret.length < 32) {
    throw new Error('SESSION_SECRET muss mindestens 32 Zeichen lang sein');
  }
  
  return secret;
}

// Session-Konfiguration
export const sessionOptions: SessionOptions = {
  password: getSessionSecret(),
  cookieName: 'pokemon_playthrough_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 Tage
    path: '/',
  },
};

// Default Session-Werte
export const defaultSession: SessionData = {
  isAdmin: false,
};

