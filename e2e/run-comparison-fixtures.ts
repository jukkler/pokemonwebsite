import type { Page, Route } from '@playwright/test';
import { installStatisticsMocks } from './fixtures';

const BLUE = { key: 'red-blue', name: 'Pokémon Blau', generation: 1 };

const LEFT_RUN = {
  id: 101,
  runNumber: 1,
  status: 'completed',
  loserPlayerName: null,
  startedAt: '2026-01-01T10:00:00.000Z',
  endedAt: '2026-01-01T12:00:00.000Z',
  pausedAt: null,
  totalPausedMs: 0,
  badgesEarned: 8,
  durationMs: 7_200_000,
  isLive: false,
  gameVersion: BLUE,
  counts: { encounters: 10, caught: 8, knockedOut: 1, notCaught: 1 },
};

const RIGHT_RUN = {
  id: 102,
  runNumber: 2,
  status: 'failed',
  loserPlayerName: 'Testspieler',
  startedAt: '2026-02-01T10:00:00.000Z',
  endedAt: '2026-02-01T11:30:00.000Z',
  pausedAt: null,
  totalPausedMs: 0,
  badgesEarned: 4,
  durationMs: 5_400_000,
  isLive: false,
  gameVersion: BLUE,
  counts: { encounters: 7, caught: 5, knockedOut: 2, notCaught: 0 },
};

const LEFT_DETAILS = {
  run: LEFT_RUN,
  isLive: false,
  playerStats: [
    { playerName: 'Testspieler', knockedOutCount: 1, notCaughtCount: 1, isLoser: false },
  ],
  encounters: [
    {
      id: 1001,
      playerName: 'Testspieler',
      pokemonPokedexId: 25,
      pokemonName: 'pikachu',
      pokemonNameGerman: 'Pikachu',
      routeName: 'Vertania-Wald',
      nickname: 'Blitz',
      teamSlot: null,
      isKnockedOut: true,
      koCausedBy: 'Testspieler',
      koReason: 'Volltreffer',
      koDate: '2026-01-01T11:10:00.000Z',
      isNotCaught: false,
      notCaughtBy: null,
      notCaughtReason: null,
      notCaughtDate: null,
      caughtAt: '2026-01-01T10:20:00.000Z',
      spriteUrl: null,
    },
  ],
};

const RIGHT_DETAILS = {
  run: RIGHT_RUN,
  isLive: false,
  playerStats: [
    { playerName: 'Testspieler', knockedOutCount: 2, notCaughtCount: 0, isLoser: true },
  ],
  encounters: [
    {
      id: 2001,
      playerName: 'Testspieler',
      pokemonPokedexId: 19,
      pokemonName: 'rattata',
      pokemonNameGerman: 'Rattfratz',
      routeName: 'Route 1',
      nickname: null,
      teamSlot: null,
      isKnockedOut: true,
      koCausedBy: null,
      koReason: null,
      koDate: null,
      isNotCaught: false,
      notCaughtBy: null,
      notCaughtReason: null,
      notCaughtDate: null,
      caughtAt: null,
      spriteUrl: null,
    },
  ],
};

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function comparisonResponse(reversed = false) {
  const leftSide = {
    ...LEFT_DETAILS,
    coverage: {
      encounters: { status: 'complete', documented: 10, total: 10 },
      playerStats: 'complete',
    },
  };
  const rightSide = {
    ...RIGHT_DETAILS,
    coverage: {
      encounters: { status: 'partial', documented: 6, total: 7 },
      playerStats: 'partial',
    },
  };
  const metrics = [
    { key: 'caught', label: 'Gefangen', unit: 'count', left: 8, right: 5, delta: -3 },
    { key: 'knockedOut', label: 'K.O.', unit: 'count', left: 1, right: 2, delta: 1 },
    { key: 'notCaught', label: 'Nicht gefangen', unit: 'count', left: 1, right: 0, delta: -1 },
    { key: 'durationMs', label: 'Spielzeit', unit: 'milliseconds', left: 7_200_000, right: 5_400_000, delta: -1_800_000 },
    { key: 'badgesEarned', label: 'Abzeichen', unit: 'count', left: 8, right: 4, delta: -4 },
  ];
  const player = {
    playerName: 'Testspieler',
    left: { knockedOutCount: 1, notCaughtCount: 1, isLoser: false },
    right: { knockedOutCount: 2, notCaughtCount: 0, isLoser: true },
    deltas: { knockedOutCount: 1, notCaughtCount: -1 },
  };

  if (!reversed) {
    return { left: leftSide, right: rightSide, metrics, players: [player], sameGame: true };
  }

  return {
    left: rightSide,
    right: leftSide,
    metrics: metrics.map((metric) => ({
      ...metric,
      left: metric.right,
      right: metric.left,
      delta: metric.delta === null ? null : -metric.delta,
    })),
    players: [{
      ...player,
      left: player.right,
      right: player.left,
      deltas: {
        knockedOutCount: -player.deltas.knockedOutCount,
        notCaughtCount: -player.deltas.notCaughtCount,
      },
    }],
    sameGame: true,
  };
}

export async function installRunComparisonMocks(page: Page) {
  const statistics = await installStatisticsMocks(page);
  const detailRequests: number[] = [];

  await page.route(/\/api\/runs\/history\/(\d+)(?:\?.*)?$/, (route) => {
    const match = new URL(route.request().url()).pathname.match(/\/(\d+)$/);
    const id = Number(match?.[1]);
    detailRequests.push(id);

    if (id === LEFT_RUN.id) return json(route, LEFT_DETAILS);
    if (id === RIGHT_RUN.id) return json(route, RIGHT_DETAILS);
    return json(route, { error: 'Run nicht gefunden' }, 404);
  });

  await page.route('**/api/runs/compare?*', (route) => {
    const url = new URL(route.request().url());
    const leftId = Number(url.searchParams.get('left'));
    const rightId = Number(url.searchParams.get('right'));

    const forward = leftId === LEFT_RUN.id && rightId === RIGHT_RUN.id;
    const reverse = leftId === RIGHT_RUN.id && rightId === LEFT_RUN.id;
    if (!forward && !reverse) {
      return json(route, { error: 'Run nicht gefunden' }, 404);
    }

    return json(route, comparisonResponse(reverse));
  });

  return { ...statistics, detailRequests };
}
