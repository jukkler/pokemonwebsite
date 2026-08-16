import type {
  RunComparisonMetric,
  RunComparisonMetricKey,
  RunComparisonPlayer,
  RunComparisonPlayerSide,
  RunComparisonResponse,
  RunComparisonSide,
} from '@/components/statistics/types';

const MAX_RUN_COMPARISON_IDS = 2;

interface SearchParamReader {
  get(name: string): string | null;
}

export type RunComparisonRequestParseResult =
  | { ok: true; leftId: number; rightId: number }
  | { ok: false; reason: 'missing' | 'invalid' | 'same-run' };

function parsePositiveRunId(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function sanitizeRunComparisonIds(ids: readonly number[]): number[] {
  const uniqueIds: number[] = [];

  for (const id of ids) {
    if (!Number.isSafeInteger(id) || id <= 0 || uniqueIds.includes(id)) continue;
    uniqueIds.push(id);
    if (uniqueIds.length === MAX_RUN_COMPARISON_IDS) break;
  }

  return uniqueIds;
}

/** Liest die teilbare Statistik-Auswahl aus `compare=left,right`. */
export function parseRunComparisonParam(params: SearchParamReader): number[] {
  const rawValue = params.get('compare') ?? '';
  return sanitizeRunComparisonIds(
    rawValue
      .split(',')
      .map(value => parsePositiveRunId(value.trim()))
      .filter((value): value is number => value !== null)
  );
}

/** Aktualisiert nur den Vergleichsparameter und erhaelt alle anderen Parameter. */
export function serializeRunComparisonParam(
  ids: readonly number[],
  currentParams: URLSearchParams = new URLSearchParams()
): URLSearchParams {
  const nextParams = new URLSearchParams(currentParams);
  const sanitizedIds = sanitizeRunComparisonIds(ids);

  if (sanitizedIds.length > 0) {
    nextParams.set('compare', sanitizedIds.join(','));
  } else {
    nextParams.delete('compare');
  }

  return nextParams;
}

export function parseRunComparisonRequest(
  rawLeft: string | null,
  rawRight: string | null
): RunComparisonRequestParseResult {
  if (rawLeft === null || rawRight === null) {
    return { ok: false, reason: 'missing' };
  }

  const leftId = parsePositiveRunId(rawLeft);
  const rightId = parsePositiveRunId(rawRight);
  if (leftId === null || rightId === null) {
    return { ok: false, reason: 'invalid' };
  }
  if (leftId === rightId) {
    return { ok: false, reason: 'same-run' };
  }

  return { ok: true, leftId, rightId };
}

function subtractNullable(right: number | null, left: number | null): number | null {
  return right === null || left === null ? null : right - left;
}

function getEncounterMetric(
  side: RunComparisonSide,
  key: 'caught' | 'knockedOut' | 'notCaught'
): number | null {
  if (side.coverage.encounters.status === 'missing') return null;

  const counts = side.run.counts;
  if (counts?.[key] !== undefined) return counts[key] ?? null;

  if (key === 'caught') {
    return side.encounters.filter(encounter => !encounter.isNotCaught).length;
  }
  if (key === 'knockedOut') {
    return side.encounters.filter(encounter => encounter.isKnockedOut).length;
  }
  return side.encounters.filter(encounter => encounter.isNotCaught).length;
}

function createMetric(
  key: RunComparisonMetricKey,
  label: string,
  unit: RunComparisonMetric['unit'],
  left: number | null,
  right: number | null
): RunComparisonMetric {
  return {
    key,
    label,
    unit,
    left,
    right,
    delta: subtractNullable(right, left),
  };
}

function emptyPlayerSide(): RunComparisonPlayerSide {
  return {
    knockedOutCount: null,
    notCaughtCount: null,
    isLoser: null,
  };
}

function playerSideFor(
  side: RunComparisonSide,
  playerName: string
): RunComparisonPlayerSide {
  if (side.coverage.playerStats === 'missing') return emptyPlayerSide();

  const stats = side.playerStats.find(player => player.playerName === playerName);
  if (!stats) return emptyPlayerSide();

  return {
    knockedOutCount: stats.knockedOutCount,
    notCaughtCount: stats.notCaughtCount,
    isLoser: stats.isLoser,
  };
}

function createPlayerRows(
  left: RunComparisonSide,
  right: RunComparisonSide
): RunComparisonPlayer[] {
  const playerNames = new Set([
    ...left.playerStats.map(player => player.playerName),
    ...right.playerStats.map(player => player.playerName),
  ]);

  return Array.from(playerNames)
    .sort((a, b) => a.localeCompare(b, 'de'))
    .map(playerName => {
      const leftStats = playerSideFor(left, playerName);
      const rightStats = playerSideFor(right, playerName);
      return {
        playerName,
        left: leftStats,
        right: rightStats,
        deltas: {
          knockedOutCount: subtractNullable(
            rightStats.knockedOutCount,
            leftStats.knockedOutCount
          ),
          notCaughtCount: subtractNullable(
            rightStats.notCaughtCount,
            leftStats.notCaughtCount
          ),
        },
      };
    });
}

export function createRunComparison(
  left: RunComparisonSide,
  right: RunComparisonSide
): RunComparisonResponse {
  const leftCaught = getEncounterMetric(left, 'caught');
  const rightCaught = getEncounterMetric(right, 'caught');
  const leftKnockedOut = getEncounterMetric(left, 'knockedOut');
  const rightKnockedOut = getEncounterMetric(right, 'knockedOut');
  const leftNotCaught = getEncounterMetric(left, 'notCaught');
  const rightNotCaught = getEncounterMetric(right, 'notCaught');

  return {
    left,
    right,
    sameGame: left.run.gameVersion?.key === right.run.gameVersion?.key,
    metrics: [
      createMetric('caught', 'Gefangen', 'count', leftCaught, rightCaught),
      createMetric(
        'knockedOut',
        'K.O.',
        'count',
        leftKnockedOut,
        rightKnockedOut
      ),
      createMetric(
        'notCaught',
        'Nicht gefangen',
        'count',
        leftNotCaught,
        rightNotCaught
      ),
      createMetric(
        'durationMs',
        'Dauer',
        'milliseconds',
        left.run.durationMs ?? null,
        right.run.durationMs ?? null
      ),
      createMetric(
        'badgesEarned',
        'Orden',
        'count',
        left.run.badgesEarned,
        right.run.badgesEarned
      ),
    ],
    players: createPlayerRows(left, right),
  };
}
