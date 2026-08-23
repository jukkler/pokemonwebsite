import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('live event cursor', () => {
  it('returns an event emitted in the exact cursor millisecond', async () => {
    vi.setSystemTime(new Date(1_000));
    const { emitEvent, getEventsSince } = await import('@/lib/event-store');

    emitEvent('pokemon_ko', { pokemonNameGerman: 'Azumarill' });

    expect(getEventsSince(1_000)).toHaveLength(1);
    expect(getEventsSince(1_000)[0]).toMatchObject({
      type: 'pokemon_ko',
      timestamp: 1_000,
      data: { pokemonNameGerman: 'Azumarill' },
    });
  });
});
