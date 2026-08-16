import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  isAdmin: vi.fn(),
  execute: vi.fn(),
  audit: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ isAdmin: mocks.isAdmin }));
vi.mock('@/lib/encounter-link-admin.server', () => ({
  executeEncounterLinkAdminAction: mocks.execute,
  getEncounterLinkAudit: mocks.audit,
}));

import { PATCH } from '@/app/api/admin/encounter-links/[routeId]/route';
import { GET as GET_AUDIT } from '@/app/api/admin/encounter-links/audit/route';

function request(body: unknown) {
  return new NextRequest('http://localhost/api/admin/encounter-links/10', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isAdmin.mockResolvedValue(true);
  mocks.execute.mockResolvedValue({
    ok: true,
    response: {
      success: true,
      routeId: 10,
      action: 'reactivate',
      count: 3,
      encounters: [],
    },
  });
  mocks.audit.mockResolvedValue({
    success: true,
    summary: { routeLinks: 1, consistent: 0, inconsistent: 1 },
    links: [],
  });
});

describe('PATCH /api/admin/encounter-links/[routeId]', () => {
  it('passes only routeId and the validated action to the service', async () => {
    const response = await PATCH(
      request({ action: 'knockout', causedBy: ' Lukas ', reason: '' }),
      { params: Promise.resolve({ routeId: '10' }) },
    );
    expect(response.status).toBe(200);
    expect(mocks.execute).toHaveBeenCalledWith(10, {
      action: 'knockout',
      causedBy: 'Lukas',
      reason: null,
    });
  });

  it('rejects individual and malformed actions', async () => {
    const individual = await PATCH(
      request({ action: 'swap-pokemon', pokemonId: 25 }),
      { params: Promise.resolve({ routeId: '10' }) },
    );
    expect(individual.status).toBe(400);
    expect(mocks.execute).not.toHaveBeenCalled();

    const invalidId = await PATCH(
      request({ action: 'reactivate' }),
      { params: Promise.resolve({ routeId: '-1' }) },
    );
    expect(invalidId.status).toBe(400);
  });

  it('maps link conflicts and protects the endpoint', async () => {
    mocks.execute.mockResolvedValue({
      ok: false,
      status: 409,
      error: 'Slot belegt',
      conflict: { routeId: 99, routeName: 'Route 99', teamSlot: 2 },
    });
    const conflict = await PATCH(
      request({ action: 'set-team-slot', teamSlot: 2 }),
      { params: Promise.resolve({ routeId: '10' }) },
    );
    expect(conflict.status).toBe(409);
    await expect(conflict.json()).resolves.toMatchObject({
      conflict: { routeId: 99, teamSlot: 2 },
    });

    mocks.isAdmin.mockResolvedValue(false);
    const unauthorized = await PATCH(
      request({ action: 'reactivate' }),
      { params: Promise.resolve({ routeId: '10' }) },
    );
    expect(unauthorized.status).toBe(401);
  });
});

describe('GET /api/admin/encounter-links/audit', () => {
  it('returns a read-only no-store report for admins', async () => {
    const response = await GET_AUDIT();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(mocks.audit).toHaveBeenCalledOnce();
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      summary: { inconsistent: 1 },
    });
  });

  it('does not expose the report without an admin session', async () => {
    mocks.isAdmin.mockResolvedValue(false);
    const response = await GET_AUDIT();
    expect(response.status).toBe(401);
    expect(mocks.audit).not.toHaveBeenCalled();
  });
});
