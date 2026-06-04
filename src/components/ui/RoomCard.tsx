import { useState } from 'react';
import { Link } from 'react-router-dom';

// ── Room type (aligned with backend entity) ───────────────────────────────────
export interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  pricePerMonth: number;
  capacity: number;
  area: number;
  genderType: string;
  status: string;
  propertyName: string;
  address: string;
  imageUrl: string;
  amenities: string[];
}

interface RoomCardProps {
  room: Room;
  onSave?: (id: string) => void;
  saved?: boolean;
}

function formatPrice(price: number) {
  return '₫' + price.toLocaleString('vi-VN');
}

export default function RoomCard({ room, onSave, saved = false }: RoomCardProps) {
  const [hovered, setHovered] = useState(false);
  const [isSaved, setIsSaved] = useState(saved);

  function handleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved((prev) => !prev);
    onSave?.(room.id);
  }

  return (
    <div
      className="card overflow-hidden flex flex-col transition-all duration-200"
      style={{
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 12px 32px rgba(32,32,32,0.12)'
          : '0 2px 8px rgba(32,32,32,0.06)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: 200 }}>
        <img
          src={room.imageUrl}
          alt={room.roomNumber}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300"
          style={{ transform: hovered ? 'scale(1.04)' : 'scale(1)' }}
        />
        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span className={`badge ${room.status === 'AVAILABLE' ? 'badge-success' : 'badge-warning'}`}>
            {room.status === 'AVAILABLE' ? 'Available' : room.status}
          </span>
        </div>
        {/* Save button */}
        <button
          className="absolute top-3 right-3 flex items-center justify-center rounded-full transition-all duration-150"
          style={{
            width: 32,
            height: 32,
            background: 'rgba(255,255,255,0.92)',
            border: 'none',
            cursor: 'pointer',
            color: isSaved ? 'var(--primary)' : 'var(--ash)',
          }}
          aria-label={isSaved ? 'Unsave room' : 'Save room'}
          onClick={handleSave}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <div>
          <p className="caption" style={{ color: 'var(--ash)' }}>{room.propertyName}</p>
          <h3 className="heading-sm mt-0.5" style={{ color: 'var(--ink)', fontSize: 18 }}>
            {room.roomNumber} — {room.roomType}
          </h3>
        </div>

        <p className="body-sm flex items-center gap-1" style={{ color: 'var(--charcoal)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {room.address}
        </p>

        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
          <span>👥 {room.capacity} {room.capacity === 1 ? 'người' : 'người'}</span>
          <span>📐 {room.area}m²</span>
          <span>{room.genderType === 'Male' ? '♂ Nam' : room.genderType === 'Female' ? '♀ Nữ' : '⚥ Hỗn hợp'}</span>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-1">
          {room.amenities.slice(0, 3).map((a) => (
            <span key={a} className="badge badge-neutral text-xs">{a}</span>
          ))}
          {room.amenities.length > 3 && (
            <span className="badge badge-neutral text-xs">+{room.amenities.length - 3}</span>
          )}
        </div>

        <div
          className="flex items-center justify-between pt-2 mt-auto border-t"
          style={{ borderColor: 'var(--hairline)' }}
        >
          <div>
            <span className="font-bold" style={{ color: 'var(--primary)', fontSize: 20, letterSpacing: '-0.5px' }}>
              {formatPrice(room.pricePerMonth)}
            </span>
            <span className="caption" style={{ color: 'var(--ash)' }}>/tháng</span>
          </div>
          <Link
            to={`/rooms/${room.id}`}
            className="btn-outline"
            style={{ height: 34, padding: '0 16px', fontSize: 13 }}
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
}
