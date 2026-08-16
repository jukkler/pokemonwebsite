import { describe, expect, it } from 'vitest';
import {
  describeDefensiveMultiplier,
  formatDefensiveMultiplier,
  getDefensiveCoverageKind,
} from '@/lib/defensive-coverage';
import { getDefenseMultiplier } from '@/lib/typeEffectiveness';

describe('defensive coverage map', () => {
  it('classifies every supported multiplier', () => {
    expect([0, 0.25, 0.5, 1, 2, 4].map(getDefensiveCoverageKind)).toEqual([
      'immune',
      'strong-resistance',
      'resistance',
      'neutral',
      'weakness',
      'critical',
    ]);
  });

  it('formats the full range as direct multipliers', () => {
    expect([0, 0.25, 0.5, 1, 2, 4].map(formatDefensiveMultiplier)).toEqual([
      '0×',
      '¼×',
      '½×',
      '1×',
      '2×',
      '4×',
    ]);
  });

  it('describes critical dual-type matchups without relying on color', () => {
    const multiplier = getDefenseMultiplier(['water', 'ground'], 'grass');

    expect(multiplier).toBe(4);
    expect(describeDefensiveMultiplier(multiplier)).toContain('vierfacher Schaden');
  });
});
