import { describe, expect, it } from 'vitest';
import {
  calculateDefensiveEffectiveness,
  getDefenseMultiplier,
  parseTypes,
} from '@/lib/typeEffectiveness';

describe('type effectiveness', () => {
  it('multiplies both defender types', () => {
    expect(getDefenseMultiplier(['fire', 'flying'], 'rock')).toBe(4);
    expect(getDefenseMultiplier(['fire', 'flying'], 'grass')).toBe(0.25);
    expect(getDefenseMultiplier(['fire', 'flying'], 'ground')).toBe(0);
  });

  it('groups known immunities, weaknesses and resistances', () => {
    const profile = calculateDefensiveEffectiveness(['water', 'ground']);

    expect(profile['0x']).toContain('Elektro');
    expect(profile['4x']).toContain('Pflanze');
    expect(profile['0.5x']).toContain('Feuer');
  });

  it('parses JSON and comma-separated type values consistently', () => {
    expect(parseTypes('["Fire", "Flying"]')).toEqual(['fire', 'flying']);
    expect(parseTypes(' Fire, Flying ')).toEqual(['fire', 'flying']);
  });
});
