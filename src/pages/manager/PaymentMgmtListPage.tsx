import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import Alert from '../../components/ui/Alert';
import { DataTable, StatusBadge } from '../../components/ui';
import type { StatusVariant } from '../../components/ui/StatusBadge';
import {
  fetchManagerPaymentsV1,
  type PaymentSummaryResponse,
} from '../../api/paymentApi';
import { managerApi } from '../../api/managerApi';
import type { AssignedProperty } from '../../api/reportApi';

type TabKey = 'ALL' | 'PENDING' | 'PAID';

const STATUS_VI: Record<string, { label: string; variant: StatusVariant }> = {
  PENDING:  { label: 'Chờ xác minh', variant: 'warning' },
  PAID:     { label: 'Đã thanh toán', variant: 'success' },
  FAILED:   { label: 'Thất bại', variant: 'danger' },
  REFUNDED: { label: 'Đã hoàn', variant: 'info' },
};

const TYPE_VI: Record<string, string> = {
  DEPOSIT: 'Đặt cọc',
  REMAINING_BALANCE: 'Phần còn lại',
  DAMAGE_FEE: 'Phí thiệt hại',
};

const METHOD_VI: Record<string, string> = {
  VNPAY: 'VNPay',
  BANK_TRANSFER: 'Chuyển khoản',
  CASH: 'Tiền mặt',
};

const TABS: { key: TabKey; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ xác minh' },
  { key: 'PAID', label: 'Hoàn tất' },
];

const PAGE_SIZE = 10;

function formatVnd(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
}

function formatDateTime(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shortTxnId(id: string): string {
  return `TXN-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

function shortBookingId(id: string): string {
  return `BK-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center gap-2 mt-6">
      <button
        type="button"
        className="px-3 py-1.5 text-sm border border-[#E2E8F0] rounded-md disabled:opacity-40"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
      >
        ←
      </button>
      <span className="px-3 py-1.5 text-sm text-[#64748B]">
        Trang {page + 1} / {totalPages}
      </span>
      <button
        type="button"
        className="px-3 py-1.5 text-sm border border-[#E2E8F0] rounded-md disabled:opacity-40"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
      >
        →
      </button>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 bg-[#F1F5F9] rounded animate-pulse" />
      ))}
    </div>
  );
}

export default function PaymentMgmtListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initSearch = searchParams.get('bookingId') ?? '';

  const [properties, setProperties] = useState<AssignedProperty[]>([]);
  const [propLoading, setPropLoading] = useState(true);
  const [propError, setPropError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [search, setSearch] = useState(initSearch);
  const [selectedPropertyId, setPropertyId] = useState('');
  const [selectedType, setType] = useState('');
  const [selectedMethod, setMethod] = useState('');
  const [page, setPage] = useState(0);

  const [payments, setPayments] = useState<PaymentSummaryResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setPropLoading(true);
    managerApi.getMyAssignedProperties()
      .then(res => {
        if (res.success && res.data) setProperties(res.data);
      })
      .catch(() => setPropError('Không thể tải danh sách homestay.'))
      .finally(() => setPropLoading(false));
  }, []);

  const loadPayments = useCallback((
    pg: number,
    tab: TabKey,
    srch: string,
    propId: string,
    pType: string,
    pMethod: string,
  ) => {
    setLoading(true);
    setError(null);
    fetchManagerPaymentsV1({
      page: pg,
      size: PAGE_SIZE,
      search: srch || undefined,
      propertyId: propId || undefined,
      status: tab === 'ALL' ? undefined : tab,
      type: pType || undefined,
      method: pMethod || undefined,
      sort: 'createdAt,desc',
    })
      .then(data => {
        setPayments(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      })
      .catch((err: unknown) => {
        const ax = err as { response?: { status?: number; data?: { message?: string } } };
        if (ax?.response?.status === 403) {
          setError('Bạn không có quyền xem homestay này.');
        } else {
          setError(ax?.response?.data?.message ?? 'Không thể tải danh sách thanh toán.');
        }
        setPayments([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      loadPayments(0, activeTab, search, selectedPropertyId, selectedType, selectedMethod);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [activeTab, search, selectedPropertyId, selectedType, selectedMethod, loadPayments]);

  function handlePageChange(newPage: number) {
    setPage(newPage);
    loadPayments(newPage, activeTab, search, selectedPropertyId, selectedType, selectedMethod);
  }

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    setPage(0);
  }

  const columns = [
    {
      header: 'Ngày',
      accessor: (p: PaymentSummaryResponse) => (
        <span className="text-sm text-[#334155]">{formatDateTime(p.createdAt)}</span>
      ),
    },
    {
      header: 'Mã giao dịch',
      accessor: (p: PaymentSummaryResponse) => (
        <span className="font-mono text-sm" title={p.id}>{shortTxnId(p.id)}</span>
      ),
    },
    {
      header: 'Mã đặt phòng',
      accessor: (p: PaymentSummaryResponse) => (
        <Link
          to={`/manager/bookings/${p.bookingId}`}
          className="font-mono text-sm text-[#0F766E] no-underline hover:underline"
          title={p.bookingId}
        >
          {shortBookingId(p.bookingId)}
        </Link>
      ),
    },
    {
      header: 'Số tiền',
      accessor: (p: PaymentSummaryResponse) => (
        <span className="font-semibold text-[#1E293B]">{formatVnd(p.amount)}</span>
      ),
    },
    {
      header: 'Phương thức',
      accessor: (p: PaymentSummaryResponse) => (
        <span className="text-sm text-[#334155]">{METHOD_VI[p.method] ?? p.method}</span>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: (p: PaymentSummaryResponse) => {
        const cfg = STATUS_VI[p.status] ?? { label: p.status, variant: 'neutral' as StatusVariant };
        return <StatusBadge status={cfg.label} variant={cfg.variant} />;
      },
    },
    {
      header: 'Thao tác',
      accessor: (p: PaymentSummaryResponse) => (
        <div className="flex gap-2 justify-end">
          {p.status === 'PENDING' && (p.method === 'BANK_TRANSFER' || p.method === 'CASH') && (
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={() => navigate(`/manager/payments/${p.id}/verify`)}
            >
              Xác minh
            </button>
          )}
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => navigate(`/manager/payments/${p.id}`)}
          >
            Xem
          </button>
        </div>
      ),
      className: 'text-right',
    },
  ];

  const showEmptyAssigned = !propLoading && properties.length === 0;

  return (
    <ManagerLayout>
      <div className="space-y-6">
        <h1 className="font-display text-[28px] font-bold text-[#1E293B]">
          Quản lý thanh toán
        </h1>

        {propError && <Alert variant="error" message={propError} />}
        {error && <Alert variant="error" message={error} closeable onClose={() => setError(null)} />}

        {showEmptyAssigned && (
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-10 text-center">
            <p className="text-[#64748B]">Bạn chưa được gán homestay nào.</p>
          </div>
        )}

        {!showEmptyAssigned && (
          <>
            <div className="flex flex-wrap gap-2 border-b border-[#E2E8F0]">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    activeTab === tab.key
                      ? 'border-[#0F766E] text-[#0F766E]'
                      : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs text-[#64748B] mb-1">Tìm kiếm</label>
                  <input
                    className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm"
                    placeholder="Mã giao dịch, mã đặt phòng, tên khách…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>

                <div className="min-w-[160px]">
                  <label className="block text-xs text-[#64748B] mb-1">Homestay</label>
                  <select
                    className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm bg-white"
                    value={selectedPropertyId}
                    onChange={e => setPropertyId(e.target.value)}
                    disabled={propLoading}
                  >
                    <option value="">Tất cả homestay</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="min-w-[140px]">
                  <label className="block text-xs text-[#64748B] mb-1">Loại</label>
                  <select
                    className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm bg-white"
                    value={selectedType}
                    onChange={e => setType(e.target.value)}
                  >
                    <option value="">Tất cả</option>
                    {Object.entries(TYPE_VI).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                <div className="min-w-[140px]">
                  <label className="block text-xs text-[#64748B] mb-1">Phương thức</label>
                  <select
                    className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm bg-white"
                    value={selectedMethod}
                    onChange={e => setMethod(e.target.value)}
                  >
                    <option value="">Tất cả</option>
                    {Object.entries(METHOD_VI).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[16px] border border-[#E2E8F0]">
              {loading ? (
                <TableSkeleton />
              ) : payments.length === 0 ? (
                <div className="p-10 text-center text-[#64748B]">
                  Không có giao dịch nào phù hợp.
                </div>
              ) : (
                <>
                  <p className="px-4 pt-3 text-xs text-[#64748B]">
                    {totalElements} giao dịch
                  </p>
                  <DataTable
                    columns={columns}
                    data={payments}
                    keyExtractor={p => p.id}
                    getRowClassName={p => (
                      p.status === 'PENDING' ? 'font-semibold bg-amber-50/60' : ''
                    )}
                  />
                </>
              )}
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
          </>
        )}
      </div>
    </ManagerLayout>
  );
}
