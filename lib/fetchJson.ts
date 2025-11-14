/**
 * Hilfsfunktion für Fetch-Requests mit sauberen Fehlermeldungen
 */
export async function fetchJson<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const message = await res
      .text()
      .catch(() => `Fehlerstatus ${res.status}`);
    throw new Error(
      `Request fehlgeschlagen (${res.status} ${res.statusText}): ${message}`
    );
  }
  return (await res.json()) as T;
}

