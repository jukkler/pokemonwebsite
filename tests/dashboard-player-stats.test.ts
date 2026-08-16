import { describe, expect, it } from 'vitest';
import {
  getCurrentRunPlayerStats,
  getHistoricalPlayerStats,
  getRunsForDashboardGame,
} from '@/lib/dashboard-player-stats';

describe('dashboard game scope', () => {
  it('keeps only runs from the displayed game', () => {
    const blackTwoRuns = getRunsForDashboardGame(
      [
        { id: 1, gameVersionKey: 'black-2' },
        { id: 2, gameVersionKey: 'platinum' },
        { id: 3, gameVersionKey: 'black-2' },
      ],
      'black-2',
    );

    expect(blackTwoRuns.map(run => run.id)).toEqual([1, 3]);
  });
});

describe('dashboard current-run player stats', () => {
  it('uses live encounters and counts linked Pokémon only once per route', () => {
    const stats = getCurrentRunPlayerStats(
      ['Lukas', 'Thorben'],
      {
        status: 'active',
        playerStats: [
          { playerName: 'Lukas', knockedOutCount: 99, notCaughtCount: 99, isLoser: true },
        ],
      },
      [
        { routeId: 10, koCausedBy: 'Lukas', notCaughtBy: null },
        { routeId: 10, koCausedBy: 'Lukas', notCaughtBy: null },
        { routeId: 11, koCausedBy: null, notCaughtBy: 'Lukas' },
        { routeId: 12, koCausedBy: 'Thorben', notCaughtBy: null },
      ],
    );

    expect(stats.get('Lukas')).toEqual({ knockedOut: 1, notCaught: 1 });
    expect(stats.get('Thorben')).toEqual({ knockedOut: 1, notCaught: 0 });
  });

  it('uses only the displayed finished run snapshot', () => {
    const stats = getCurrentRunPlayerStats(
      ['Lukas', 'Thorben'],
      {
        status: 'completed',
        playerStats: [
          { playerName: 'Lukas', knockedOutCount: 2, notCaughtCount: 3, isLoser: false },
          { playerName: 'Thorben', knockedOutCount: 4, notCaughtCount: 1, isLoser: true },
        ],
      },
      [{ routeId: 99, koCausedBy: 'Lukas', notCaughtBy: 'Lukas' }],
    );

    expect(stats.get('Lukas')).toEqual({ knockedOut: 2, notCaught: 3 });
    expect(stats.get('Thorben')).toEqual({ knockedOut: 4, notCaught: 1 });
  });

  it('returns zero values when no run is displayed', () => {
    expect(getCurrentRunPlayerStats(['Lukas'], null, []).get('Lukas')).toEqual({
      knockedOut: 0,
      notCaught: 0,
    });
  });
});

describe('dashboard historical player stats', () => {
  it('aggregates finished runs per player and ignores an active run', () => {
    const stats = getHistoricalPlayerStats(
      ['Lukas', 'Thorben'],
      [
        {
          status: 'failed',
          playerStats: [
            { playerName: 'Lukas', knockedOutCount: 3, notCaughtCount: 1, isLoser: true },
            { playerName: 'Thorben', knockedOutCount: 2, notCaughtCount: 0, isLoser: false },
          ],
        },
        {
          status: 'completed',
          playerStats: [
            { playerName: 'Lukas', knockedOutCount: 1, notCaughtCount: 2, isLoser: false },
            { playerName: 'Thorben', knockedOutCount: 4, notCaughtCount: 3, isLoser: false },
          ],
        },
        {
          status: 'active',
          playerStats: [
            { playerName: 'Lukas', knockedOutCount: 99, notCaughtCount: 99, isLoser: true },
          ],
        },
      ],
    );

    expect(stats.get('Lukas')).toEqual({
      runs: 2,
      knockedOut: 4,
      notCaught: 3,
      failed: 1,
    });
    expect(stats.get('Thorben')).toEqual({
      runs: 2,
      knockedOut: 6,
      notCaught: 3,
      failed: 0,
    });
  });
});
