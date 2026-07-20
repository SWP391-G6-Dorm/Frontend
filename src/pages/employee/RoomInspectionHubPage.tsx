import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import {
  getEmployeeKpis, type EmployeeKpis,
  getHousekeepingTasks, updateHousekeepingTaskStatus, type HousekeepingTask,
  getEmployeeMaintenanceTickets, updateMaintenanceTicketStatus, type MaintenanceTicket,
  getEmployeeInspections, passInspection, failInspection,
  type InspectionChecklist, type InspectionSummary,
  getEmployeeDamageReports, createDamageReport, type DamageReport, type DamageItem,
  getEmployeeRooms, type EmployeeRoom,
} from '../../api/employeeApi';
import { TOUCH, fmtVnd, fmtDate, extractErr, Spinner, ErrBanner, OkBanner, StatusBadge, Drawer, FAB } from './EmployeeShared';

const CHECKLIST_ITEMS: { key: keyof InspectionChecklist; label: string; icon: string }[] = [
  { key: 'tv', label: 'Tivi & Điều khiển', icon: '📺' },
  { key: 'ac', label: 'Điều hòa & Remote', icon: '❄️' },
  { key: 'minibar', label: 'Tủ lạnh & Mini bar', icon: '🍹' },
  { key: 'bathroom', label: 'Thiết bị vệ sinh', icon: '🚿' },
  { key: 'beds', label: 'Giường & Chăn ga gối', icon: '🛏️' },
];

export default function RoomInspectionHubPage() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [checklist, setChecklist] = useState<InspectionChecklist>({ tv: true, minibar: true, ac: true, bathroom: true, beds: true });
  const [result, setResult] = useState<'PASS' | 'FAIL'>('PASS');
  const [notes, setNotes] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadingList(true); setError(null);
    try {
      const res = await getEmployeeInspections({ size: 50 });
      if (res.success) {
        setInspections(res.data.content);
        setSelectedId(prev => {
          if (prev && res.data.content.some(i => i.id === prev)) return prev;
          return res.data.content[0]?.id ?? '';
        });
      } else setError('Không tải được danh sách kiểm tra.');
    } catch (err) { setError(extractErr(err, 'Không tải được danh sách kiểm tra.')); }
    finally { setLoadingList(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggleItem(key: keyof InspectionChecklist) {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  }

  useEffect(() => {
    const anyFail = Object.values(checklist).some(v => !v);
    if (anyFail && result === 'PASS') setResult('FAIL');
  }, [checklist, result]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) { setFormErr('Vui lòng chọn phòng cần kiểm tra.'); return; }
    if (result === 'FAIL' && !notes.trim()) {
      setFormErr('Ghi chú bắt buộc khi FAIL.');
      return;
    }
    setFormErr(null); setError(null); setSubmitting(true);
    const selected = inspections.find(i => i.id === selectedId);
    try {
      const body = { notes: notes.trim() || undefined, checklist };
      const res = result === 'PASS'
        ? await passInspection(selectedId, body)
        : await failInspection(selectedId, { notes: notes.trim(), checklist });
      if (res.success) {
        if (result === 'FAIL') {
          navigate('/employee/damage/create', {
            state: { roomId: selected?.roomId, fromInspection: true },
          });
        } else {
          navigate('/employee/dashboard');
        }
      } else setError('Nộp kiểm tra thất bại.');
    } catch (err) { setError(extractErr(err, 'Nộp kiểm tra thất bại.')); }
    finally { setSubmitting(false); }
  }

  const passCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = CHECKLIST_ITEMS.length;

  return (
    <EmployeeLayout>
      <div style={{ padding: '16px', maxWidth: 520, margin: '0 auto' }} className="animate-fade-in">
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>🔍 Room Inspection</h1>
          <p className="body-sm text-charcoal">SCR-62 — Kiểm tra phòng trước Check-out</p>
        </div>
        {error && <ErrBanner msg={error} />}

        {loadingList ? <Spinner /> : inspections.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🎉</p>
            <p style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Không có phòng cần kiểm tra</p>
            <p className="body-sm text-charcoal">No rooms ready for inspection.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="card" style={{ padding: '16px 18px', marginBottom: 14 }}>
              <label className="form-label form-label-required" htmlFor="inspection-pick">Chọn phòng cần kiểm tra</label>
              <select id="inspection-pick" className="input" style={{ ...TOUCH }}
                value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                {inspections.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.roomName || i.roomNumber || 'Phòng'} — {i.status}
                  </option>
                ))}
              </select>
              {formErr && <p className="form-error">{formErr}</p>}
            </div>

            <div className="card" style={{ padding: '16px 18px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>📋 Checklist ({passCount}/{totalCount})</p>
                <div style={{ width: 80, height: 6, background: 'var(--hairline)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${(passCount / totalCount) * 100}%`, height: '100%', background: passCount === totalCount ? '#2b9a66' : 'var(--primary)', borderRadius: 3, transition: 'width 0.3s' }} />
                </div>
              </div>
              {CHECKLIST_ITEMS.map(item => (
                <label key={item.key} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 0', borderBottom: '1px solid var(--hairline)',
                  cursor: 'pointer', ...TOUCH,
                }}>
                  <input type="checkbox" checked={checklist[item.key]} onChange={() => toggleItem(item.key)}
                    style={{ width: 20, height: 20, accentColor: 'var(--primary)', cursor: 'pointer', flexShrink: 0 }} />
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <span style={{ fontWeight: checklist[item.key] ? 500 : 400, fontSize: 15, color: checklist[item.key] ? 'var(--ink)' : 'var(--charcoal)', textDecoration: checklist[item.key] ? 'none' : 'line-through', flex: 1 }}>
                    {item.label}
                  </span>
                  {checklist[item.key]
                    ? <span style={{ color: '#2b9a66', fontSize: 16, fontWeight: 700 }}>✓</span>
                    : <span style={{ color: '#dc2626', fontSize: 16 }}>✗</span>
                  }
                </label>
              ))}
            </div>

            <div className="card" style={{ padding: '16px 18px', marginBottom: 14 }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 14 }}>Kết quả kiểm tra</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
                  borderRadius: 12, cursor: 'pointer',
                  border: `2px solid ${result === 'PASS' ? '#2b9a66' : 'var(--hairline)'}`,
                  background: result === 'PASS' ? 'rgba(43,154,102,0.08)' : 'var(--surface-card)',
                  transition: 'all 0.15s', ...TOUCH,
                }}>
                  <input type="radio" name="result" value="PASS" checked={result === 'PASS'} onChange={() => setResult('PASS')} style={{ width: 18, height: 18, accentColor: '#2b9a66' }} />
                  <span style={{ fontSize: 20 }}>✅</span>
                  <span style={{ fontWeight: 700, color: result === 'PASS' ? '#2b9a66' : 'var(--charcoal)', fontSize: 15 }}>PASS</span>
                </label>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
                  borderRadius: 12, cursor: 'pointer',
                  border: `2px solid ${result === 'FAIL' ? '#dc2626' : 'var(--hairline)'}`,
                  background: result === 'FAIL' ? 'rgba(220,38,38,0.06)' : 'var(--surface-card)',
                  transition: 'all 0.15s', ...TOUCH,
                }}>
                  <input type="radio" name="result" value="FAIL" checked={result === 'FAIL'} onChange={() => setResult('FAIL')} style={{ width: 18, height: 18, accentColor: '#dc2626' }} />
                  <span style={{ fontSize: 20 }}>❌</span>
                  <span style={{ fontWeight: 700, color: result === 'FAIL' ? '#dc2626' : 'var(--charcoal)', fontSize: 15 }}>FAIL</span>
                </label>
              </div>
              {result === 'FAIL' && (
                <div className="alert alert-error" style={{ marginTop: 12, fontSize: 13 }}>
                  ⚠️ FAIL sẽ chuyển bạn đến tạo Damage Report.
                </div>
              )}
            </div>

            <div className="card" style={{ padding: '16px 18px', marginBottom: 16 }}>
              <label className={`form-label${result === 'FAIL' ? ' form-label-required' : ''}`} htmlFor="inspection-notes">
                Ghi chú {result === 'FAIL' ? '(bắt buộc)' : 'thêm'}
              </label>
              <textarea id="inspection-notes" className="textarea" rows={3}
                placeholder="Mô tả vấn đề nếu có..."
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <button type="submit" className="btn-primary" disabled={submitting}
              style={{ width: '100%', ...TOUCH, borderRadius: 12, fontWeight: 700, fontSize: 16, marginBottom: 24 }}>
              {submitting ? 'Đang nộp...' : result === 'PASS' ? '✅ Nộp — PASS' : '❌ Nộp — FAIL & Báo cáo'}
            </button>
          </form>
        )}
      </div>
    </EmployeeLayout>
  );
}

// ── SCR-63: Damage Report List ─────────────────────────────────────────────────
