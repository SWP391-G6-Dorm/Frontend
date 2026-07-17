import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import {
  getEscalatedDamageReports, coApproveDamageReport,
  type AdminDamageReport,
} from '../../api/adminApi';
import { DataTable } from '../../components/ui';
import { fmtVnd, fmtDate, extractApiError, Spinner, ErrorBanner, SuccessBanner, StatusBadge, Drawer, ConfirmModal, Pagination } from './_adminShared';

const ESCALATION_THRESHOLD = 5_000_000;

function photoSrc(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  return url.startsWith('/') ? url : `/${url}`;
}

export function DamageEscalationPage() {
  const [items, setItems] = useState<AdminDamageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selected, setSelected] = useState<AdminDamageReport | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [feeInput, setFeeInput] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveMsg, setApproveMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEscalatedDamageReports({ page: p, size: 10 });
      if (res.success) {
        setItems(res.data.content);
        setTotalPages(res.data.totalPages);
        setPage(p);
      }
    } catch (err) {
      setError(extractApiError(err, 'Không tải được danh sách.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(0); }, [load]);

  function openDrawer(item: AdminDamageReport) {
    const defaultFee = item.approvedAmount != null ? item.approvedAmount : item.totalFee;
    setSelected(item);
    setFeeInput(String(defaultFee ?? ''));
    setAdminNote('');
    setApproveMsg(null);
    setDrawerOpen(true);
  }

  const columns = [
    {
      header: 'Property',
      accessor: (item: AdminDamageReport) => (
        <span style={{ fontWeight: 600 }}>{item.propertyName}</span>
      ),
    },
    { header: 'Room', accessor: (item: AdminDamageReport) => item.roomName },
    {
      header: 'Est. Cost',
      accessor: (item: AdminDamageReport) => (
        <span style={{ fontWeight: 700, color: '#dc2626' }}>{fmtVnd(item.totalFee)}</span>
      ),
    },
    {
      header: 'Manager Note',
      accessor: (item: AdminDamageReport) => (
        <span className="body-sm" style={{ display: 'block', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.managerNote?.trim() || '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (item: AdminDamageReport) => <StatusBadge status={item.status} />,
    },
  ];

  const actions = [
    { label: 'Xem & Duyệt', onClick: (item: AdminDamageReport) => openDrawer(item) },
  ];

  async function handleCoApprove() {
    if (!selected) return;
    const fee = parseFloat(feeInput.replace(/[^0-9.]/g, ''));
    if (isNaN(fee) || fee <= 0) {
      setApproveMsg({ type: 'error', msg: 'Vui lòng nhập phí hợp lệ (> 0).' });
      return;
    }
    setApproveLoading(true);
    setApproveMsg(null);
    setConfirmOpen(false);
    try {
      const res = await coApproveDamageReport(selected.id, {
        approvedFee: fee,
        note: adminNote.trim() || undefined,
      });
      if (res.success) {
        setApproveMsg({ type: 'success', msg: 'Co-approve thành công — phí đã gắn vào booking.' });
        setItems(prev => prev.filter(i => i.id !== selected.id));
        await load(page);
        setTimeout(() => {
          setDrawerOpen(false);
          setSelected(null);
        }, 1000);
      } else {
        setApproveMsg({ type: 'error', msg: 'Co-approve thất bại.' });
      }
    } catch (err) {
      setApproveMsg({ type: 'error', msg: extractApiError(err, 'Co-approve thất bại.') });
    } finally {
      setApproveLoading(false);
    }
  }

  const parsedFee = parseFloat(feeInput.replace(/[^0-9.]/g, '')) || 0;
  const photos = selected?.attachments?.filter(a => !a.type || a.type === 'IMAGE') ?? [];

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 26, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
            Escalated Damages
          </h1>
          <p className="body-sm text-charcoal">
            SCR-53 — Báo cáo hư hại &gt; {fmtVnd(ESCALATION_THRESHOLD)} cần Admin đồng phê duyệt
          </p>
        </div>

        {items.length > 0 && (
          <div className="alert alert-error" style={{ marginBottom: 16 }} role="status">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }} aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <strong>{items.length}</strong> báo cáo đang chờ Admin co-approve
          </div>
        )}

        {error && <ErrorBanner msg={error} />}
        {loading ? <Spinner /> : (
          <>
            <div style={{ marginBottom: 20 }}>
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--charcoal)', padding: 32 }}>
                  Không có damage report nào cần escalation
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={items}
                  keyExtractor={(item) => item.id}
                  actions={actions}
                  onRowClick={(item) => openDrawer(item)}
                />
              )}
            </div>
            <Pagination page={page} totalPages={totalPages} onPage={p => load(p)} />
          </>
        )}

        <Drawer
          open={drawerOpen}
          onClose={() => { setDrawerOpen(false); setSelected(null); }}
          title="Co-Approve Damage Report"
        >
          {selected && (
            <div>
              {approveMsg && (approveMsg.type === 'success'
                ? <SuccessBanner msg={approveMsg.msg} />
                : <ErrorBanner msg={approveMsg.msg} />)}

              <div style={{ marginBottom: 20 }}>
                {[
                  { label: 'Property', value: selected.propertyName },
                  { label: 'Room', value: selected.roomName },
                  { label: 'Reported by', value: selected.reportedBy || '—' },
                  { label: 'Manager', value: selected.managerName || '—' },
                  { label: 'Est. Cost', value: fmtVnd(selected.totalFee) },
                  {
                    label: 'Manager proposed',
                    value: selected.approvedAmount != null ? fmtVnd(selected.approvedAmount) : '—',
                  },
                  { label: 'Escalated', value: fmtDate(selected.escalatedAt || selected.createdAt) },
                ].map(r => (
                  <div
                    key={r.label}
                    style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--hairline)' }}
                  >
                    <span className="body-sm text-charcoal">{r.label}</span>
                    <span style={{ fontWeight: 600, fontSize: 14, textAlign: 'right' }}>{r.value}</span>
                  </div>
                ))}
              </div>

              {selected.managerNote?.trim() && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontWeight: 700, marginBottom: 8 }}>Manager Note</p>
                  <p className="body-sm" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{selected.managerNote}</p>
                </div>
              )}

              {selected.items.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontWeight: 700, marginBottom: 10 }}>Damage items</p>
                  {selected.items.map((item, i) => (
                    <div
                      key={`${item.name}-${i}`}
                      style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--surface-bone)', borderRadius: 6, marginBottom: 4 }}
                    >
                      <span className="body-sm">{item.name}</span>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#dc2626' }}>{fmtVnd(item.estimatedCost)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <p style={{ fontWeight: 700, marginBottom: 10 }}>Evidence photos</p>
                {photos.length === 0 ? (
                  <p className="body-sm text-charcoal" style={{ margin: 0 }}>Chưa có ảnh đính kèm.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {photos.map((att, i) => (
                      <a
                        key={`${att.url}-${i}`}
                        href={photoSrc(att.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'block', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--hairline)' }}
                      >
                        <img
                          src={photoSrc(att.url)}
                          alt={att.fileName || `Ảnh hư hại ${i + 1}`}
                          style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label form-label-required" htmlFor="approved-fee">
                  Phí được duyệt (VND)
                </label>
                <input
                  id="approved-fee"
                  className="input"
                  type="number"
                  min={0}
                  value={feeInput}
                  onChange={e => setFeeInput(e.target.value)}
                  placeholder="Nhập phí chính thức..."
                />
                {parsedFee > ESCALATION_THRESHOLD && (
                  <p className="body-sm" style={{ color: '#dc2626', marginTop: 4 }}>
                    Phí &gt; {fmtVnd(ESCALATION_THRESHOLD)} — đúng hàng đợi Admin co-approve
                  </p>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label" htmlFor="admin-note">Ghi chú Admin (tuỳ chọn)</label>
                <textarea
                  id="admin-note"
                  className="input"
                  rows={3}
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="Evidence reviewed and fee confirmed..."
                />
              </div>

              <button
                className="btn-primary"
                style={{ width: '100%', background: 'var(--success, #10B981)' }}
                disabled={approveLoading || !feeInput}
                onClick={() => setConfirmOpen(true)}
              >
                {approveLoading ? 'Đang xử lý...' : 'Approve'}
              </button>
            </div>
          )}
        </Drawer>

        <ConfirmModal
          open={confirmOpen}
          title="Xác nhận Co-Approve"
          message={`Bạn xác nhận duyệt phí ${parsedFee > 0 ? fmtVnd(parsedFee) : '?'} cho báo cáo hư hại này? Booking sẽ chuyển Pending Damage Payment.`}
          confirmLabel="Xác nhận Approve"
          onConfirm={handleCoApprove}
          onCancel={() => setConfirmOpen(false)}
        />
      </div>
    </AdminLayout>
  );
}
