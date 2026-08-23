import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getEventsSince: vi.fn(),
  getLiveRevisions: vi.fn(),
}));

vi.mock('@/lib/event-store', () => ({
  getEventsSince: mocks.getEventsSince,
}));
vi.mock('@/lib/live-updates.server', () => ({
  getLiveRevisions: mocks.getLiveRevisions,
}));

import { GET } from '@/app/api/events/latest/route';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getEventsSince.mockReturnValue([]);
  mocks.getLiveRevisions.mockResolvedValue({
    encounters: '0',
    routes: '0',
    runs: '0',
    players: '0',
    streams: '0',
    pokemon: '0',
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/events/latest live update contract', () => {
  it('returns events, server time and the complete revision snapshot without caching', async () => {
    const events = [{ id: 'event-1', type: 'pokemon_ko', timestamp: 120, data: {} }];
    const revisions = {
      encounters: '15',
      routes: '4',
      runs: '2',
      players: '3',
      streams: '1',
      pokemon: '1025',
    };
    mocks.getEventsSince.mockReturnValue(events);
    mocks.getLiveRevisions.mockResolvedValue(revisions);
    vi.spyOn(Date, 'now').mockReturnValue(456_789);

    const response = await GET(
      new NextRequest('http://localhost/api/events/latest?since=123'),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(mocks.getEventsSince).toHaveBeenCalledWith(123);
    expect(mocks.getLiveRevisions).toHaveBeenCalledOnce();
    await expect(response.json()).resolves.toEqual({
      events,
      serverTime: 456_789,
      revisions,
    });
  });

  it('uses zero as the event cursor when since is omitted', async () => {
    await GET(new NextRequest('http://localhost/api/events/latest'));

    expect(mocks.getEventsSince).toHaveBeenCalledWith(0);
  });

  it('captures the response cursor before reading events or awaiting revisions', async () => {
    const callOrder: string[] = [];
    const revisions = {
      encounters: '1', routes: '0', runs: '0', players: '0', streams: '0', pokemon: '0',
    };
    vi.spyOn(Date, 'now').mockImplementation(() => {
      callOrder.push('server-time');
      return 1_000;
    });
    mocks.getEventsSince.mockImplementation(() => {
      callOrder.push('events');
      return [];
    });
    mocks.getLiveRevisions.mockImplementation(async () => {
      callOrder.push('revisions');
      return revisions;
    });

    const response = await GET(
      new NextRequest('http://localhost/api/events/latest?since=999'),
    );

    expect(callOrder).toEqual(['server-time', 'events', 'revisions']);
    await expect(response.json()).resolves.toMatchObject({ serverTime: 1_000 });
  });

  it('normalizes invalid cursors instead of passing NaN to the event store', async () => {
    await GET(new NextRequest('http://localhost/api/events/latest?since=invalid'));

    expect(mocks.getEventsSince).toHaveBeenCalledWith(0);
  });
});
