import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import { getEmployeeRooms, submitRoomInspection, type EmployeeRoom, type InspectionChecklist } from '../../api/employeeApi';
import { TOUCH, extractErr, ErrBanner } from './employeeUtils';

// ── SCR-62: Room Inspection Hub ─────────────────────────────────────────────────

const CHECKLIST_ITEMS: { key: keyof InspectionChecklist; label: string; icon: string }[] = [
  { key: 'tv',       label: 'TV / Giải trí',    icon: '📺' },
  { key: 'minibar',  label: 'Minibar',           icon: '🍾' },
  { key: 'ac',       label: 'Điều hòa (AC)',     icon: '❄️' },
  { key: 'bathroom', label: 'Phòng tắm',         icon: '🚿' },
  { key: 'beds',     label: 'Giường / Ga gối',   icon: '🛏️' },
];

export default function RoomInspectionHubPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<EmployeeRoom[]>([]);
  const [roomId, setRoomId] = useState('');
  const [checklist, setChecklist] = useState<InspectionChecklist>({ tv: true, minibar: true, ac: true, bathroom: true, beds: true });
  const [result, setResult] = useState<'PASS' | 'FAIL'>('PASS');
  const [notes, setNotes] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);

  useEffect(() => {
    async function loadRooms() {
      setLoadingRooms(true);
      try {
        const res = await getEmployeeRooms({ size: 100 });
        if (res.success) setRooms(res.data.content);
      } catch { setError('Không tải được danh sách phòng.'); }
      finally { setLoadingRooms(false); }
    }
    loadRooms();
  }, []);

  function toggleItem(key: keyof InspectionChecklist) {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  }

  // Auto-set FAIL if any item unchecked
  useEffect(() => {
    const anyFail = Object.values(checklist).some(v => !v);
    if (anyFail && result === 'PASS') setResult('FAIL');
  }, [checklist, result]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId) { setFormErr('Vui lòng chọn phòng.'); return; }
    setFormErr(null); setError(null); setSubmitting(true);
    try {
      const res = await submitRoomInspection({ roomId, status: result, checklist, notes: notes.trim() || undefined });
      if (res.success) {
        if (result === 'FAIL') {
          navigate('/employee/damage/create', { state: { roomId, fromInspection: true } });
        } else {
          navigate('/employee/dashboard');
        }
      } else { setError('Nộp kiểm tra thất bại.'); }
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
        <form onSubmit={handleSubmit}>
          {/* Room picker */}
          <div className="card" style={{ padding: '16px 18px', marginBottom: 14 }}>
            <label className="form-label form-label-required" htmlFor="inspection-room">Chọn phòng cần kiểm tra</label>
            {loadingRooms ? <div style={{ height: 44, background: 'var(--surface-bone)', borderRadius: 8 }} /> : (
              <select id="inspection-room" className="input" style={{ ...TOUCH }}
                value={roomId} onChange={e => setRoomId(e.target.value)}>
                <option value="">— Chọn phòng —</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>Phòng {r.roomNumber} ({r.status})</option>
                ))}
              </select>
            )}
            {formErr && <p className="form-error">{formErr}</p>}
          </div>

          {/* Checklist */}
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

          {/* PASS / FAIL */}
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

          {/* Notes */}
          <div className="card" style={{ padding: '16px 18px', marginBottom: 16 }}>
            <label className="form-label" htmlFor="inspection-notes">Ghi chú thêm</label>
            <textarea id="inspection-notes" className="textarea" rows={3}
              placeholder="Mô tả vấn đề nếu có..."
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}
            style={{ width: '100%', ...TOUCH, borderRadius: 12, fontWeight: 700, fontSize: 16, marginBottom: 24 }}>
            {submitting ? 'Đang nộp...' : result === 'PASS' ? '✅ Nộp — PASS' : '❌ Nộp — FAIL & Báo cáo'}
          </button>
        </form>
      </div>
    </EmployeeLayout>
  );
}
