import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    liveRevision: {
      findMany: mocks.findMany,
    },
  },
}));

import {
  LIVE_UPDATE_TOPICS,
  ZERO_LIVE_REVISIONS,
} from '@/lib/live-updates';
import {
  bumpLiveRevisions,
  getLiveRevisions,
} from '@/lib/live-updates.server';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findMany.mockResolvedValue([]);
});

describe('live update revision storage', () => {
  it('keeps the public topic contract complete and stable', () => {
    expect(LIVE_UPDATE_TOPICS).toEqual([
      'encounters',
      'routes',
      'runs',
      'players',
      'streams',
      'pokemon',
    ]);
    expect(ZERO_LIVE_REVISIONS).toEqual({
      encounters: '0',
      routes: '0',
      runs: '0',
      players: '0',
      streams: '0',
      pokemon: '0',
    });
  });

  it('returns JSON-safe strings and fills missing database rows with zero', async () => {
    mocks.findMany.mockResolvedValue([
      { topic: 'encounters', revision: BigInt(42) },
      { topic: 'runs', revision: BigInt('9007199254740993') },
      { topic: 'legacy-topic', revision: BigInt(99) },
    ]);

    await expect(getLiveRevisions()).resolves.toEqual({
      encounters: '42',
      routes: '0',
      runs: '9007199254740993',
      players: '0',
      streams: '0',
      pokemon: '0',
    });
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { topic: { in: [...LIVE_UPDATE_TOPICS] } },
      select: { topic: true, revision: true },
    });
  });

  it('bumps every requested topic once and creates a missing row at revision one', async () => {
    const upsert = vi.fn().mockResolvedValue(undefined);
    const db = { liveRevision: { upsert } };

    await bumpLiveRevisions(
      db,
      ['encounters', 'routes', 'encounters'],
    );

    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert).toHaveBeenNthCalledWith(1, {
      where: { topic: 'encounters' },
      create: { topic: 'encounters', revision: BigInt(1) },
      update: { revision: { increment: BigInt(1) } },
    });
    expect(upsert).toHaveBeenNthCalledWith(2, {
      where: { topic: 'routes' },
      create: { topic: 'routes', revision: BigInt(1) },
      update: { revision: { increment: BigInt(1) } },
    });
  });

  it('does not access the database when no topic changed', async () => {
    const upsert = vi.fn();
    const db = { liveRevision: { upsert } };

    await bumpLiveRevisions(
      db,
      [],
    );

    expect(upsert).not.toHaveBeenCalled();
  });
});
