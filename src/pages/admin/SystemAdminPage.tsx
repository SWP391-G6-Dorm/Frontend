import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import {
  getAdminProperties, createAdminProperty, updateAdminProperty,
  assignManagerToProperty,
  getManagers, getCustomers, updateAdminUser,
  getPaymentReconciliation,
  getEscalatedDamageReports, coApproveDamageReport,
  getAdminComplaints, resolveComplaint,
  getGlobalRevenueReport,
  getSystemSettings, updateSystemSettings,
  getAdminPromotions, createPromotion, updatePromotion, deletePromotion,
  type AdminUser, type AdminProperty, type AdminDamageReport,
  type AdminComplaint, type PaymentReconciliationItem,
  type Promotion, type SystemSettings, type MonthlyRevenue,
} from '../../api/adminApi';
import { DataTable, StatusBadge as UIStatusBadge } from '../../components/ui';
import { fmtVnd, fmtDate, extractApiError, Spinner, ErrorBanner, SuccessBanner, StatusBadge, Drawer, ConfirmModal, Pagination } from './_adminShared';

export function SystemAdminPage() {
  const [tab, setTab] = useState<'settings' | 'logs' | 'moderation'>('settings');
  const [settings, setSettings] = useState<SystemSettings>({ depositPercentage: 40, cancelTimeoutHours: 24 });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    async function load() {
      setSettingsLoading(true);
      try {
        const res = await getSystemSettings();
        if (res.success) setSettings(res.data);
      } catch { /* silent */ }
      finally { setSettingsLoading(false); }
    }
    load();
  }, []);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaveLoading(true); setSettingsMsg(null);
    try {
      const res = await updateSystemSettings(settings);
      if (res.success) setSettingsMsg({ type: 'success', msg: 'Cài đặt đã được lưu!' });
      else setSettingsMsg({ type: 'error', msg: 'Lưu thất bại.' });
    } catch (err) { setSettingsMsg({ type: 'error', msg: extractApiError(err, 'Lưu thất bại.') }); }
    finally { setSaveLoading(false); }
  }

  const TABS: { key: typeof tab; label: string }[] = [
    { key: 'settings',   label: 'Cài đặt hệ thống' },
    { key: 'logs',       label: 'Nhật ký hoạt động' },
    { key: 'moderation', label: 'Kiểm duyệt nội dung' },
  ];

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'inherit', fontSize: 26, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Quản trị hệ thống</h1>
          <p className="body-sm text-charcoal">Cài đặt chung, nhật ký hoạt động và kiểm duyệt nội dung</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--hairline)', marginBottom: 24 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: tab === t.key ? 700 : 500, fontSize: 14,
              color: tab === t.key ? 'var(--primary)' : 'var(--charcoal)',
              borderBottom: `2px solid ${tab === t.key ? 'var(--primary)' : 'transparent'}`,
              marginBottom: -2, transition: 'all 0.15s',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Settings */}
        {tab === 'settings' && (
          <div style={{ maxWidth: 560 }}>
            {settingsMsg && (settingsMsg.type === 'success' ? <SuccessBanner msg={settingsMsg.msg} /> : <ErrorBanner msg={settingsMsg.msg} />)}
            {settingsLoading ? <Spinner /> : (
              <form onSubmit={handleSaveSettings} className="card" style={{ padding: 28 }}>
                <h2 style={{ fontFamily: 'inherit', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Cài đặt hệ thống</h2>

                <div style={{ marginBottom: 20 }}>
                  <label className="form-label" htmlFor="deposit-pct">Tỷ lệ đặt cọc (%)</label>
                  <p className="body-sm text-charcoal" style={{ marginBottom: 8 }}>
                    Áp dụng cho tất cả booking mới. Hiện tại: <strong>{settings.depositPercentage}%</strong>
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <input type="range" id="deposit-pct" min={10} max={100} step={5}
                      value={settings.depositPercentage}
                      onChange={e => setSettings(s => ({ ...s, depositPercentage: Number(e.target.value) }))}
                      style={{ flex: 1, accentColor: 'var(--primary)' }} />
                    <input type="number" className="input" min={10} max={100}
                      value={settings.depositPercentage}
                      onChange={e => setSettings(s => ({ ...s, depositPercentage: Number(e.target.value) }))}
                      style={{ width: 80, textAlign: 'center' }} />
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label className="form-label" htmlFor="cancel-timeout">Thời gian timeout hủy (giờ)</label>
                  <p className="body-sm text-charcoal" style={{ marginBottom: 8 }}>
                    Thời gian khách hàng được phép hủy booking sau khi tạo.
                  </p>
                  <input id="cancel-timeout" type="number" className="input" min={1} max={168}
                    value={settings.cancelTimeoutHours}
                    onChange={e => setSettings(s => ({ ...s, cancelTimeoutHours: Number(e.target.value) }))}
                    style={{ width: 140 }} />
                </div>

                <div className="alert alert-info" style={{ marginBottom: 20 }}>
                  Lưu ý: Thay đổi cài đặt ảnh hưởng đến <strong>tất cả booking mới</strong>. Booking hiện tại không bị ảnh hưởng.
                </div>

                <button type="submit" className="btn-primary" disabled={saveLoading}>
                  {saveLoading ? 'Đang lưu...' : 'Lưu cài đặt'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab: Activity Logs */}
        {tab === 'logs' && (
          <div>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--hairline)', marginBottom: 16 }}>
              <p className="body-sm text-charcoal">
                Nhật ký hoạt động được ghi nhận từ hệ thống. Liên hệ DevOps để xem toàn bộ logs.
              </p>
            </div>
            <DataTable
              columns={[
                { header: 'Thời gian', accessor: (log: any) => <span className="code-sm">{log.time}</span> },
                { header: 'Người dùng', accessor: (log: any) => log.user },
                { header: 'Hành động', accessor: (log: any) => <span className="badge badge-info">{log.action}</span> },
                { header: 'Đối tượng', accessor: (log: any) => <span className="body-sm text-charcoal">{log.entity}</span> },
                { header: 'Địa chỉ IP', accessor: (log: any) => <span className="code-sm">{log.ip}</span> }
              ]}
              data={[
                { time: '2026-06-27 09:45:12', user: 'admin@system', action: 'UPDATE_SETTINGS', entity: 'SystemSettings', ip: '127.0.0.1' },
                { time: '2026-06-27 09:30:05', user: 'manager@resort', action: 'APPROVE_PAYMENT', entity: 'Payment#abc123', ip: '192.168.1.5' },
                { time: '2026-06-27 08:15:33', user: 'admin@system', action: 'CO_APPROVE_DAMAGE', entity: 'DamageReport#xyz', ip: '127.0.0.1' },
              ]}
              keyExtractor={(log) => log.time}
            />
          </div>
        )}

        {/* Tab: Content Moderation */}
        {tab === 'moderation' && (
          <div>
            <div className="alert alert-info" style={{ marginBottom: 16 }}>
              Kiểm duyệt nội dung đánh giá từ khách hàng. Có thể ẩn các đánh giá vi phạm chính sách.
            </div>
            <DataTable
              columns={[
                { header: 'Mã đánh giá', accessor: (r: any) => <span className="code-sm">{r.id}</span> },
                { header: 'Khách hàng', accessor: (r: any) => r.customer },
                { header: 'Đánh giá', accessor: (r: any) => `${r.rating}/5` },
                { header: 'Nội dung', accessor: (r: any) => <span style={{ maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{r.comment}</span> },
                { header: 'Trạng thái', accessor: (r: any) => <StatusBadge status={r.status === 'VISIBLE' ? 'ACTIVE' : 'INACTIVE'} /> }
              ]}
              data={[
                { id: 'R001', customer: 'Nguyễn Văn A', rating: 1, comment: 'Phòng rất tệ, không đúng như mô tả...', status: 'VISIBLE' },
                { id: 'R002', customer: 'Trần Thị B', rating: 5, comment: 'Tuyệt vời! Nhân viên rất tận tình...', status: 'VISIBLE' },
              ]}
              keyExtractor={(r) => r.id}
              actions={[
                { label: 'Ẩn đánh giá', onClick: (r) => {} }
              ]}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}


