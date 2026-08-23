import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  isAdmin: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  emitEvent: vi.fn(),
  revisionUpsert: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ isAdmin: mocks.isAdmin }));
vi.mock('@/lib/prisma', () => ({
  default: {
    run: {
      findFirst: mocks.findFirst,
      update: mocks.update,
    },
    $transaction: mocks.transaction,
  },
}));
vi.mock('@/lib/event-store', () => ({ emitEvent: mocks.emitEvent }));

import { POST } from '@/app/api/runs/badges/route';

function request(body: unknown) {
  return new NextRequest('http://localhost/api/runs/badges', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isAdmin.mockResolvedValue(true);
  mocks.findFirst.mockResolvedValue({
    id: 11,
    status: 'active',
    archived: false,
    startedAt: new Date('2026-08-15T12:00:00Z'),
    badgesEarned: 8,
    gameVersionKey: 'black2',
  });
  mocks.update.mockResolvedValue({ id: 11, badgesEarned: 7 });
  mocks.transaction.mockImplementation(async (callback) => callback({
    run: { update: mocks.update },
    liveRevision: { upsert: mocks.revisionUpsert },
  }));
});

describe('POST /api/runs/badges', () => {
  it('blocks unauthenticated badge changes', async () => {
    mocks.isAdmin.mockResolvedValue(false);

    const response = await POST(request({ action: 'set', badgesEarned: 7, runId: 11 }));

    expect(response.status).toBe(401);
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('sets an explicit badge count on the requested active run', async () => {
    const response = await POST(request({ action: 'set', badgesEarned: 7, runId: 11 }));

    expect(response.status).toBe(200);
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: { status: 'active', archived: false, id: 11 },
      orderBy: { startedAt: 'desc' },
    });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 11 },
      data: { badgesEarned: 7 },
    });
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: { badgesEarned: 7 },
    });
    expect(mocks.emitEvent).not.toHaveBeenCalled();
    expect(mocks.revisionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { topic: 'runs' } }),
    );
  });

  it('can select a later badge and emits the newly reached badge', async () => {
    mocks.findFirst.mockResolvedValue({
      id: 11,
      status: 'active',
      archived: false,
      startedAt: new Date('2026-08-15T12:00:00Z'),
      badgesEarned: 3,
      gameVersionKey: 'black2',
    });

    const response = await POST(request({ action: 'set', badgesEarned: 5, runId: 11 }));

    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 11 },
      data: { badgesEarned: 5 },
    });
    expect(mocks.emitEvent).toHaveBeenCalledWith('badge_unlocked', {
      badgeNumber: 5,
      badgeName: 'Seismo-Orden',
      badgeImagePath: '/icons/badges/quake.png',
    });
  });

  it('rejects counts outside the game badge range', async () => {
    const response = await POST(request({ action: 'set', badgesEarned: 9, runId: 11 }));

    expect(response.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('keeps the legacy increment and decrement contract working', async () => {
    mocks.findFirst.mockResolvedValueOnce({
      id: 11,
      status: 'active',
      archived: false,
      startedAt: new Date('2026-08-15T12:00:00Z'),
      badgesEarned: 4,
      gameVersionKey: 'black2',
    });

    const response = await POST(request({ action: 'decrement' }));

    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 11 },
      data: { badgesEarned: 3 },
    });
  });
});
