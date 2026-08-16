import { describe, expect, it } from 'vitest';
import {
  getMetricDelta,
  getMetricLeaders,
  getTotalBaseStats,
} from '@/lib/pokemon-comparison';
import type { Pokemon } from '@/lib/types';

const charizard: Pokemon = {
  pokedexId: 6,
  name: 'charizard',
  nameGerman: 'Glurak',
  types: '["fire","flying"]',
  spriteUrl: null,
  hp: 78,
  attack: 84,
  defense: 78,
  spAttack: 109,
  spDefense: 85,
  speed: 100,
};

const blastoise: Pokemon = {
  pokedexId: 9,
  name: 'blastoise',
  nameGerman: 'Turtok',
  types: '["water"]',
  spriteUrl: null,
  hp: 79,
  attack: 83,
  defense: 100,
  spAttack: 85,
  spDefense: 105,
  speed: 78,
};

const speedTie: Pokemon = { ...blastoise, pokedexId: 25, speed: 100 };

describe('base-stat comparison', () => {
  it('calculates the base-stat total and delta', () => {
    expect(getTotalBaseStats(charizard)).toBe(534);
    expect(getTotalBaseStats(blastoise)).toBe(530);
    expect(getMetricDelta(charizard, blastoise, 'speed')).toBe(22);
    expect(getMetricDelta(blastoise, charizard, 'total')).toBe(-4);
  });

  it('returns one leader or all tied leaders deterministically', () => {
    expect(getMetricLeaders([charizard, blastoise], 'speed')).toMatchObject({
      highestValue: 100,
      leaderIds: [6],
      isTie: false,
    });
    expect(getMetricLeaders([charizard, speedTie, blastoise], 'speed')).toMatchObject({
      highestValue: 100,
      leaderIds: [6, 25],
      isTie: true,
    });
  });
});
