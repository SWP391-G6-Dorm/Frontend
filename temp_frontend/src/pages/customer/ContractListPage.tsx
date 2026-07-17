// SCR-21 — My Contract List
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import CustomerLayout from '../../layouts/CustomerLayout';
import Alert from '../../components/ui/Alert';
import { Drawer } from '../../components/ui/Drawer';
import { contractApi, ContractSummaryResponse } from '../../api/contractApi';

const STATUS_CONFIG: Record<string, { cls: string; label: string }> = {
  ACTIVE:    { cls: 'badge-success', label: 'Đang hiệu lực' },
  COMPLETED: { cls: 'badge-neutral', label: 'Hoàn thành' },
  CANCELLED: { cls: 'badge-error',   label: 'Đã hủy' },
};

const TABS = ['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const;
const PAGE_SIZE = 10;

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { cls: 'badge-neutral', label: status };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function TableSkeleton() {
  return (
    <div className="table-wrap card">
      <table className="data-table">
        <thead>
          <tr>
            <th>Mã HĐ</th>
            <th>Mã đặt phòng</th>
            <th>Phòng</th>
            <th>Ngày tạo</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3].map(i => (
            <tr key={i}>
              {Array.from({ length: 6 }).map((_, j) => (
                <td key={j}>
                  <div className="h-4 rounded bg-[var(--surface-bone)] animate-pulse" style={{ width: j === 2 ? '80%' : '60%' }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContractPdfDrawer({
  contract,
  onClose,
}: {
  contract: ContractSummaryResponse;
  onClose: () => void;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const blobRef = useRef<string | null>(null);

  const shortId = contract.id.slice(0, 8).toUpperCase();
  const filename = `contract-${shortId}.pdf`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setBlobUrl(null);

    contractApi.getContractPdfBlob(contract.id)
      .then(blob => {
        if (cancelled) return;
        const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        blobRef.current = url;
        setBlobUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError('Không thể tải PDF. Vui lòng tải xuống trực tiếp.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
        blobRef.current = null;
      }
    };
  }, [contract.id]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await contractApi.downloadContractPdf(contract.id, filename);
    } catch {
      setError('Tải xuống thất bại. Vui lòng thử lại.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={`Hợp đồng ${shortId}`}
      width="max-w-3xl lg:max-w-4xl max-w-full"
      footer={
        <div className="flex gap-3 justify-end">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Đóng
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? 'Đang tải...' : 'Tải xuống'}
          </button>
        </div>
      }
    >
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-charcoal body-md">
          <div className="w-10 h-10 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-4" />
          Đang tải PDF...
        </div>
      )}

      {error && !loading && (
        <div className="space-y-4">
          <Alert variant="error" message={error} />
          <button type="button" className="btn-outline" onClick={handleDownload} disabled={downloading}>
            Tải PDF
          </button>
        </div>
      )}

      {blobUrl && !loading && !error && (
        <iframe
          src={blobUrl}
          title={`Hợp đồng ${shortId}`}
          className="w-full border-0 rounded-lg"
          style={{ minHeight: '70vh' }}
        />
      )}
    </Drawer>
  );
}

export default function ContractListPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedContract, setSelectedContract] = useState<ContractSummaryResponse | null>(null);

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

  const openPdfDrawer = (contract: ContractSummaryResponse, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedContract(contract);
  };

  return (
    <CustomerLayout>
      <div className="mb-5">
        <h1 className="heading-md mb-1">Hợp đồng của tôi</h1>
        <p className="body-sm text-charcoal">
          Danh sách hợp đồng thuê phòng được tạo tự động sau khi thanh toán đặt cọc.
        </p>
      </div>

      <div className="flex gap-3 flex-wrap mb-4 items-center">
        <div className="relative flex-1 min-w-[240px] max-w-[360px]">
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="var(--ash)" strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="contract-search"
            type="text"
            placeholder="Tìm theo tên phòng, cơ sở..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full py-2 pl-9 pr-9 text-sm border border-[var(--hairline)] rounded-lg bg-[var(--surface-card)] text-[var(--ink)] outline-none focus:border-[var(--primary)]"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ash)] bg-transparent border-0 cursor-pointer text-base"
              title="Xóa tìm kiếm"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex gap-1 flex-wrap p-1 bg-[var(--surface-bone)] rounded-full w-fit">
          {TABS.map(tab => (
            <button
              key={tab}
              type="button"
              id={`contract-tab-${tab.toLowerCase()}`}
              className={`tab-pill ${statusFilter === tab ? 'active' : ''}`}
              onClick={() => handleTabChange(tab)}
            >
              {tab === 'ALL' ? 'Tất cả' : STATUS_CONFIG[tab]?.label ?? tab}
            </button>
          ))}
        </div>
      </div>

      {search && (
        <div className="mb-3 flex items-center gap-2">
          <span className="body-sm text-charcoal">
            Kết quả tìm kiếm: <strong>&quot;{search}&quot;</strong>
          </span>
          <button type="button" onClick={handleClearSearch} className="btn-ghost btn-sm text-xs px-2 py-0.5">
            Xóa bộ lọc
          </button>
        </div>
      )}

      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <div className="card p-8 max-w-lg mx-auto space-y-4">
          <Alert variant="error" message="Không thể tải danh sách hợp đồng. Vui lòng thử lại." />
          <button type="button" className="btn-primary" onClick={() => refetch()}>
            Thử lại
          </button>
        </div>
      ) : contracts.length === 0 ? (
        <div className="card text-center py-16 px-6">
          <div className="text-5xl mb-4">📄</div>
          <h3 className="heading-sm mb-2">
            {statusFilter === 'ALL' ? 'Chưa có hợp đồng' : `Không có hợp đồng "${STATUS_CONFIG[statusFilter]?.label}"`}
          </h3>
          <p className="body-md text-charcoal mb-5">
            {statusFilter === 'ALL'
              ? 'Hợp đồng sẽ được tạo tự động sau khi xác nhận thanh toán đặt cọc.'
              : 'Thử chọn tab khác để xem hợp đồng.'}
          </p>
          <Link to="/customer/bookings" className="btn-outline">
            Xem đặt phòng
          </Link>
        </div>
      ) : (
        <>
          <p className="body-sm text-charcoal mb-3">{totalElements} hợp đồng</p>

          <div className="table-wrap card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã HĐ</th>
                  <th>Mã đặt phòng</th>
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
                    className="cursor-pointer hover:bg-[var(--surface-bone)]"
                    onClick={() => openPdfDrawer(contract)}
                  >
                    <td>
                      <span className="code-md font-semibold">
                        {contract.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <Link
                        to={`/customer/bookings/${contract.bookingId}`}
                        className="text-primary font-semibold no-underline hover:underline"
                      >
                        {contract.bookingId.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td>
                      <span className="font-medium">{contract.roomNumber}</span>
                      <span className="body-sm text-charcoal block">{contract.propertyName}</span>
                    </td>
                    <td className="text-charcoal body-sm whitespace-nowrap">
                      {formatDateTime(contract.generatedAt)}
                    </td>
                    <td>
                      <StatusBadge status={contract.status} />
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn-outline btn-sm"
                        onClick={e => openPdfDrawer(contract, e)}
                      >
                        Xem PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
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
                type="button"
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

      {selectedContract && (
        <ContractPdfDrawer
          contract={selectedContract}
          onClose={() => setSelectedContract(null)}
        />
      )}
    </CustomerLayout>
  );
}
