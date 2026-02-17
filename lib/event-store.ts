/**
 * In-Memory Event Store für Game Events
 * Events werden server-seitig gespeichert und via Polling abgefragt.
 * Auto-Cleanup nach 30 Sekunden.
 */

export type EventType =
  | 'badge_unlocked'
  | 'pokemon_not_caught'
  | 'pokemon_ko'
  | 'run_failed';

export interface GameEvent {
  id: string;
  type: EventType;
  timestamp: number;
  data: {
    pokemonName?: string;
    pokemonNameGerman?: string;
    badgeNumber?: number;
    badgeName?: string;
    badgeImagePath?: string;
    playerName?: string;
    routeName?: string;
    runNumber?: number;
  };
}

const events: GameEvent[] = [];
const MAX_AGE_MS = 30_000;
const MAX_EVENTS = 100;

function cleanup() {
  const cutoff = Date.now() - MAX_AGE_MS;
  while (events.length > 0 && events[0].timestamp < cutoff) {
    events.shift();
  }
}

export function emitEvent(type: EventType, data: GameEvent['data']): void {
  cleanup();

  const event: GameEvent = {
    id: crypto.randomUUID(),
    type,
    timestamp: Date.now(),
    data,
  };

  events.push(event);

  // Begrenze die Gesamtgröße
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }
}

export function getEventsSince(since: number): GameEvent[] {
  cleanup();
  return events.filter(e => e.timestamp > since);
}
