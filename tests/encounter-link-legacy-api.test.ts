import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  isAdmin: vi.fn(),
  execute: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ isAdmin: mocks.isAdmin }));
vi.mock('@/lib/encounter-link-admin.server', () => ({
  executeEncounterLinkAdminAction: mocks.execute,
}));

import { POST as SET_TEAM_SLOT } from '@/app/api/admin/routes/[id]/set-team-slot/route';
import {
  DELETE as REACTIVATE_KNOCKOUT,
  POST as SET_KNOCKOUT,
} from '@/app/api/admin/routes/[id]/knockout/route';
import { POST as SET_NOT_CAUGHT } from '@/app/api/admin/routes/[id]/notcaught/route';

const context = { params: Promise.resolve({ id: '12' }) };

function request(path: string, method: 'POST' | 'DELETE', body?: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isAdmin.mockResolvedValue(true);
  mocks.execute.mockResolvedValue({
    ok: true,
    response: {
      success: true,
      routeId: 12,
      action: 'reactivate',
      count: 3,
      encounters: [],
    },
  });
});

describe('legacy route-link adapters', () => {
  it('delegates team-slot changes to the atomic link service', async () => {
    const response = await SET_TEAM_SLOT(
      request('/api/admin/routes/12/set-team-slot', 'POST', { teamSlot: 4 }),
      context,
    );

    expect(response.status).toBe(200);
    expect(mocks.execute).toHaveBeenCalledWith(12, {
      action: 'set-team-slot',
      teamSlot: 4,
    });
  });

  it('normalizes and delegates knockout and not-caught payloads', async () => {
    await SET_KNOCKOUT(
      request('/api/admin/routes/12/knockout', 'POST', {
        causedBy: ' Lukas ',
        reason: '',
      }),
      context,
    );
    expect(mocks.execute).toHaveBeenLastCalledWith(12, {
      action: 'knockout',
      causedBy: 'Lukas',
      reason: null,
    });

    await SET_NOT_CAUGHT(
      request('/api/admin/routes/12/notcaught', 'POST', {
        causedBy: ' Misty ',
        reason: ' Flucht ',
      }),
      context,
    );
    expect(mocks.execute).toHaveBeenLastCalledWith(12, {
      action: 'not-caught',
      causedBy: 'Misty',
      reason: 'Flucht',
    });
  });

  it('delegates legacy reactivation without retaining a one-status side path', async () => {
    const response = await REACTIVATE_KNOCKOUT(
      request('/api/admin/routes/12/knockout', 'DELETE'),
      context,
    );

    expect(response.status).toBe(200);
    expect(mocks.execute).toHaveBeenCalledWith(12, { action: 'reactivate' });
  });
});
