import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const transactionClient = {
    run: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    runEncounter: { deleteMany: vi.fn() },
    runPlayerStats: { deleteMany: vi.fn() },
    liveRevision: { upsert: vi.fn() },
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

import { POST } from '@/app/api/admin/runs/[id]/reopen/route';

const routeContext = { params: Promise.resolve({ id: '12' }) };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isAdmin.mockResolvedValue(true);
  mocks.transaction.mockImplementation(async (callback) =>
    callback(mocks.transactionClient),
  );
  mocks.transactionClient.run.findUnique.mockResolvedValue({
    id: 12,
    runNumber: 4,
    status: 'completed',
  });
  mocks.transactionClient.run.findFirst
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce({ id: 12 });
  mocks.transactionClient.run.update.mockResolvedValue({
    id: 12,
    runNumber: 4,
    status: 'active',
  });
});

describe('POST /api/admin/runs/[id]/reopen', () => {
  it('reopens only the latest finished run and removes its snapshots', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/admin/runs/12/reopen', {
        method: 'POST',
      }),
      routeContext,
    );

    expect(response.status).toBe(200);
    expect(mocks.transactionClient.runEncounter.deleteMany).toHaveBeenCalledWith({
      where: { runId: 12 },
    });
    expect(mocks.transactionClient.runPlayerStats.deleteMany).toHaveBeenCalledWith({
      where: { runId: 12 },
    });
    expect(mocks.transactionClient.run.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 12 },
        data: {
          status: 'active',
          loserPlayerName: null,
          endedAt: null,
        },
      }),
    );
    expect(mocks.transactionClient.liveRevision.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { topic: 'runs' } }),
    );
  });

  it('keeps history intact when the selected run is not the latest', async () => {
    mocks.transactionClient.run.findFirst.mockReset();
    mocks.transactionClient.run.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 13 });

    const response = await POST(
      new NextRequest('http://localhost/api/admin/runs/12/reopen', {
        method: 'POST',
      }),
      routeContext,
    );

    expect(response.status).toBe(409);
    expect(mocks.transactionClient.runEncounter.deleteMany).not.toHaveBeenCalled();
    expect(mocks.transactionClient.runPlayerStats.deleteMany).not.toHaveBeenCalled();
  });
});
