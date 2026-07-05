// SCR-25 — My Contract List
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import CustomerLayout from '../../layouts/CustomerLayout';
import { contractApi, ContractSummaryResponse } from '../../api/contractApi';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { cls: string; label: string }> = {
  ACTIVE:    { cls: 'badge-success', label: 'Active' },
  COMPLETED: { cls: 'badge-purple',  label: 'Completed' },
  CANCELLED: { cls: 'badge-error',   label: 'Cancelled' },
};

const TABS = ['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const;
const PAGE_SIZE = 10;

// ── Sub-components ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { cls: 'badge-neutral', label: status };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

function ContractCardSkeleton() {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ width: 44, height: 44, background: 'var(--surface-bone)', borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 16, width: '40%', background: 'var(--surface-bone)', borderRadius: 8 }} />
          <div style={{ height: 13, width: '65%', background: 'var(--surface-bone)', borderRadius: 8 }} />
          <div style={{ height: 13, width: '50%', background: 'var(--surface-bone)', borderRadius: 8 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ height: 16, width: 100, background: 'var(--surface-bone)', borderRadius: 8 }} />
          <div style={{ height: 13, width: 80, background: 'var(--surface-bone)', borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
}

function ContractCard({ contract }: { contract: ContractSummaryResponse }) {
  const [downloading, setDownloading] = useState(false);

  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(contract.checkOutDate).getTime() - new Date(contract.checkInDate).getTime()) / 86400000
    )
  );

  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (downloading) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await contractApi.downloadContractPdf(
        contract.id,
        `contract-${contract.id.slice(0, 8)}.pdf`
      );
    } catch {
      setDownloadError('Failed to download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="card" style={{ padding: 20, transition: 'box-shadow 0.15s' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>

        {/* Icon */}
        <div style={{
          width: 44, height: 44,
          background: 'var(--surface-bone)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontSize: 20,
        }}>
          📄
        </div>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 4, flexWrap: 'wrap' }}>
            <span className="code-md" style={{ fontWeight: 700, fontSize: 14 }}>
              {contract.id.slice(0, 8).toUpperCase()}
            </span>
            <StatusBadge status={contract.status} />
          </div>

          <p className="body-sm" style={{ fontWeight: 600, marginBottom: 3 }}>
            {contract.roomNumber} · {contract.propertyName}
          </p>

          <p className="body-sm text-charcoal" style={{ marginBottom: 3 }}>
            📅 {new Date(contract.checkInDate).toLocaleDateString('vi-VN')}
            {' → '}
            {new Date(contract.checkOutDate).toLocaleDateString('vi-VN')}
            <span style={{ marginLeft: 6, color: 'var(--ash)' }}>({nights} đêm)</span>
          </p>

          <p className="body-sm text-charcoal">
            Tạo ngày {new Date(contract.generatedAt).toLocaleDateString('vi-VN', {
              day: '2-digit', month: '2-digit', year: 'numeric',
            })}
            {contract.sentAt && (
              <span style={{ marginLeft: 6, color: 'var(--ash)' }}>
                · Đã gửi email
              </span>
            )}
          </p>
        </div>

        {/* Amount + Actions */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p className="body-sm text-charcoal" style={{ marginBottom: 2 }}>
            Đặt cọc: <strong>₫{contract.depositAmount.toLocaleString('vi-VN')}</strong>
          </p>
          <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary)', marginBottom: 10 }}>
            ₫{contract.totalAmount.toLocaleString('vi-VN')}
          </p>

          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <Link
              to={`/customer/contracts/${contract.id}`}
              className="btn-ghost btn-sm"
            >
              Xem chi tiết
            </Link>
            <button
              className="btn-outline btn-sm"
              onClick={handleDownload}
              disabled={downloading}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {downloading ? (
                <span style={{ fontSize: 12 }}>Đang tải...</span>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  PDF
                </>
              )}
            </button>
          </div>
          {downloadError && (
            <p className="form-error" style={{ marginTop: 6, textAlign: 'right' }}>{downloadError}</p>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ContractListPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Debounce search 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my_contracts', page, statusFilter, search],
    queryFn: () =>
      contractApi.getMyContracts({
        page,
        size: PAGE_SIZE,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: search || undefined,
        sort: 'generatedAt,desc',
      }),
  });

  const contracts = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;
  const totalElements = data?.data?.totalElements ?? 0;

  const handleTabChange = (tab: string) => {
    setStatusFilter(tab);
    setPage(0);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(0);
  };

  return (
    <CustomerLayout>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: 20 }}>
        <h1 className="heading-md" style={{ marginBottom: 4 }}>Hợp đồng của tôi</h1>
        <p className="body-sm text-charcoal">
          Danh sách hợp đồng thuê phòng được tạo tự động sau khi thanh toán đặt cọc.
        </p>
      </div>

      {/* ── Search + Filter row ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        {/* Search input */}
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 360 }}>
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="var(--ash)" strokeWidth="2"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            id="contract-search"
            type="text"
            placeholder="Tìm theo tên phòng, cơ sở..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 36px 8px 36px',
              border: '1.5px solid var(--hairline)',
              borderRadius: 8,
              background: 'var(--surface-card)',
              fontSize: 13,
              color: 'var(--ink)',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--hairline)')}
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--ash)', fontSize: 16, lineHeight: 1, padding: 2,
              }}
              title="Xóa tìm kiếm"
            >
              ×
            </button>
          )}
        </div>

        {/* Status tabs */}
        <div style={{
          display: 'flex', gap: 4, flexWrap: 'wrap',
          padding: '4px',
          background: 'var(--surface-bone)',
          borderRadius: 9999,
          width: 'fit-content',
        }}>
          {TABS.map(tab => (
            <button
              key={tab}
              id={`contract-tab-${tab.toLowerCase()}`}
              className={`tab-pill ${statusFilter === tab ? 'active' : ''}`}
              onClick={() => handleTabChange(tab)}
            >
              {tab === 'ALL' ? 'Tất cả' : STATUS_CONFIG[tab]?.label ?? tab}
            </button>
          ))}
        </div>
      </div>

      {/* Active search indicator */}
      {search && (
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="body-sm text-charcoal">
            Kết quả tìm kiếm: <strong>"{search}"</strong>
          </span>
          <button
            onClick={handleClearSearch}
            className="btn-ghost btn-sm"
            style={{ padding: '2px 8px', fontSize: 12 }}
          >
            Xóa bộ lọc
          </button>
        </div>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        /* Loading skeleton */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => <ContractCardSkeleton key={i} />)}
        </div>

      ) : isError ? (
        /* Error state */
        <div style={{
          textAlign: 'center', padding: 60,
          background: 'var(--surface-card)',
          borderRadius: 16, border: '1px solid var(--hairline)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h3 className="heading-sm" style={{ marginBottom: 8, color: 'var(--error)' }}>
            Không thể tải danh sách hợp đồng
          </h3>
          <p className="body-md text-charcoal" style={{ marginBottom: 20 }}>
            Đã xảy ra lỗi khi kết nối. Vui lòng thử lại.
          </p>
          <button className="btn-primary" onClick={() => refetch()}>
            Thử lại
          </button>
        </div>

      ) : contracts.length === 0 ? (
        /* Empty state */
        <div style={{
          textAlign: 'center', padding: '60px 24px',
          background: 'var(--surface-card)',
          borderRadius: 16, border: '1px solid var(--hairline)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <h3 className="heading-sm" style={{ marginBottom: 8 }}>
            {statusFilter === 'ALL' ? 'Chưa có hợp đồng' : `Không có hợp đồng "${STATUS_CONFIG[statusFilter]?.label}"`}
          </h3>
          <p className="body-md text-charcoal" style={{ marginBottom: 20 }}>
            {statusFilter === 'ALL'
              ? 'Hợp đồng sẽ được tạo tự động sau khi xác nhận thanh toán đặt cọc.'
              : 'Thử chọn tab khác để xem hợp đồng.'}
          </p>
          <Link to="/customer/bookings" className="btn-outline">
            Xem đặt phòng
          </Link>
        </div>

      ) : (
        /* Contract list */
        <>
          <p className="body-sm text-charcoal" style={{ marginBottom: 12 }}>
            {totalElements} hợp đồng
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {contracts.map(contract => (
              <ContractCard key={contract.id} contract={contract} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 12, marginTop: 24,
            }}>
              <button
                id="contract-list-prev"
                className="btn-outline btn-sm"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                ← Trước
              </button>
              <span className="body-sm text-charcoal">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                id="contract-list-next"
                className="btn-outline btn-sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                Tiếp →
              </button>
            </div>
          )}
        </>
      )}
    </CustomerLayout>
  );
}
