export interface BookedRange {
  checkIn: string;
  checkOut: string;
  bookingStatus: string;
}

export type DayStatus = 'past' | 'available' | 'pending' | 'reserved' | 'occupied' | 'maintenance';

/** Màu ô lịch theo SCR-08 / SCR-10 design spec */
export const DAY_STYLES: Record<DayStatus, { bg: string; color: string; label: string }> = {
  past: { bg: 'transparent', color: 'var(--stone)', label: 'Đã qua' },
  available: { bg: '#dcfce7', color: '#2b9a66', label: 'Còn trống' },
  pending: { bg: '#fef3c7', color: '#d97706', label: 'Chờ cọc' },
  reserved: { bg: '#dbeafe', color: '#2563EB', label: 'Đã đặt' },
  occupied: { bg: '#fee2e2', color: '#DC2626', label: 'Đang ở' },
  maintenance: { bg: '#f3f4f6', color: '#6B7280', label: 'Bảo trì' },
};

export const LEGEND_STATUSES: DayStatus[] = ['available', 'pending', 'reserved', 'occupied', 'maintenance'];

export const MONTH_NAMES_VI = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

export const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export function parseLocalDate(iso: string) {
  const [y, m, day] = iso.split('-').map(Number);
  return new Date(y, m - 1, day);
}

export function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function statusForDay(dateKeyStr: string, ranges: BookedRange[], roomStatus: string): DayStatus {
  const day = parseLocalDate(dateKeyStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (day < today) return 'past';
  if (roomStatus === 'MAINTENANCE') return 'maintenance';

  for (const range of ranges) {
    const start = parseLocalDate(range.checkIn);
    const end = parseLocalDate(range.checkOut);
    if (day >= start && day < end) {
      const st = range.bookingStatus?.toUpperCase() ?? '';
      if (st === 'PENDING_DEPOSIT') return 'pending';
      if (st === 'CHECKED_IN') return 'occupied';
      if (st === 'CONFIRMED' || st === 'RESERVED') return 'reserved';
      return 'reserved';
    }
  }
  return 'available';
}

export function isRangeAvailable(
  checkIn: string,
  checkOut: string,
  ranges: BookedRange[],
  roomStatus: string,
): boolean {
  if (roomStatus !== 'AVAILABLE') return false;
  if (!checkIn || !checkOut || checkOut <= checkIn) return false;
  const start = parseLocalDate(checkIn);
  const end = parseLocalDate(checkOut);
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const key = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
    if (statusForDay(key, ranges, roomStatus) !== 'available') return false;
  }
  return true;
}

export function addMonths(year: number, month: number, delta: number) {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}
