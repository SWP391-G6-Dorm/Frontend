import { describe, expect, it } from 'vitest';
import { dateKey, parseLocalDate, statusForDay } from './roomCalendar';

describe('roomCalendar', () => {
  it('dateKey zero-pads month and day', () => {
    expect(dateKey(2026, 0, 5)).toBe('2026-01-05');
  });

  it('parseLocalDate builds local date', () => {
    const d = parseLocalDate('2026-07-17');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6);
    expect(d.getDate()).toBe(17);
  });

  it('statusForDay marks maintenance rooms', () => {
    const future = new Date();
    future.setDate(future.getDate() + 3);
    const key = dateKey(future.getFullYear(), future.getMonth(), future.getDate());
    expect(statusForDay(key, [], 'MAINTENANCE')).toBe('maintenance');
  });

  it('statusForDay marks reserved ranges', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const start = dateKey(future.getFullYear(), future.getMonth(), future.getDate());
    const endDate = new Date(future);
    endDate.setDate(endDate.getDate() + 2);
    const end = dateKey(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    expect(
      statusForDay(start, [{ checkIn: start, checkOut: end, bookingStatus: 'CONFIRMED' }], 'AVAILABLE'),
    ).toBe('reserved');
  });
});
