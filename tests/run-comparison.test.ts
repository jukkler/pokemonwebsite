import { describe, expect, it } from 'vitest';
import type { RunComparisonSide } from '@/components/statistics/types';
import {
  createRunComparison,
  parseRunComparisonParam,
  parseRunComparisonRequest,
  serializeRunComparisonParam,
} from '@/lib/run-comparison';

function createSide(
  id: number,
  options: {
    gameKey?: string;
    caught?: number;
    knockedOut?: number;
    notCaught?: number;
    durationMs?: number;
    badges?: number;
    missingEncounters?: boolean;
    playerName?: string;
    playerKnockedOut?: number;
    playerNotCaught?: number;
  } = {}
): RunComparisonSide {
  const missingEncounters = options.missingEncounters ?? false;
  return {
    run: {
      id,
      runNumber: id,
      status: 'failed',
      loserPlayerName: null,
      startedAt: '2026-01-01T00:00:00.000Z',
      endedAt: '2026-01-01T01:00:00.000Z',
      pausedAt: null,
      totalPausedMs: 0,
      badgesEarned: options.badges ?? 0,
      durationMs: options.durationMs ?? 3_600_000,
      gameVersion: {
        key: options.gameKey ?? 'red',
        name: options.gameKey ?? 'Rot',
        generation: 1,
      },
      ...(missingEncounters
        ? {}
        : {
            counts: {
              encounters: (options.caught ?? 0) + (options.notCaught ?? 0),
              caught: options.caught ?? 0,
              knockedOut: options.knockedOut ?? 0,
              notCaught: options.notCaught ?? 0,
            },
          }),
    },
    isLive: false,
    playerStats: options.playerName
      ? [{
          playerName: options.playerName,
          knockedOutCount: options.playerKnockedOut ?? 0,
          notCaughtCount: options.playerNotCaught ?? 0,
          isLoser: false,
        }]
      : [],
    encounters: [],
    coverage: {
      encounters: missingEncounters
        ? { status: 'missing', documented: null, total: null }
        : { status: 'complete', documented: 0, total: 0 },
      playerStats: options.playerName ? 'complete' : 'missing',
    },
  };
}

describe('Run comparison URL state', () => {
  it('parses at most two unique positive IDs', () => {
    const params = new URLSearchParams('compare=12,bad,12,8,9,-1');
    expect(parseRunComparisonParam(params)).toEqual([12, 8]);
  });

  it('serializes canonically while preserving unrelated parameters', () => {
    const current = new URLSearchParams('game=red&view=compact&view=detail&compare=1');
    const serialized = serializeRunComparisonParam([7, 3, 7], current);

    expect(serialized.get('compare')).toBe('7,3');
    expect(serialized.get('game')).toBe('red');
    expect(serialized.getAll('view')).toEqual(['compact', 'detail']);
  });

  it('validates the two server request IDs', () => {
    expect(parseRunComparisonRequest('7', '3')).toEqual({
      ok: true,
      leftId: 7,
      rightId: 3,
    });
    expect(parseRunComparisonRequest(null, '3')).toEqual({
      ok: false,
      reason: 'missing',
    });
    expect(parseRunComparisonRequest('7', '7')).toEqual({
      ok: false,
      reason: 'same-run',
    });
    expect(parseRunComparisonRequest('-1', '3')).toEqual({
      ok: false,
      reason: 'invalid',
    });
  });
});

describe('Run comparison deltas', () => {
  it('calculates KPI and player deltas from left to right', () => {
    const left = createSide(1, {
      caught: 8,
      knockedOut: 3,
      notCaught: 2,
      durationMs: 5_000,
      badges: 2,
      playerName: 'Lukas',
      playerKnockedOut: 3,
      playerNotCaught: 2,
    });
    const right = createSide(2, {
      caught: 11,
      knockedOut: 1,
      notCaught: 4,
      durationMs: 8_000,
      badges: 5,
      playerName: 'Lukas',
      playerKnockedOut: 1,
      playerNotCaught: 4,
    });

    const comparison = createRunComparison(left, right);
    expect(comparison.metrics.map(metric => [metric.key, metric.delta])).toEqual([
      ['caught', 3],
      ['knockedOut', -2],
      ['notCaught', 2],
      ['durationMs', 3_000],
      ['badgesEarned', 3],
    ]);
    expect(comparison.players[0]).toMatchObject({
      playerName: 'Lukas',
      deltas: { knockedOutCount: -2, notCaughtCount: 2 },
    });
    expect(comparison.sameGame).toBe(true);
  });

  it('keeps unknown historical snapshot values null instead of inventing zeroes', () => {
    const left = createSide(1, { missingEncounters: true, durationMs: 5_000 });
    const right = createSide(2, { caught: 4, durationMs: 8_000 });

    const comparison = createRunComparison(left, right);
    expect(comparison.metrics.find(metric => metric.key === 'caught')).toMatchObject({
      left: null,
      right: 4,
      delta: null,
    });
    expect(comparison.metrics.find(metric => metric.key === 'durationMs')).toMatchObject({
      left: 5_000,
      right: 8_000,
      delta: 3_000,
    });
  });

  it('keeps non-participating or undocumented player values null', () => {
    const left = createSide(1, {
      playerName: 'Lukas',
      playerKnockedOut: 1,
    });
    const right = createSide(2, {
      playerName: 'Thorben',
      playerKnockedOut: 2,
    });

    const comparison = createRunComparison(left, right);
    expect(comparison.players).toEqual([
      {
        playerName: 'Lukas',
        left: { knockedOutCount: 1, notCaughtCount: 0, isLoser: false },
        right: { knockedOutCount: null, notCaughtCount: null, isLoser: null },
        deltas: { knockedOutCount: null, notCaughtCount: null },
      },
      {
        playerName: 'Thorben',
        left: { knockedOutCount: null, notCaughtCount: null, isLoser: null },
        right: { knockedOutCount: 2, notCaughtCount: 0, isLoser: false },
        deltas: { knockedOutCount: null, notCaughtCount: null },
      },
    ]);
  });

  it('marks comparisons across different games explicitly', () => {
    const left = createSide(1, { gameKey: 'diamond', caught: 3 });
    const right = createSide(2, { gameKey: 'black-2', caught: 5 });

    expect(createRunComparison(left, right).sameGame).toBe(false);
  });
});
