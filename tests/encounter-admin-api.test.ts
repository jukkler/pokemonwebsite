import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  isAdmin: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  revisionUpsert: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ isAdmin: mocks.isAdmin }));
vi.mock('@/lib/prisma', () => ({
  default: {
    encounter: { update: mocks.update, delete: mocks.delete },
    $transaction: mocks.transaction,
  },
}));

import { DELETE, PATCH } from '@/app/api/admin/encounters/[id]/route';

const context = { params: Promise.resolve({ id: '42' }) };
const encounter = {
  id: 42,
  playerId: 7,
  routeId: 11,
  pokemonId: 25,
  nickname: 'Sparky',
  teamSlot: null,
  isKnockedOut: false,
  koCausedBy: null,
  koReason: null,
  koDate: null,
  isNotCaught: false,
  notCaughtBy: null,
  notCaughtReason: null,
  notCaughtDate: null,
  createdAt: new Date('2026-08-01T12:00:00.000Z'),
  player: { id: 7, name: 'Lukas', color: '#2563eb' },
  route: { id: 11, name: 'Route 1' },
  pokemon: {
    id: 25,
    pokedexId: 25,
    name: 'pikachu',
    nameGerman: 'Pikachu',
    spriteUrl: null,
    spriteGifUrl: null,
  },
};

function request(body: unknown) {
  return new NextRequest('http://localhost/api/admin/encounters/42', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isAdmin.mockResolvedValue(true);
  mocks.update.mockResolvedValue(encounter);
  mocks.delete.mockResolvedValue(encounter);
  mocks.transaction.mockImplementation(async (callback) => callback({
    encounter: { update: mocks.update, delete: mocks.delete },
    liveRevision: { upsert: mocks.revisionUpsert },
  }));
});

describe('PATCH /api/admin/encounters/[id]', () => {
  it('updates an individual nickname', async () => {
    const response = await PATCH(
      request({ action: 'update-nickname', nickname: ' Sparky ' }),
      context,
    );
    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 42 }, data: { nickname: 'Sparky' } }),
    );
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      encounter: { id: 42, nickname: 'Sparky' },
    });
    expect(mocks.revisionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { topic: 'encounters' } }),
    );
  });

  it('rejects route-link actions without touching Prisma', async () => {
    const response = await PATCH(
      request({ action: 'knockout', causedBy: 'Lukas', reason: null }),
      context,
    );
    expect(response.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('requires an admin session', async () => {
    mocks.isAdmin.mockResolvedValue(false);
    const response = await PATCH(request({ action: 'swap-pokemon', pokemonId: 1 }), context);
    expect(response.status).toBe(401);
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/admin/encounters/[id] repair API', () => {
  it('can still delete exactly one corrupt encounter', async () => {
    const response = await DELETE(
      new NextRequest('http://localhost/api/admin/encounters/42', { method: 'DELETE' }),
      context,
    );
    expect(response.status).toBe(200);
    expect(mocks.delete).toHaveBeenCalledWith({ where: { id: 42 } });
    expect(mocks.revisionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { topic: 'encounters' } }),
    );
  });
});
