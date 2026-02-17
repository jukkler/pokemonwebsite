'use client';

/**
 * Event Context - Globaler Event-Provider für Game-Overlay-Animationen
 * Pollt /api/events/latest alle 2 Sekunden und verwaltet eine Event-Queue.
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import type { GameEvent } from '@/lib/event-store';

interface EventContextType {
  currentEvent: GameEvent | null;
  dismissEvent: () => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

const POLL_INTERVAL_MS = 2000;

export function EventProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<GameEvent[]>([]);
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const seenIds = useRef(new Set<string>());
  const lastCheck = useRef(Date.now());

  // Polling
  useEffect(() => {
    const poll = async () => {
      if (document.hidden) return;

      try {
        const res = await fetch(`/api/events/latest?since=${lastCheck.current}`);
        if (!res.ok) return;

        const data = await res.json();
        const newEvents: GameEvent[] = (data.events || []).filter(
          (e: GameEvent) => !seenIds.current.has(e.id)
        );

        if (newEvents.length > 0) {
          for (const e of newEvents) {
            seenIds.current.add(e.id);
          }
          setQueue(prev => [...prev, ...newEvents]);
        }

        if (data.serverTime) {
          lastCheck.current = data.serverTime;
        }
      } catch {
        // Netzwerkfehler ignorieren
      }
    };

    // Sofort starten
    poll();

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Queue abarbeiten: Nächstes Event anzeigen wenn kein aktuelles
  useEffect(() => {
    if (currentEvent || queue.length === 0) return;
    const [next, ...rest] = queue;
    setCurrentEvent(next);
    setQueue(rest);
  }, [currentEvent, queue]);

  const dismissEvent = useCallback(() => {
    setCurrentEvent(null);
  }, []);

  return (
    <EventContext.Provider value={{ currentEvent, dismissEvent }}>
      {children}
    </EventContext.Provider>
  );
}

export function useGameEvents(): EventContextType {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useGameEvents must be used within an EventProvider');
  }
  return context;
}
