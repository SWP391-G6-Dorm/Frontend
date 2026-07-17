import { describe, expect, it } from 'vitest';
import { clampPositiveIntString, digitsOnly } from './filterInput';

describe('filterInput', () => {
  it('digitsOnly strips non-digits', () => {
    expect(digitsOnly('12a3')).toBe('123');
    expect(digitsOnly('')).toBe('');
  });

  it('clampPositiveIntString enforces bounds', () => {
    expect(clampPositiveIntString('', 100)).toBe('');
    expect(clampPositiveIntString('0', 100)).toBe('1');
    expect(clampPositiveIntString('50', 100)).toBe('50');
    expect(clampPositiveIntString('999', 100)).toBe('100');
  });
});
