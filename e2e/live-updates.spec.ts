import { expect, test, type Page, type Route } from '@playwright/test';
import type { LiveRevisions } from '../lib/live-updates';

const revisions: LiveRevisions = {
  encounters: '0',
  routes: '0',
  runs: '0',
  players: '0',
  streams: '0',
  pokemon: '0',
};

function json(route: Route, body: unknown) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function installRevisionPollingMock(page: Page, onPoll?: () => void) {
  await page.route('**/api/events/latest?*', (route) => {
    onPoll?.();
    return json(route, {
      events: [],
      serverTime: Date.now(),
      revisions: { ...revisions },
    });
  });
}

async function installSafeAdminMutationMock(page: Page) {
  await page.route('**/api/admin/routes', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    revisions.encounters = (BigInt(revisions.encounters) + BigInt(1)).toString();
    await json(route, { success: true, interceptedByE2E: true });
  });
}

async function sendInterceptedMutation(page: Page) {
  const response = await page.evaluate(async () => {
    const result = await fetch('/api/admin/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Nur E2E, wird nicht gespeichert' }),
    });
    return { status: result.status, body: await result.json() };
  });

  expect(response).toEqual({
    status: 200,
    body: { success: true, interceptedByE2E: true },
  });
}

test.describe('seitenübergreifende Live-Aktualisierung', () => {
  test.beforeEach(() => {
    for (const topic of Object.keys(revisions) as Array<keyof LiveRevisions>) {
      revisions[topic] = '0';
    }
  });

  test('aktualisiert einen zweiten Client nur nach Revisionen und holt Sichtbarkeitswechsel sofort auf', async ({
    context,
    page: observer,
  }) => {
    test.setTimeout(30_000);

    let pollCount = 0;
    let playerReloads = 0;
    let routeReloads = 0;

    await installRevisionPollingMock(observer, () => {
      pollCount += 1;
    });
    await observer.route('**/api/players', (route) => {
      playerReloads += 1;
      return json(route, []);
    });
    await observer.route('**/api/routes', (route) => {
      routeReloads += 1;
      return json(route, []);
    });

    const adminClient = await context.newPage();
    await installRevisionPollingMock(adminClient);
    await installSafeAdminMutationMock(adminClient);
    await adminClient.goto('/favicon.svg');

    await observer.goto('/pokeroute');
    await expect(observer.getByRole('heading', { name: 'Routen', exact: true })).toBeVisible();
    await expect.poll(() => pollCount, { timeout: 8_000 }).toBeGreaterThanOrEqual(2);
    await expect.poll(() => playerReloads).toBeGreaterThanOrEqual(1);
    await expect.poll(() => routeReloads).toBeGreaterThanOrEqual(1);

    await observer.evaluate(() => {
      Object.assign(window, { __e2eLiveUpdateDocument: 'bleibt-erhalten' });
    });

    const idleBaseline = {
      polls: pollCount,
      players: playerReloads,
      routes: routeReloads,
    };
    await expect.poll(() => pollCount, { timeout: 6_000 }).toBeGreaterThan(idleBaseline.polls);
    expect(playerReloads).toBe(idleBaseline.players);
    expect(routeReloads).toBe(idleBaseline.routes);

    await sendInterceptedMutation(adminClient);
    await expect.poll(() => playerReloads, { timeout: 6_000 }).toBe(idleBaseline.players + 1);
    await expect.poll(() => routeReloads, { timeout: 6_000 }).toBe(idleBaseline.routes + 1);
    await expect(
      observer.evaluate(() => Reflect.get(window, '__e2eLiveUpdateDocument')),
    ).resolves.toBe('bleibt-erhalten');

    await observer.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    const hiddenBaseline = {
      players: playerReloads,
      routes: routeReloads,
    };

    await sendInterceptedMutation(adminClient);
    await observer.waitForTimeout(3_500);
    expect(playerReloads).toBe(hiddenBaseline.players);
    expect(routeReloads).toBe(hiddenBaseline.routes);

    await observer.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(() => playerReloads, { timeout: 2_000 }).toBe(hiddenBaseline.players + 1);
    await expect.poll(() => routeReloads, { timeout: 2_000 }).toBe(hiddenBaseline.routes + 1);

    const focusedBaseline = {
      polls: pollCount,
      players: playerReloads,
      routes: routeReloads,
    };
    await observer.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect.poll(() => pollCount, { timeout: 2_000 }).toBeGreaterThan(focusedBaseline.polls);
    expect(playerReloads).toBe(focusedBaseline.players);
    expect(routeReloads).toBe(focusedBaseline.routes);
  });
});
