import { describe, expect, it } from 'vitest';
import {
  getChangedLiveTopics,
  hasRelevantLiveTopic,
  parseLiveRevisions,
} from '@/lib/hooks/live-revisions';
import {
  ZERO_LIVE_REVISIONS,
  type LiveRevisions,
  type LiveUpdateTopic,
} from '@/lib/live-updates';

function revisions(overrides: Partial<LiveRevisions> = {}): LiveRevisions {
  return { ...ZERO_LIVE_REVISIONS, ...overrides };
}

describe('live revision parsing', () => {
  it('accepts the complete API contract and preserves large string revisions', () => {
    const input = revisions({
      encounters: '9007199254740993',
      routes: '12',
      runs: '7',
    });

    expect(parseLiveRevisions(input)).toEqual(input);
  });

  it.each([
    null,
    [],
    'not-an-object',
    { ...ZERO_LIVE_REVISIONS, routes: 2 },
    {
      encounters: '1',
      routes: '2',
      runs: '3',
      players: '4',
      streams: '5',
    },
  ])('rejects malformed or incomplete revision payloads: %j', (input) => {
    expect(parseLiveRevisions(input)).toBeNull();
  });

  it('ignores unrelated response properties while extracting every known topic', () => {
    expect(
      parseLiveRevisions({ ...revisions({ pokemon: '8' }), futureField: 'ignored' }),
    ).toEqual(revisions({ pokemon: '8' }));
  });
});

describe('live revision change detection', () => {
  it('returns only topics whose string revision changed', () => {
    const changed = getChangedLiveTopics(
      revisions({ routes: '3', players: '5' }),
      revisions({ routes: '4', players: '5', runs: '1' }),
    );

    expect([...changed]).toEqual(['routes', 'runs']);
  });

  it('returns an empty set for an unchanged snapshot', () => {
    expect(getChangedLiveTopics(revisions(), revisions())).toEqual(new Set());
  });
});

describe('live update topic filtering', () => {
  it('matches when at least one changed topic is subscribed', () => {
    const subscribed = new Set<LiveUpdateTopic>(['encounters', 'routes']);
    const changed = new Set<LiveUpdateTopic>(['streams', 'encounters']);

    expect(hasRelevantLiveTopic(subscribed, changed)).toBe(true);
  });

  it('does not refresh for unrelated or empty topic sets', () => {
    const subscribed = new Set<LiveUpdateTopic>(['encounters', 'routes']);

    expect(
      hasRelevantLiveTopic(subscribed, new Set<LiveUpdateTopic>(['runs'])),
    ).toBe(false);
    expect(hasRelevantLiveTopic(subscribed, new Set())).toBe(false);
  });
});
