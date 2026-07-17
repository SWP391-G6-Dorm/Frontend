import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import {
  getEmployeeInspections,
  passInspection,
  failInspection,
  type InspectionChecklist,
  type InspectionSummary,
} from '../../api/employeeApi';
import { TOUCH, extractErr, Spinner, ErrBanner, StatusBadge, Drawer } from './EmployeeShared';

const CHECKLIST_ITEMS: { key: keyof InspectionChecklist; label: string }[] = [
  { key: 'tv', label: 'TV' },
  { key: 'minibar', label: 'Minibar' },
  { key: 'beds', label: 'Bed' },
  { key: 'bathroom', label: 'Bathroom' },
  { key: 'ac', label: 'Air Conditioner' },
];

const DEFAULT_CHECKLIST: InspectionChecklist = {
  tv: true,
  minibar: true,
  ac: true,
  bathroom: true,
  beds: true,
};

function roomLabel(i: InspectionSummary): string {
  return i.room?.roomNumber || i.roomNumber || i.roomName || 'Room';
}

function roomIdOf(i: InspectionSummary): string | undefined {
  return i.room?.id || i.roomId;
}

export default function RoomInspectionHubPage() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [selected, setSelected] = useState<InspectionSummary | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checklist, setChecklist] = useState<InspectionChecklist>({ ...DEFAULT_CHECKLIST });
  const [note, setNote] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const res = await getEmployeeInspections({ size: 50 });
      if (res.success) {
        setInspections(res.data.content);
      } else {
        setError('Không tải được danh sách kiểm tra.');
      }
    } catch (err) {
      setError(extractErr(err, 'Không tải được danh sách kiểm tra.'));
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openChecklist(item: InspectionSummary) {
    setSelected(item);
    setChecklist({ ...DEFAULT_CHECKLIST });
    setNote('');
    setFormErr(null);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setSelected(null);
    setFormErr(null);
  }

  function toggleItem(key: keyof InspectionChecklist) {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handlePass() {
    if (!selected) return;
    setFormErr(null);
    setError(null);
    setSubmitting(true);
    try {
      const res = await passInspection(selected.id, {
        note: note.trim() || undefined,
        checklist,
      });
      if (res.success) {
        closeDrawer();
        await load();
      } else {
        setFormErr('Pass thất bại.');
      }
    } catch (err) {
      setFormErr(extractErr(err, 'Pass thất bại.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFail() {
    if (!selected) return;
    if (!note.trim()) {
      setFormErr('Please describe the damage found');
      return;
    }
    setFormErr(null);
    setError(null);
    setSubmitting(true);
    try {
      const res = await failInspection(selected.id, {
        note: note.trim(),
        checklist,
      });
      if (res.success) {
        const rid = roomIdOf(selected);
        closeDrawer();
        navigate('/employee/damage/create', {
          state: {
            roomId: rid,
            inspectionId: selected.id,
            fromInspection: true,
          },
        });
      } else {
        setFormErr('Fail thất bại.');
      }
    } catch (err) {
      setFormErr(extractErr(err, 'Fail thất bại.'));
    } finally {
      setSubmitting(false);
    }
  }

  const passCount = Object.values(checklist).filter(Boolean).length;

  return (
    <EmployeeLayout>
      <div className="animate-fade-in space-y-4">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <h1 className="font-display text-[28px] font-bold text-[#1E293B]">Room Inspection</h1>
            <p className="body-sm text-charcoal mt-1">Kiểm tra phòng trước Check-out · {inspections.length} phòng</p>
          </div>
          <button
            type="button"
            onClick={() => load()}
            style={{
              ...TOUCH,
              background: 'var(--surface-bone)',
              border: '1px solid var(--hairline)',
              borderRadius: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 14px',
              gap: 6,
              fontSize: 13,
              color: 'var(--charcoal)',
              fontWeight: 600,
            }}
          >
            Refresh
          </button>
        </div>

        {error && <ErrBanner msg={error} />}

        {loadingList ? (
          <Spinner />
        ) : inspections.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>No rooms ready for inspection.</p>
            <p className="body-sm text-charcoal">Không có phòng cần kiểm tra.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {inspections.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openChecklist(item)}
                className="card"
                style={{
                  ...TOUCH,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '14px 16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: '1px solid var(--hairline)',
                  background: 'var(--surface-card)',
                  width: '100%',
                }}
              >
                <div>
                  <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)', marginBottom: 4 }}>
                    Room {roomLabel(item)}
                  </p>
                  <p className="body-sm text-charcoal">
                    {item.status === 'PENDING' ? 'Unassigned — tap to claim & inspect' : 'In progress — continue'}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </button>
            ))}
          </div>
        )}

        <Drawer
          open={drawerOpen}
          onClose={closeDrawer}
          title={selected ? `Checklist — Room ${roomLabel(selected)}` : 'Checklist'}
        >
          {selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <p className="text-body-base" style={{ fontWeight: 700, color: 'var(--ink)' }}>
                    Checklist ({passCount}/{CHECKLIST_ITEMS.length})
                  </p>
                  <StatusBadge status={selected.status} />
                </div>
                {CHECKLIST_ITEMS.map((item) => (
                  <label
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 0',
                      borderBottom: '1px solid var(--hairline)',
                      cursor: 'pointer',
                      ...TOUCH,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checklist[item.key]}
                      onChange={() => toggleItem(item.key)}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        accentColor: 'var(--primary)',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      className="text-body-base"
                      style={{
                        flex: 1,
                        color: checklist[item.key] ? 'var(--ink)' : 'var(--charcoal)',
                        textDecoration: checklist[item.key] ? 'none' : 'line-through',
                      }}
                    >
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>

              <div>
                <label className="form-label" htmlFor="inspection-note">
                  Note
                </label>
                <textarea
                  id="inspection-note"
                  className="textarea"
                  rows={3}
                  placeholder="Describe damage if failing…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {formErr && <p className="form-error">{formErr}</p>}

              <div className="alert alert-error" style={{ fontSize: 13 }}>
                Fail sẽ chuyển bạn đến tạo Damage Report (SCR-64).
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  type="button"
                  className="btn-success"
                  disabled={submitting}
                  onClick={handlePass}
                  style={{ ...TOUCH, width: '100%', borderRadius: 12, fontWeight: 700, fontSize: 15 }}
                >
                  {submitting ? '…' : 'Pass'}
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  disabled={submitting}
                  onClick={handleFail}
                  style={{ ...TOUCH, width: '100%', borderRadius: 12, fontWeight: 700, fontSize: 15 }}
                >
                  {submitting ? '…' : 'Fail'}
                </button>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </EmployeeLayout>
  );
}
