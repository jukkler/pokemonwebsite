import { describe, expect, it } from 'vitest';
import {
  calculateWinRate,
  getRunStatusLabel,
  isFinishedRunStatus,
} from '@/lib/run-lifecycle';

describe('run lifecycle presentation', () => {
  it('uses the player-facing outcome labels', () => {
    expect(getRunStatusLabel('active')).toBe('Aktiv');
    expect(getRunStatusLabel('failed')).toBe('Verloren');
    expect(getRunStatusLabel('completed')).toBe('Gewonnen');
  });

  it('keeps unknown legacy statuses readable', () => {
    expect(getRunStatusLabel('archived')).toBe('archived');
  });

  it('calculates the win rate from finished runs only', () => {
    expect(calculateWinRate(3, 1)).toBe(75);
    expect(calculateWinRate(1, 2)).toBe(33);
    expect(calculateWinRate(0, 0)).toBeNull();
  });

  it('recognizes both supported outcomes', () => {
    expect(isFinishedRunStatus('completed')).toBe(true);
    expect(isFinishedRunStatus('failed')).toBe(true);
    expect(isFinishedRunStatus('active')).toBe(false);
  });
});
