import { describe, expect, it } from 'vitest';
import { filterMakes } from './filterMakes';

const makes = [
  { id: 1, name: 'Radford' },
  { id: 2, name: 'Ford' },
  { id: 3, name: 'Toyota' },
  { id: 4, name: 'FORD MOTOR COMPANY' },
];

describe('filterMakes', () => {
  it('returns the first `limit` makes for an empty query', () => {
    expect(filterMakes(makes, '  ', 2).map((m) => m.id)).toEqual([1, 2]);
  });

  it('matches case-insensitively', () => {
    expect(filterMakes(makes, 'toyOTA').map((m) => m.name)).toEqual(['Toyota']);
  });

  it('ranks prefix matches before substring matches', () => {
    expect(filterMakes(makes, 'ford').map((m) => m.name)).toEqual(['Ford', 'FORD MOTOR COMPANY', 'Radford']);
  });

  it('respects the limit', () => {
    expect(filterMakes(makes, 'ford', 1)).toHaveLength(1);
  });

  it('returns nothing when there is no match', () => {
    expect(filterMakes(makes, 'zzz')).toEqual([]);
  });
});
