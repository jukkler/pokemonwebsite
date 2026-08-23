'use client';

/**
 * Globaler Provider für Animationen und datengetriebene Live-Aktualisierungen.
 * Ein einzelner, kleiner Poller versorgt die jeweils sichtbare Seite.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { GameEvent } from '@/lib/event-store';
import {
  LIVE_UPDATE_TOPICS,
  type LiveRevisions,
  type LiveUpdateTopic,
} from '@/lib/live-updates';
import {
  getChangedLiveTopics,
  hasRelevantLiveTopic,
  parseLiveRevisions,
} from '@/lib/hooks/live-revisions';

export type LiveRefreshCallback = (
  changedTopics: ReadonlySet<LiveUpdateTopic>,
) => void;

interface LiveRefreshSubscription {
  topics: ReadonlySet<LiveUpdateTopic>;
  callback: LiveRefreshCallback;
}

interface EventContextType {
  currentEvent: GameEvent | null;
  dismissEvent: () => void;
}

interface LiveRefreshContextType {
  subscribeLiveRefresh: (
    topics: readonly LiveUpdateTopic[],
    callback: LiveRefreshCallback,
  ) => () => void;
}

interface EventsLatestResponse {
  events?: unknown;
  serverTime?: unknown;
  revisions?: unknown;
}

export const EventContext = createContext<EventContextType | undefined>(undefined);
export const LiveRefreshContext = createContext<LiveRefreshContextType | undefined>(undefined);

const POLL_INTERVAL_MS = 3_000;
const INITIAL_ERROR_BACKOFF_MS = 5_000;
const MAX_ERROR_BACKOFF_MS = 30_000;

function isGameEvent(value: unknown): value is GameEvent {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<GameEvent>;
  return typeof candidate.id === 'string'
    && typeof candidate.type === 'string'
    && typeof candidate.timestamp === 'number'
    && Boolean(candidate.data)
    && typeof candidate.data === 'object';
}

export function EventProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<GameEvent[]>([]);
  const seenIds = useRef(new Set<string>());
  const subscriptions = useRef(new Set<LiveRefreshSubscription>());
  const revisionBaselineReady = useRef(false);
  const currentEvent = queue[0] ?? null;

  const subscribeLiveRefresh = useCallback((
    topics: readonly LiveUpdateTopic[],
    callback: LiveRefreshCallback,
  ) => {
    const subscription: LiveRefreshSubscription = {
      topics: new Set(topics),
      callback,
    };
    subscriptions.current.add(subscription);

    // Bei spät montierten Seiten (z. B. nach einer Suspense-Grenze) kann der
    // erste globale Poll schon abgeschlossen sein. Ihr einmaliger Catch-up
    // darf dadurch nicht verloren gehen.
    if (revisionBaselineReady.current) {
      queueMicrotask(() => {
        if (subscriptions.current.has(subscription)) {
          try {
            subscription.callback(new Set(topics));
          } catch (error) {
            console.error('Live refresh callback failed:', error);
          }
        }
      });
    }

    return () => {
      subscriptions.current.delete(subscription);
    };
  }, []);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let activeController: AbortController | null = null;
    let previousRevisions: LiveRevisions | null = null;
    let lastCheck = Date.now();
    let consecutiveErrors = 0;

    const clearTimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const notifySubscriptions = (changedTopics: ReadonlySet<LiveUpdateTopic>) => {
      for (const subscription of subscriptions.current) {
        if (!hasRelevantLiveTopic(subscription.topics, changedTopics)) continue;
        try {
          subscription.callback(changedTopics);
        } catch (error) {
          console.error('Live refresh callback failed:', error);
        }
      }
    };

    const poll = async () => {
      if (stopped || document.hidden || activeController) return;

      const controller = new AbortController();
      activeController = controller;

      try {
        const response = await fetch(`/api/events/latest?since=${lastCheck}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Live update request failed (${response.status})`);
        }

        const payload = await response.json() as EventsLatestResponse;
        const incomingEvents = Array.isArray(payload.events)
          ? payload.events.filter(isGameEvent)
          : [];
        const newEvents = incomingEvents.filter((event) => !seenIds.current.has(event.id));

        if (newEvents.length > 0) {
          for (const event of newEvents) seenIds.current.add(event.id);
          setQueue((previous) => [...previous, ...newEvents]);
        }

        if (typeof payload.serverTime === 'number' && Number.isFinite(payload.serverTime)) {
          lastCheck = payload.serverTime;
        }

        const nextRevisions = parseLiveRevisions(payload.revisions);
        if (nextRevisions) {
          // Der erste Abruf ist bewusst ein Catch-up: Eine Mutation kann zwischen
          // Server-Render und dem Aufbau dieser Baseline passiert sein.
          const changedTopics = previousRevisions
            ? getChangedLiveTopics(previousRevisions, nextRevisions)
            : new Set<LiveUpdateTopic>(LIVE_UPDATE_TOPICS);

          previousRevisions = nextRevisions;
          revisionBaselineReady.current = true;
          if (changedTopics.size > 0) notifySubscriptions(changedTopics);
        }

        consecutiveErrors = 0;
      } catch {
        if (controller.signal.aborted || stopped) return;
        consecutiveErrors += 1;
      } finally {
        if (activeController === controller) activeController = null;

        if (!stopped && !document.hidden) {
          const delay = consecutiveErrors === 0
            ? POLL_INTERVAL_MS
            : Math.min(
                MAX_ERROR_BACKOFF_MS,
                INITIAL_ERROR_BACKOFF_MS * (2 ** (consecutiveErrors - 1)),
              );
          clearTimer();
          timer = setTimeout(() => {
            void poll();
          }, delay);
        }
      }
    };

    const pollNow = () => {
      if (stopped || document.hidden) return;
      clearTimer();
      if (!activeController) void poll();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearTimer();
        activeController?.abort();
        return;
      }
      pollNow();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', pollNow);
    window.addEventListener('online', pollNow);
    pollNow();

    return () => {
      stopped = true;
      clearTimer();
      activeController?.abort();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', pollNow);
      window.removeEventListener('online', pollNow);
    };
  }, []);

  const dismissEvent = useCallback(() => {
    setQueue((previous) => previous.slice(1));
  }, []);

  const eventContextValue = useMemo<EventContextType>(() => ({
    currentEvent,
    dismissEvent,
  }), [currentEvent, dismissEvent]);
  const liveRefreshContextValue = useMemo<LiveRefreshContextType>(() => ({
    subscribeLiveRefresh,
  }), [subscribeLiveRefresh]);

  return (
    <LiveRefreshContext.Provider value={liveRefreshContextValue}>
      <EventContext.Provider value={eventContextValue}>
        {children}
      </EventContext.Provider>
    </LiveRefreshContext.Provider>
  );
}

export function useGameEvents(): Pick<EventContextType, 'currentEvent' | 'dismissEvent'> {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useGameEvents must be used within an EventProvider');
  }
  return context;
}
