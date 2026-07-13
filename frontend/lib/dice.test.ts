import { describe, expect, it } from 'vitest';
import { DIE_SIDES, rollDice, rollDie } from './dice';

describe('rollDie', () => {
  it.each(DIE_SIDES)('returns a value between 1 and %i inclusive', (sides) => {
    for (let i = 0; i < 100; i++) {
      const value = rollDie(sides);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(sides);
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});

describe('rollDice', () => {
  it('returns the requested number of results', () => {
    expect(rollDice(5, 6)).toHaveLength(5);
  });

  it('returns an empty array for a count of 0', () => {
    expect(rollDice(0, 6)).toEqual([]);
  });

  it('keeps every result within the die\'s range', () => {
    const results = rollDice(50, 4);
    for (const value of results) {
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(4);
    }
  });
});
