import { useMemo } from 'react';
import RoomAvailabilityCalendar, { RoomCalendarLegend } from '../rooms/RoomAvailabilityCalendar';
import { addMonths, type BookedRange } from '../../utils/roomCalendar';

export type { BookedRange, DayStatus } from '../../utils/roomCalendar';
export {
  DAY_STYLES,
  isRangeAvailable,
  isRoomBookingBlocked,
  parseLocalDate,
  statusForDay,
} from '../../utils/roomCalendar';

interface RoomMiniCalendarProps {
  roomStatus: string;
  bookedRanges: BookedRange[];
}

export default function RoomMiniCalendar({ roomStatus, bookedRanges }: RoomMiniCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const thisYear = today.getFullYear();
  const thisMonth = today.getMonth();
  const next = addMonths(thisYear, thisMonth, 1);

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="room-mini-calendar-dual">
        <RoomAvailabilityCalendar
          roomStatus={roomStatus}
          bookedRanges={bookedRanges}
          year={thisYear}
          month={thisMonth}
          showNavigation={false}
          cellSize={36}
          showLegend={false}
        />
        <RoomAvailabilityCalendar
          roomStatus={roomStatus}
          bookedRanges={bookedRanges}
          year={next.year}
          month={next.month}
          showNavigation={false}
          cellSize={36}
          showLegend={false}
        />
      </div>
      <RoomCalendarLegend />
    </div>
  );
}
