// SCR-21 — My Contract List
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import CustomerLayout from '../../layouts/CustomerLayout';
import Alert from '../../components/ui/Alert';
import { contractApi, ContractSummaryResponse } from '../../api/contractApi';

const STATUS_CONFIG: Record<string, { cls: string; label: string }> = {
  ACTIVE:    { cls: 'badge-success', label: 'Đang hiệu lực' },
  COMPLETED: { cls: 'badge-neutral', label: 'Hoàn thành' },
  CANCELLED: { cls: 'badge-error',   label: 'Đã hủy' },
};

const TABS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'ACTIVE', label: 'Đang hiệu lực' },
  { key: 'COMPLETED', label: 'Hoàn thành' },
  { key: 'CANCELLED', label: 'Đã hủy' },
] as const;

const PAGE_SIZE = 10;

function roomLabel(c: ContractSummaryResponse) {
  return c.roomName || c.roomNumber || '—';
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { cls: 'badge-neutral', label: status };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function DocumentIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

export default function ContractListPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

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

  return (
    <CustomerLayout>
      <header className="mb-6">
        <h1 className="heading-md mb-1">My Contracts</h1>
        <p className="body-sm text-[var(--charcoal)]">
          Hợp đồng thuê phòng được tạo sau khi xác nhận đặt cọc.
        </p>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div className="flex gap-1 flex-wrap p-1 bg-[var(--surface-bone)] rounded-full w-fit">
          {TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              className={`tab-pill ${statusFilter === tab.key ? 'active' : ''}`}
              onClick={() => { setStatusFilter(tab.key); setPage(0); }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-[280px]">
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="var(--ash)" strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Tìm phòng, cơ sở..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full h-11 pl-9 pr-3 text-sm rounded-lg border border-[var(--hairline)] bg-[var(--surface-card)] text-[var(--ink)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 w-24 rounded bg-[var(--surface-bone)] mb-3" />
              <div className="h-5 w-2/3 rounded bg-[var(--surface-bone)] mb-2" />
              <div className="h-4 w-1/2 rounded bg-[var(--surface-bone)]" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="card p-8 max-w-md mx-auto text-center space-y-4">
          <Alert variant="error" message="Không thể tải danh sách hợp đồng." />
          <button type="button" className="btn-primary" onClick={() => refetch()}>Thử lại</button>
        </div>
      ) : contracts.length === 0 ? (
        <div className="card text-center py-16 px-6">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
            <DocumentIcon />
          </div>
          <h3 className="heading-sm mb-2">
            {statusFilter === 'ALL'
              ? 'Chưa có hợp đồng'
              : `Không có hợp đồng “${STATUS_CONFIG[statusFilter]?.label}”`}
          </h3>
          <p className="body-md text-[var(--charcoal)] mb-6 max-w-sm mx-auto">
            {statusFilter === 'ALL'
              ? 'Hợp đồng sẽ xuất hiện tại đây sau khi thanh toán đặt cọc thành công.'
              : 'Thử chọn tab khác hoặc xóa bộ lọc tìm kiếm.'}
          </p>
          <Link to="/customer/bookings" className="btn-outline">Xem đặt phòng</Link>
        </div>
      ) : (
        <>
          <p className="body-sm text-[var(--charcoal)] mb-3">
            {totalElements} hợp đồng
            {search ? <> · kết quả “<strong>{search}</strong>”</> : null}
          </p>

          <div className="hidden md:block table-wrap card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã HĐ</th>
                  <th>Booking</th>
                  <th>Phòng</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map(contract => (
                  <tr
                    key={contract.id}
                    className="cursor-pointer hover:bg-[var(--surface-bone)] transition-colors"
                    onClick={() => navigate(`/customer/contracts/${contract.id}`)}
                  >
                    <td className="align-middle">
                      <span className="code-md font-semibold text-[var(--ink)]">
                        {shortId(contract.id)}
                      </span>
                    </td>
                    <td className="align-middle" onClick={e => e.stopPropagation()}>
                      <Link
                        to={`/customer/bookings/${contract.bookingId}`}
                        className="code-md text-[var(--primary)] font-semibold no-underline hover:underline"
                      >
                        {shortId(contract.bookingId)}
                      </Link>
                    </td>
                    <td className="align-middle">
                      <span className="font-medium text-[var(--ink)]">{roomLabel(contract)}</span>
                      <span className="body-sm text-[var(--charcoal)] block">{contract.propertyName}</span>
                    </td>
                    <td className="align-middle body-sm text-[var(--charcoal)] whitespace-nowrap">
                      {formatDate(contract.generatedAt)}
                    </td>
                    <td className="align-middle"><StatusBadge status={contract.status} /></td>
                    <td className="align-middle whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <Link
                        to={`/customer/contracts/${contract.id}`}
                        className="btn-outline btn-sm no-underline inline-flex"
                        onClick={e => e.stopPropagation()}
                      >
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {contracts.map(contract => (
              <article
                key={contract.id}
                className="card p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="code-md font-semibold text-[var(--ink)]">{shortId(contract.id)}</p>
                    <p className="body-sm text-[var(--charcoal)] mt-0.5">{formatDate(contract.generatedAt)}</p>
                  </div>
                  <StatusBadge status={contract.status} />
                </div>
                <p className="font-semibold text-[var(--ink)] mb-0.5">{roomLabel(contract)}</p>
                <p className="body-sm text-[var(--charcoal)] mb-4">{contract.propertyName}</p>
                <div className="flex justify-end">
                  <Link
                    to={`/customer/contracts/${contract.id}`}
                    className="btn-outline btn-sm no-underline inline-flex"
                  >
                    Chi tiết
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                className="btn-outline btn-sm"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                Trước
              </button>
              <span className="body-sm text-[var(--charcoal)]">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                className="btn-outline btn-sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                Tiếp
              </button>
            </div>
          )}
        </>
      )}
    </CustomerLayout>
  );
}
