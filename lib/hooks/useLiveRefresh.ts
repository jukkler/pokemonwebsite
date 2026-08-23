'use client';

import { useContext, useEffect, useRef } from 'react';
import {
  LiveRefreshContext,
  type LiveRefreshCallback,
} from '@/lib/contexts/EventContext';
import type { LiveUpdateTopic } from '@/lib/live-updates';

export function useLiveRefresh(
  topics: readonly LiveUpdateTopic[],
  callback: LiveRefreshCallback,
): void {
  const context = useContext(LiveRefreshContext);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const topicKey = [...new Set(topics)].sort().join(',');

  useEffect(() => {
    if (!context) {
      throw new Error('useLiveRefresh must be used within an EventProvider');
    }

    const subscribedTopics = topicKey
      .split(',')
      .filter((topic): topic is LiveUpdateTopic => topic.length > 0);

    return context.subscribeLiveRefresh(subscribedTopics, (changedTopics) => {
      callbackRef.current(changedTopics);
    });
  }, [context, topicKey]);
}
