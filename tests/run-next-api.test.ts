import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const transactionClient = {
    run: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    encounter: { deleteMany: vi.fn() },
  };

  return {
    isAdmin: vi.fn(),
    transactionClient,
    transaction: vi.fn(),
  };
});

vi.mock('@/lib/auth', () => ({ isAdmin: mocks.isAdmin }));
vi.mock('@/lib/prisma', () => ({
  default: { $transaction: mocks.transaction },
}));

import { POST } from '@/app/api/admin/runs/next/route';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isAdmin.mockResolvedValue(true);
  mocks.transaction.mockImplementation(async (callback) =>
    callback(mocks.transactionClient),
  );
  mocks.transactionClient.run.findFirst
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce({
      id: 12,
      runNumber: 4,
      status: 'completed',
      gameVersionKey: 'emerald',
    })
    .mockResolvedValueOnce({ runNumber: 4 });
  mocks.transactionClient.run.create.mockResolvedValue({
    id: 13,
    runNumber: 5,
    status: 'active',
    gameVersionKey: 'emerald',
    gameVersion: { key: 'emerald', name: 'Smaragd', generation: 3 },
  });
});

describe('POST /api/admin/runs/next', () => {
  it('preserves the game setup while clearing live encounters', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/admin/runs/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameVersionKey: null }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.transactionClient.encounter.deleteMany).toHaveBeenCalledWith({});
    expect(mocks.transactionClient.run.create).toHaveBeenCalledWith({
      data: {
        runNumber: 5,
        gameVersionKey: 'emerald',
        status: 'active',
      },
      include: { gameVersion: true },
    });
  });

  it('does not clear encounters when another active run exists', async () => {
    mocks.transactionClient.run.findFirst.mockReset();
    mocks.transactionClient.run.findFirst.mockResolvedValue({ id: 99 });

    const response = await POST(
      new NextRequest('http://localhost/api/admin/runs/next', {
        method: 'POST',
        body: '{}',
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.transactionClient.encounter.deleteMany).not.toHaveBeenCalled();
  });
});
