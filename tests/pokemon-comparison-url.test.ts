import { describe, expect, it } from 'vitest';
import {
  normalizeComparisonState,
  parseComparisonParams,
  serializeComparisonParams,
  type ComparisonQueryState,
} from '@/lib/pokemon-comparison';

describe('Pokémon comparison URL state', () => {
  it('parses selection, status and source metadata', () => {
    const params = new URLSearchParams(
      'pokemon=6,3,9&ref=3&metric=attack&status=team,ko,not-caught&source=route&sourceLabel=%20Route%20%207%20',
    );

    expect(parseComparisonParams(params)).toEqual({
      pokemonIds: [6, 3, 9],
      referenceId: 3,
      metric: 'attack',
      statuses: ['team', 'ko', 'not-caught'],
      source: 'route',
      sourceLabel: 'Route 7',
    });
  });

  it('falls back safely for invalid URL values', () => {
    const params = new URLSearchParams(
      'pokemon=-1,abc,25,0,26&ref=999&metric=magic&status=invalid,ko&source=save&sourceLabel=%20%20',
    );

    expect(parseComparisonParams(params)).toEqual({
      pokemonIds: [25, 26],
      referenceId: 25,
      metric: 'speed',
      statuses: ['none', 'ko'],
      source: null,
      sourceLabel: null,
    });
  });

  it('normalizes against available Pokémon while keeping aligned statuses', () => {
    const state: ComparisonQueryState = {
      pokemonIds: [1, 2, 3],
      referenceId: 2,
      metric: 'total',
      statuses: ['team', 'ko', 'caught'],
      source: 'team',
      sourceLabel: 'Team Blau',
    };

    expect(normalizeComparisonState(state, [1, 3])).toEqual({
      pokemonIds: [1, 3],
      referenceId: 1,
      metric: 'total',
      statuses: ['team', 'caught'],
      source: 'team',
      sourceLabel: 'Team Blau',
    });
  });

  it('serializes a canonical query and removes stale metadata', () => {
    const initial = new URLSearchParams(
      'pokemon=99&ref=99&status=ko&source=route&sourceLabel=Alt&view=compact',
    );
    const state: ComparisonQueryState = {
      pokemonIds: [25, 6],
      referenceId: 6,
      metric: 'speed',
      statuses: ['none', 'none'],
      source: null,
      sourceLabel: null,
    };

    const serialized = serializeComparisonParams(state, initial);
    expect(Object.fromEntries(serialized)).toEqual({
      pokemon: '25,6',
      ref: '6',
      metric: 'speed',
      view: 'compact',
    });
    expect(serialized.has('status')).toBe(false);
    expect(serialized.has('source')).toBe(false);
    expect(serialized.has('sourceLabel')).toBe(false);
  });
});
