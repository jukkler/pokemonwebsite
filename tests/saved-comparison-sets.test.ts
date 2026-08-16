import { describe, expect, it } from 'vitest';
import {
  createSavedComparisonSet,
  normalizeSavedComparisonSet,
  parseSavedComparisonSets,
  serializeSavedComparisonSets,
} from '@/lib/saved-comparison-sets';

const now = '2026-08-14T12:00:00.000Z';

describe('saved comparison sets', () => {
  it('normalizes selection size, duplicate ids and invalid metadata', () => {
    const set = normalizeSavedComparisonSet(
      {
        version: 2,
        id: '  set-1  ',
        label: '  Mein   Vergleich  ',
        createdAt: now,
        pokemonIds: [6, 6, -1, 3, 9, 25, 26, 27, 28],
        statuses: ['team', 'ko', 'caught', 'not-caught', 'invalid', 'none'],
        referenceId: 999,
        metric: 'invalid',
        source: 'invalid',
        sourceLabel: '  Quelle   A  ',
      },
      { createdAt: now },
    );

    expect(set).toMatchObject({
      version: 2,
      id: 'set-1',
      label: 'Mein Vergleich',
      pokemonIds: [6, 3, 9, 25, 26, 27],
      statuses: ['team', 'not-caught', 'none', 'none', 'none', 'none'],
      referenceId: 6,
      metric: 'speed',
      source: null,
      sourceLabel: 'Quelle A',
    });
  });

  it('migrates legacy v1 team snapshots into the v2 envelope', () => {
    const legacy = JSON.stringify([
      {
        version: 1,
        id: 'old-1',
        label: 'Team Rot',
        createdAt: now,
        pokemonIds: [1, 4, 7],
        statuses: ['team', 'ko', 'not-caught'],
        referenceId: 4,
        metric: 'hp',
        source: 'team',
      },
    ]);

    const parsed = parseSavedComparisonSets(null, legacy, now);

    expect(parsed.migratedLegacy).toBe(true);
    expect(parsed.sets).toHaveLength(1);
    expect(parsed.sets[0]).toMatchObject({
      version: 2,
      id: 'old-1',
      label: 'Team Rot',
      pokemonIds: [1, 4, 7],
      referenceId: 4,
    });
    expect(JSON.parse(serializeSavedComparisonSets(parsed.sets))).toMatchObject({
      version: 2,
      sets: [{ version: 2, id: 'old-1' }],
    });
  });

  it('keeps a valid empty v2 store authoritative over legacy data', () => {
    const parsed = parseSavedComparisonSets(
      JSON.stringify({ version: 2, sets: [] }),
      JSON.stringify([{ version: 1, pokemonIds: [1] }]),
      now,
    );

    expect(parsed).toEqual({ sets: [], migratedLegacy: false });
  });

  it('creates a compact valid set from the current comparison selection', () => {
    const set = createSavedComparisonSet(
      {
        pokemonIds: [25, 6],
        statuses: ['none', 'caught'],
        referenceId: 25,
        metric: 'attack',
        source: 'route',
        sourceLabel: 'Route 1',
      },
      'Startervergleich',
      'set-2',
      now,
    );

    expect(set).toEqual({
      version: 2,
      id: 'set-2',
      label: 'Startervergleich',
      createdAt: now,
      pokemonIds: [25, 6],
      statuses: ['none', 'caught'],
      referenceId: 25,
      metric: 'attack',
      source: 'route',
      sourceLabel: 'Route 1',
    });
  });
});
