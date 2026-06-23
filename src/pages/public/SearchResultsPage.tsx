import { Link } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';
import Pagination from '../../components/ui/Pagination';
import RoomSearchCard, { RoomCardSkeleton } from '../../components/rooms/RoomSearchCard';
import { buildSearchSummary, useRoomSearch } from '../../hooks/useRoomSearch';

export function SearchResultsContent() {
  const s = useRoomSearch();
  const {
    draft,
    setDraft,
    priceMin,
    priceMax,
    properties,
    rooms,
    totalElements,
    totalPages,
    loading,
    error,
    urlPage,
    urlSort,
    urlLocation,
    urlCheckIn,
    urlCheckOut,
    urlGuests,
    activeChips,
    hasActiveFilters,
    detailQuerySuffix,
    applyFilters,
    clearFilters,
    toggleRoomType,
    toggleProperty,
    handleSortChange,
    handlePageChange,
    loadRooms,
    ROOM_TYPES,
  } = s;

  const summary = buildSearchSummary(urlLocation, urlCheckIn, urlCheckOut, urlGuests, hasActiveFilters);

  return (
    <div className="container-wide section-pad-sm">
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
        <Link to="/" className="text-primary" style={{ textDecoration: 'none' }}>
          Trang chủ
        </Link>
        <span>›</span>
        <span className="text-ink" style={{ fontWeight: 600 }}>
          Kết quả tìm kiếm
        </span>
      </div>

      <section
        style={{
          background: 'var(--surface-bone)',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 28,
          border: '1px solid var(--hairline)',
        }}
      >
        <h1 className="heading-md font-display" style={{ marginBottom: 4 }}>
          {summary}
        </h1>
        <p className="body-sm text-charcoal">
          {loading ? 'Đang tìm...' : `${totalElements} phòng phù hợp`}
        </p>
      </section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 280px) minmax(0, 1fr)',
          gap: 28,
          alignItems: 'start',
        }}
      >
        <aside
          className="card"
          style={{ padding: 24, position: 'sticky', top: 88, border: '1px solid var(--hairline)' }}
        >
          <h2 className="heading-sm font-display" style={{ marginBottom: 20 }}>
            Bộ lọc
          </h2>

          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Địa điểm / tìm kiếm</label>
            <input
              className="input"
              placeholder="Đà Nẵng, Hội An..."
              value={draft.search}
              onChange={(e) => setDraft((p) => ({ ...p, search: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              style={{ borderRadius: 10, height: 40, fontSize: 14 }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="form-label">
              Khoảng giá (₫/đêm)
              <span className="body-sm text-charcoal" style={{ fontWeight: 400, marginLeft: 6 }}>
                {priceMin.toLocaleString('vi-VN')}₫ – {priceMax.toLocaleString('vi-VN')}₫
              </span>
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="number"
                min={0}
                className="input"
                placeholder="Tối thiểu"
                value={draft.minPrice}
                onChange={(e) => {
                  const v = Math.max(0, Number(e.target.value));
                  setDraft((p) => ({ ...p, minPrice: v ? String(v) : '' }));
                }}
                style={{ borderRadius: 10, height: 38, fontSize: 13 }}
              />
              <input
                type="number"
                min={draft.minPrice ? Number(draft.minPrice) : 0}
                className="input"
                placeholder="Tối đa"
                value={draft.maxPrice}
                onChange={(e) => {
                  const v = Math.max(draft.minPrice ? Number(draft.minPrice) : 0, Number(e.target.value));
                  setDraft((p) => ({ ...p, maxPrice: v ? String(v) : '' }));
                }}
                style={{ borderRadius: 10, height: 38, fontSize: 13 }}
              />
            </div>
            <input
              type="range"
              min={priceMin}
              max={priceMax}
              step={Math.round((priceMax - priceMin) / 20 / 50000) * 50000 || 50000}
              value={draft.maxPrice ? Math.min(Number(draft.maxPrice), priceMax) : priceMax}
              onChange={(e) => setDraft((p) => ({ ...p, maxPrice: e.target.value }))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <p className="form-label" style={{ marginBottom: 10 }}>
              Loại phòng
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ROOM_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 body-sm" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={draft.roomTypes.includes(type)}
                    onChange={() => toggleRoomType(type)}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <p className="form-label" style={{ marginBottom: 10 }}>
              Homestay / Resort
            </p>
            <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {properties.map((p) => (
                <label key={p.id} className="flex items-center gap-2 body-sm" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={draft.propertyIds.includes(p.id)}
                    onChange={() => toggleProperty(p.id)}
                  />
                  <span style={{ lineHeight: 1.3 }}>{p.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Số khách tối thiểu</label>
            <input
              type="number"
              min={1}
              max={20}
              className="input"
              value={draft.guests}
              onChange={(e) => setDraft((p) => ({ ...p, guests: e.target.value }))}
              style={{ borderRadius: 10, height: 40, fontSize: 14 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
            <div>
              <label className="form-label">Check-in</label>
              <input
                type="date"
                className="input"
                value={draft.checkIn}
                onChange={(e) => setDraft((p) => ({ ...p, checkIn: e.target.value }))}
                style={{ borderRadius: 10, height: 38, fontSize: 13 }}
              />
            </div>
            <div>
              <label className="form-label">Check-out</label>
              <input
                type="date"
                className="input"
                value={draft.checkOut}
                min={draft.checkIn || undefined}
                onChange={(e) => setDraft((p) => ({ ...p, checkOut: e.target.value }))}
                style={{ borderRadius: 10, height: 38, fontSize: 13 }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button type="button" className="btn-primary btn-sm" onClick={() => applyFilters(true)}>
              Áp dụng
            </button>
            <button type="button" className="btn-ghost btn-sm" onClick={clearFilters}>
              Xóa bộ lọc
            </button>
          </div>
        </aside>

        <div>
          <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: 16 }}>
            <div className="flex flex-wrap gap-2">
              {activeChips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  className="badge badge-tag"
                  style={{ cursor: 'pointer', border: '1px solid var(--hairline)' }}
                  onClick={chip.onRemove}
                >
                  {chip.label} ×
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="body-sm text-charcoal">Sắp xếp:</span>
              <select
                className="select"
                value={urlSort}
                onChange={(e) => handleSortChange(e.target.value)}
                style={{ width: 'auto', paddingRight: 36, fontSize: 14, height: 38 }}
              >
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá: thấp → cao</option>
                <option value="price-desc">Giá: cao → thấp</option>
                <option value="rating">Đánh giá cao</option>
              </select>
            </div>
          </div>

          {error && (
            <div
              className="card"
              style={{
                padding: '16px 20px',
                marginBottom: 16,
                border: '1px solid var(--error)',
                background: 'rgba(234,40,4,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <p className="body-sm" style={{ color: 'var(--error)', margin: 0 }}>
                {error}
              </p>
              <button type="button" className="btn-primary btn-sm" onClick={() => loadRooms()}>
                Thử lại
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <RoomCardSkeleton key={i} />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div
              className="card"
              style={{ textAlign: 'center', padding: '64px 32px', border: '1px dashed var(--hairline)' }}
            >
              <div style={{ fontSize: 56, marginBottom: 16, lineHeight: 1 }}>🏨</div>
              <h3 className="heading-sm font-display" style={{ marginBottom: 8 }}>
                Không tìm thấy phòng phù hợp
              </h3>
              <p className="body-md text-charcoal" style={{ marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                Thử đổi địa điểm, ngày ở hoặc bỏ bớt bộ lọc để xem thêm kết quả.
              </p>
              <button type="button" className="btn-primary" onClick={clearFilters}>
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {rooms.map((room) => (
                  <RoomSearchCard key={room.id} room={room} querySuffix={detailQuerySuffix} />
                ))}
              </div>
              <Pagination page={urlPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <PublicLayout>
      <SearchResultsContent />
    </PublicLayout>
  );
}
