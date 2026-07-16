import { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import {
  getAdminComplaints,
  updateAdminComplaintStatus,
  type AdminComplaint,
} from '../../api/adminApi';
import { DataTable, StatusBadge as UIStatusBadge } from '../../components/ui';
import type { StatusVariant } from '../../components/ui/StatusBadge';
import {
  fmtDate,
  extractApiError,
  Spinner,
  ErrorBanner,
  SuccessBanner,
  Drawer,
  ConfirmModal,
  Pagination,
} from './_adminShared';

const STATUS_VI: Record<string, { label: string; variant: StatusVariant }> = {
  OPEN:          { label: 'Mở',         variant: 'danger' },
  INVESTIGATING: { label: 'Đang xử lý', variant: 'warning' },
  RESOLVED:      { label: 'Đã giải quyết', variant: 'success' },
  CLOSED:        { label: 'Đã đóng',    variant: 'neutral' },
};

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'OPEN', label: 'Mở' },
  { value: 'INVESTIGATING', label: 'Đang xử lý' },
  { value: 'RESOLVED', label: 'Đã giải quyết' },
  { value: 'CLOSED', label: 'Đã đóng' },
];

function nextStatuses(current: string): { value: string; label: string }[] {
  switch (current) {
    case 'OPEN':
      return [
        { value: 'INVESTIGATING', label: 'Đánh dấu đang xử lý' },
        { value: 'RESOLVED', label: 'Giải quyết' },
      ];
    case 'INVESTIGATING':
      return [{ value: 'RESOLVED', label: 'Giải quyết' }];
    case 'RESOLVED':
      return [{ value: 'CLOSED', label: 'Đóng khiếu nại' }];
    default:
      return [];
  }
}

function statusBadge(status: string) {
  const cfg = STATUS_VI[status] ?? { label: status, variant: 'neutral' as StatusVariant };
  return <UIStatusBadge status={cfg.label} variant={cfg.variant} />;
}

export function AdminComplaintsPage() {
  const [items, setItems] = useState<AdminComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  const [selected, setSelected] = useState<AdminComplaint | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState('');
  const [resolution, setResolution] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedKeyword(keyword.trim()), 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [keyword]);

  const load = useCallback(async (p = 0, status = '', kw = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminComplaints({
        page: p,
        size: 10,
        status: status || undefined,
        keyword: kw || undefined,
      });
      if (res.success) {
        setItems(res.data.content);
        setTotalPages(res.data.totalPages);
        setPage(p);
      } else {
        setItems([]);
        setTotalPages(0);
        setError('Không tải được danh sách khiếu nại.');
      }
    } catch (err) {
      setItems([]);
      setTotalPages(0);
      setError(extractApiError(err, 'Không tải được danh sách khiếu nại.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0, statusFilter, debouncedKeyword);
  }, [load, statusFilter, debouncedKeyword]);

  function openDrawer(c: AdminComplaint) {
    setSelected(c);
    setResolution(c.resolution || '');
    setActionMsg(null);
    setConfirmOpen(false);
    const options = nextStatuses(c.status);
    setNextStatus(options[0]?.value ?? '');
    setDrawerOpen(true);
  }

  function requestUpdate() {
    if (!selected || !nextStatus) return;
    const needsNote = nextStatus === 'RESOLVED' || nextStatus === 'CLOSED';
    if (needsNote && !resolution.trim() && !selected.resolution) {
      setActionMsg({ type: 'error', msg: 'Vui lòng nhập ghi chú giải quyết.' });
      return;
    }
    setConfirmOpen(true);
  }

  async function handleUpdateStatus() {
    if (!selected || !nextStatus) return;
    setActionLoading(true);
    setActionMsg(null);
    try {
      const res = await updateAdminComplaintStatus(selected.id, {
        status: nextStatus,
        resolution: resolution.trim() || undefined,
      });
      if (res.success && res.data) {
        setSelected(res.data);
        setActionMsg({ type: 'success', msg: res.message || 'Cập nhật trạng thái thành công.' });
        setConfirmOpen(false);
        const options = nextStatuses(res.data.status);
        setNextStatus(options[0]?.value ?? '');
        setResolution(res.data.resolution || '');
        load(page, statusFilter, debouncedKeyword);
        if (res.data.status === 'CLOSED') {
          setTimeout(() => setDrawerOpen(false), 1000);
        }
      } else {
        setActionMsg({ type: 'error', msg: 'Cập nhật thất bại.' });
        setConfirmOpen(false);
      }
    } catch (err) {
      setActionMsg({ type: 'error', msg: extractApiError(err, 'Cập nhật thất bại.') });
      setConfirmOpen(false);
    } finally {
      setActionLoading(false);
    }
  }

  const columns = [
    {
      header: 'Mã',
      accessor: (c: AdminComplaint) => (
        <span className="code-sm">{c.id.slice(0, 8).toUpperCase()}</span>
      ),
    },
    {
      header: 'Khách hàng',
      accessor: (c: AdminComplaint) => <span className="font-semibold">{c.customerName}</span>,
    },
    {
      header: 'Tiêu đề',
      accessor: (c: AdminComplaint) => (
        <span
          style={{
            maxWidth: 220,
            display: 'inline-block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 13,
          }}
          title={c.subject}
        >
          {c.subject || '—'}
        </span>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: (c: AdminComplaint) => statusBadge(c.status),
    },
    {
      header: 'Ngày gửi',
      accessor: (c: AdminComplaint) => fmtDate(c.createdAt),
    },
  ];

  const actions = [
    { label: 'Xử lý', onClick: (c: AdminComplaint) => openDrawer(c) },
  ];

  const options = selected ? nextStatuses(selected.status) : [];
  const canUpdate = options.length > 0;
  const confirmLabel =
    nextStatus === 'INVESTIGATING'
      ? 'Đánh dấu đang xử lý'
      : nextStatus === 'RESOLVED'
        ? 'Giải quyết'
        : nextStatus === 'CLOSED'
          ? 'Đóng khiếu nại'
          : 'Xác nhận';

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 26, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
            Quản lý khiếu nại
          </h1>
          <p className="body-sm text-charcoal">SCR-54 — Xem, điều tra, giải quyết và đóng khiếu nại</p>
        </div>

        {error && <ErrorBanner msg={error} />}

        <div className="card" style={{ padding: '14px 18px', marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <input
            className="input"
            placeholder="Tìm theo tiêu đề, tên hoặc email khách..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            style={{ maxWidth: 320 }}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                type="button"
                className={statusFilter === f.value ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <p className="body-md text-charcoal" style={{ marginBottom: 16 }}>Không tải được danh sách khiếu nại.</p>
            <button type="button" className="btn-primary" onClick={() => load(page, statusFilter, debouncedKeyword)}>
              Thử lại
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <p className="body-md text-charcoal">Không có khiếu nại phù hợp.</p>
          </div>
        ) : (
          <>
            <DataTable columns={columns} data={items} keyExtractor={c => c.id} actions={actions} />
            <Pagination page={page} totalPages={totalPages} onPage={p => load(p, statusFilter, debouncedKeyword)} />
          </>
        )}

        <Drawer
          open={drawerOpen}
          onClose={() => { setDrawerOpen(false); setSelected(null); setConfirmOpen(false); }}
          title="Chi tiết khiếu nại"
        >
          {selected && (
            <div>
              {actionMsg && (actionMsg.type === 'success'
                ? <SuccessBanner msg={actionMsg.msg} />
                : <ErrorBanner msg={actionMsg.msg} />)}

              <div style={{ marginBottom: 20 }}>
                {[
                  { label: 'Mã', value: selected.id.slice(0, 8).toUpperCase() },
                  { label: 'Khách hàng', value: selected.customerName },
                  { label: 'Trạng thái', value: statusBadge(selected.status) },
                  { label: 'Ngày gửi', value: fmtDate(selected.createdAt) },
                  ...(selected.resolvedAt
                    ? [{ label: 'Giải quyết lúc', value: fmtDate(selected.resolvedAt) }]
                    : []),
                ].map(r => (
                  <div
                    key={r.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid var(--hairline)',
                    }}
                  >
                    <span className="body-sm text-charcoal">{r.label}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{r.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 16, padding: 12, background: 'var(--surface-bone)', borderRadius: 8 }}>
                <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Tiêu đề</p>
                <p className="body-sm" style={{ marginBottom: 12 }}>{selected.subject || '—'}</p>
                <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Mô tả</p>
                <p className="body-sm" style={{ whiteSpace: 'pre-wrap' }}>{selected.description || '—'}</p>
              </div>

              {selected.resolution && (
                <div style={{ marginBottom: 16, padding: 12, border: '1px solid var(--hairline)', borderRadius: 8 }}>
                  <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Ghi chú giải quyết</p>
                  <p className="body-sm" style={{ whiteSpace: 'pre-wrap' }}>{selected.resolution}</p>
                </div>
              )}

              {canUpdate && (
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label" htmlFor="complaint-next-status">Cập nhật trạng thái</label>
                  <select
                    id="complaint-next-status"
                    className="input"
                    value={nextStatus}
                    onChange={e => setNextStatus(e.target.value)}
                    style={{ marginBottom: 12 }}
                  >
                    {options.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>

                  {(nextStatus === 'RESOLVED' || nextStatus === 'CLOSED' || nextStatus === 'INVESTIGATING') && (
                    <>
                      <label
                        className={`form-label ${nextStatus === 'RESOLVED' || nextStatus === 'CLOSED' ? 'form-label-required' : ''}`}
                        htmlFor="complaint-resolution"
                      >
                        Ghi chú giải quyết
                      </label>
                      <textarea
                        id="complaint-resolution"
                        className="textarea"
                        rows={4}
                        placeholder="Nhập hướng giải quyết..."
                        value={resolution}
                        onChange={e => setResolution(e.target.value)}
                      />
                    </>
                  )}

                  <button
                    type="button"
                    className="btn-primary"
                    style={{ marginTop: 10, width: '100%' }}
                    disabled={actionLoading || !nextStatus}
                    onClick={requestUpdate}
                  >
                    {actionLoading ? 'Đang xử lý...' : confirmLabel}
                  </button>
                </div>
              )}
            </div>
          )}
        </Drawer>

        <ConfirmModal
          open={confirmOpen}
          title="Xác nhận cập nhật"
          message={`Bạn có chắc muốn ${confirmLabel.toLowerCase()} khiếu nại này?`}
          confirmLabel={actionLoading ? 'Đang xử lý...' : 'Xác nhận'}
          danger={nextStatus === 'CLOSED'}
          onConfirm={handleUpdateStatus}
          onCancel={() => setConfirmOpen(false)}
        />
      </div>
    </AdminLayout>
  );
}
