import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const tx = {
    encounter: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    player: { findMany: vi.fn() },
    liveRevision: { upsert: vi.fn() },
  };
  return { isAdmin: vi.fn(), transaction: vi.fn(), tx };
});

vi.mock('@/lib/auth', () => ({ isAdmin: mocks.isAdmin }));
vi.mock('@/lib/prisma', () => ({ default: { $transaction: mocks.transaction } }));

import { POST } from '@/app/api/admin/encounters/route';

const date = new Date('2026-08-15T12:00:00.000Z');

function linkMember(playerId: number, overrides: Record<string, unknown> = {}) {
  return {
    id: 100 + playerId,
    routeId: 10,
    playerId,
    teamSlot: null,
    isKnockedOut: false,
    koCausedBy: null,
    koReason: null,
    koDate: null,
    isNotCaught: false,
    notCaughtBy: null,
    notCaughtReason: null,
    notCaughtDate: null,
    ...overrides,
  };
}

function request(playerId = 2) {
  return new NextRequest('http://localhost/api/admin/encounters', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, routeId: 10, pokemonId: 25, nickname: 'Neu' }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isAdmin.mockResolvedValue(true);
  mocks.transaction.mockImplementation(async (callback) => callback(mocks.tx));
  mocks.tx.encounter.findFirst.mockResolvedValue(null);
  mocks.tx.encounter.findMany.mockResolvedValue([]);
  mocks.tx.player.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
  mocks.tx.encounter.create.mockResolvedValue({ id: 200 });
});

describe('POST /api/admin/encounters link inheritance', () => {
  it('inherits the complete consistent status metadata of an existing link', async () => {
    mocks.tx.encounter.findMany.mockResolvedValue([
      linkMember(1, {
        isKnockedOut: true,
        koCausedBy: 'Lukas',
        koReason: 'Crit',
        koDate: date,
      }),
    ]);

    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(mocks.tx.encounter.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          routeId: 10,
          playerId: 2,
          teamSlot: null,
          isKnockedOut: true,
          koCausedBy: 'Lukas',
          koReason: 'Crit',
          koDate: date,
          isNotCaught: false,
        }),
      }),
    );
    expect(mocks.tx.liveRevision.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { topic: 'encounters' } }),
    );
  });

  it('blocks inheritance from an inconsistent legacy link', async () => {
    mocks.tx.encounter.findMany.mockResolvedValue([
      linkMember(1, { teamSlot: 1 }),
      linkMember(3, { teamSlot: 2 }),
    ]);

    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(mocks.tx.encounter.create).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('inkonsistent'),
    });
  });

  it('does not perpetuate an incomplete team link', async () => {
    mocks.tx.encounter.findMany.mockResolvedValue([linkMember(1, { teamSlot: 2 })]);
    mocks.tx.player.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);

    const response = await POST(request(2));
    expect(response.status).toBe(409);
    expect(mocks.tx.encounter.create).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('2 von 3'),
    });
  });

  it('allows the final missing active player and inherits the link slot', async () => {
    mocks.tx.encounter.findMany.mockResolvedValue([linkMember(1, { teamSlot: 2 })]);
    mocks.tx.player.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const response = await POST(request(2));
    expect(response.status).toBe(201);
    expect(mocks.tx.encounter.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ teamSlot: 2, playerId: 2, routeId: 10 }),
      }),
    );
  });
});
