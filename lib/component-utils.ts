/**
 * Gemeinsame Utility-Funktionen für React-Komponenten
 */

/**
 * Extrahiert eine Fehlermeldung aus einem Error-Objekt
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unbekannter Fehler';
}

/**
 * Formatierte Fehlermeldung für Alerts
 */
export function formatErrorForAlert(error: unknown, context?: string): string {
  const message = getErrorMessage(error);
  return context ? `${context}: ${message}` : message;
}

