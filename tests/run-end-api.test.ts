import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const transactionClient = {
    run: {
      updateMany: vi.fn(),
      findUnique: vi.fn(),
    },
    runPlayerStats: { createMany: vi.fn() },
    runEncounter: { createMany: vi.fn() },
    liveRevision: { upsert: vi.fn() },
  };

  return {
    isAdmin: vi.fn(),
    emitEvent: vi.fn(),
    transactionClient,
    transaction: vi.fn(),
    findRun: vi.fn(),
    findPlayers: vi.fn(),
    findEncounters: vi.fn(),
  };
});

vi.mock('@/lib/auth', () => ({ isAdmin: mocks.isAdmin }));
vi.mock('@/lib/event-store', () => ({ emitEvent: mocks.emitEvent }));
vi.mock('@/lib/prisma', () => ({
  default: {
    run: { findUnique: mocks.findRun },
    player: { findMany: mocks.findPlayers },
    encounter: { findMany: mocks.findEncounters },
    $transaction: mocks.transaction,
  },
}));

import { POST } from '@/app/api/admin/runs/[id]/end/route';

const routeContext = { params: Promise.resolve({ id: '7' }) };

function request(body: unknown) {
  return new NextRequest('http://localhost/api/admin/runs/7/end', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isAdmin.mockResolvedValue(true);
  mocks.findRun.mockResolvedValue({
    id: 7,
    runNumber: 4,
    status: 'active',
  });
  mocks.findPlayers.mockResolvedValue([]);
  mocks.findEncounters.mockResolvedValue([]);
  mocks.transactionClient.run.updateMany.mockResolvedValue({ count: 1 });
  mocks.transactionClient.run.findUnique.mockResolvedValue({
    id: 7,
    runNumber: 4,
    status: 'completed',
    loserPlayerName: null,
  });
  mocks.transaction.mockImplementation(async (callback) =>
    callback(mocks.transactionClient),
  );
});

describe('POST /api/admin/runs/[id]/end', () => {
  it('stores a victory without requiring a loser', async () => {
    const response = await POST(
      request({ status: 'completed' }),
      routeContext,
    );

    expect(response.status).toBe(200);
    expect(mocks.transactionClient.run.updateMany).toHaveBeenCalledWith({
      where: { id: 7, status: 'active' },
      data: {
        status: 'completed',
        loserPlayerName: null,
        endedAt: expect.any(Date),
      },
    });
    expect(mocks.emitEvent).toHaveBeenCalledWith('run_completed', {
      runNumber: 4,
    });
    expect(mocks.transactionClient.liveRevision.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { topic: 'runs' } }),
    );
  });

  it('still requires a loser for a defeat', async () => {
    const response = await POST(request({ status: 'failed' }), routeContext);

    expect(response.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('rejects a competing second completion before snapshots are written', async () => {
    mocks.transactionClient.run.updateMany.mockResolvedValue({ count: 0 });

    const response = await POST(
      request({ status: 'completed' }),
      routeContext,
    );

    expect(response.status).toBe(409);
    expect(mocks.transactionClient.runPlayerStats.createMany).not.toHaveBeenCalled();
    expect(mocks.transactionClient.runEncounter.createMany).not.toHaveBeenCalled();
    expect(mocks.emitEvent).not.toHaveBeenCalled();
  });
});
