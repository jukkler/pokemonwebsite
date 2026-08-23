import {
  LIVE_UPDATE_TOPICS,
  type LiveRevisions,
  type LiveUpdateTopic,
} from '@/lib/live-updates';

export function parseLiveRevisions(input: unknown): LiveRevisions | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;

  const candidate = input as Record<string, unknown>;
  const revisions = {} as LiveRevisions;

  for (const topic of LIVE_UPDATE_TOPICS) {
    const revision = candidate[topic];
    if (typeof revision !== 'string') return null;
    revisions[topic] = revision;
  }

  return revisions;
}

export function getChangedLiveTopics(
  previous: LiveRevisions,
  next: LiveRevisions,
): Set<LiveUpdateTopic> {
  const changed = new Set<LiveUpdateTopic>();

  for (const topic of LIVE_UPDATE_TOPICS) {
    if (previous[topic] !== next[topic]) changed.add(topic);
  }

  return changed;
}

export function hasRelevantLiveTopic(
  subscribedTopics: ReadonlySet<LiveUpdateTopic>,
  changedTopics: ReadonlySet<LiveUpdateTopic>,
): boolean {
  for (const topic of changedTopics) {
    if (subscribedTopics.has(topic)) return true;
  }

  return false;
}
