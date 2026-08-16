import { describe, expect, it } from 'vitest';
import {
  getAverageTeamStrength,
  getBaseStatBarWidth,
  getStrongestBaseStats,
  getTeamPokemonTotal,
  type TeamBaseStats,
} from '@/lib/team-base-stats';

const balanced: TeamBaseStats = {
  hp: 80,
  attack: 80,
  defense: 80,
  spAttack: 80,
  spDefense: 80,
  speed: 80,
};

const offensive: TeamBaseStats = {
  hp: 70,
  attack: 110,
  defense: 65,
  spAttack: 110,
  spDefense: 70,
  speed: 95,
};

describe('team base-stat helpers', () => {
  it('calculates totals and rounds the occupied-team average', () => {
    expect(getTeamPokemonTotal(balanced)).toBe(480);
    expect(getTeamPokemonTotal(offensive)).toBe(520);
    expect(getAverageTeamStrength([balanced, offensive])).toBe(500);
    expect(getAverageTeamStrength([])).toBeNull();
  });

  it('marks every tied strongest stat', () => {
    expect(getStrongestBaseStats(offensive)).toEqual(['attack', 'spAttack']);
    expect(getStrongestBaseStats(balanced)).toHaveLength(6);
  });

  it('normalizes bars to the valid base-stat range', () => {
    expect(getBaseStatBarWidth(255)).toBe(100);
    expect(getBaseStatBarWidth(128)).toBe(50);
    expect(getBaseStatBarWidth(999)).toBe(100);
    expect(getBaseStatBarWidth(-1)).toBe(0);
  });
});
