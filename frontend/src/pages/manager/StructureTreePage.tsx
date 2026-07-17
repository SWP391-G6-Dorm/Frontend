import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import Alert from '../../components/ui/Alert';
import { propertyApi, type PropertyStructure, type FloorNode } from '../../api/propertyApi';
import { floorApi, type CreateFloorPayload, type UpdateFloorPayload } from '../../api/floorApi';
import { managerApi } from '../../api/managerApi';
import type { AssignedProperty } from '../../api/reportApi';

// ── Room status (tiếng Việt) ──────────────────────────────────────────────────

const ROOM_STATUS_VI: Record<string, string> = {
  AVAILABLE: 'Trống',
  PENDING_DEPOSIT: 'Chờ cọc',
  RESERVED: 'Đã đặt',
  OCCUPIED: 'Đang ở',
  PENDING_CLEANING: 'Chờ dọn',
  CLEANING_IN_PROGRESS: 'Đang dọn',
  MAINTENANCE: 'Bảo trì',
  OUT_OF_SERVICE: 'Ngưng phục vụ',
};

// ── Floor Modal ───────────────────────────────────────────────────────────────

interface FloorModalProps {
  mode: 'add' | 'edit';
  propertyId: string;
  initial?: { id: string; floorNumber: number; description: string };
  onClose: () => void;
  onSuccess: () => void;
}

function FloorModal({ mode, propertyId, initial, onClose, onSuccess }: FloorModalProps) {
  const [floorNumber, setFloorNumber] = useState(initial?.floorNumber?.toString() ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!floorNumber || isNaN(Number(floorNumber)) || Number(floorNumber) < 1) {
      setError('Số tầng là bắt buộc và phải là số nguyên dương.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (mode === 'add') {
        const payload: CreateFloorPayload = {
          propertyId,
          floorNumber: Number(floorNumber),
          description: description.trim() || undefined,
        };
        await floorApi.create(payload);
      } else if (initial) {
        const payload: UpdateFloorPayload = {
          floorNumber: Number(floorNumber),
          description: description.trim() || undefined,
        };
        await floorApi.update(propertyId, initial.id, payload);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setError(ax?.response?.data?.message ?? 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[16px] shadow-lg border border-[#E2E8F0] p-7 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-[#1E293B] mb-5">
          {mode === 'add' ? 'Thêm tầng mới' : 'Sửa tầng'}
        </h2>

        {error && (
          <div className="mb-4">
            <Alert variant="error" message={error} />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm text-[#64748B] mb-1.5">
            Số tầng <span className="text-[#EF4444]">*</span>
          </label>
          <input
            type="number"
            min={1}
            className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm"
            placeholder="VD: 1"
            value={floorNumber}
            onChange={e => setFloorNumber(e.target.value)}
            autoFocus
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm text-[#64748B] mb-1.5">Mô tả</label>
          <input
            className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm"
            placeholder="VD: Khu view biển"
            value={description}
            maxLength={500}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            className="flex-1 bg-[#0F766E] text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Đang lưu…' : mode === 'add' ? 'Thêm tầng' : 'Lưu thay đổi'}
          </button>
          <button
            type="button"
            className="flex-1 border border-[#E2E8F0] rounded-md py-2 text-sm text-[#64748B]"
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tree View ─────────────────────────────────────────────────────────────────

interface TreeViewProps {
  structure: PropertyStructure;
  expandedFloors: Set<string>;
  onToggleFloor: (id: string) => void;
  onEditFloor: (floor: FloorNode) => void;
  onDeleteFloor: (floor: FloorNode) => void;
}

const getRoomStatusColor = (status: string) => {
  switch (status) {
    case 'AVAILABLE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'OCCUPIED': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'RESERVED':
    case 'PENDING_DEPOSIT': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'CLEANING_IN_PROGRESS':
    case 'PENDING_CLEANING': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'MAINTENANCE':
    case 'OUT_OF_SERVICE': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

function TreeView({ structure, expandedFloors, onToggleFloor, onEditFloor, onDeleteFloor }: TreeViewProps) {
  if (structure.floors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-300">
        <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <p className="text-slate-500 font-medium text-center">Chưa có tầng nào.</p>
        <p className="text-slate-400 text-sm mt-1 mb-4 text-center">Nhấn &quot;Add Floor&quot; để thiết lập cấu trúc cho homestay này.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Property root */}
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-teal-700 to-teal-600 text-white shadow-sm relative z-10">
        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-base tracking-wide">{structure.propertyName}</h3>
          <p className="text-teal-100 text-xs font-medium">{structure.floors.length} tầng, {structure.floors.reduce((acc, f) => acc + (f.roomCount ?? f.rooms.length), 0)} phòng</p>
        </div>
      </div>

      <div className="p-4">
        {structure.floors.map(floor => {
          const expanded = expandedFloors.has(floor.id);
          const roomCount = floor.roomCount ?? floor.rooms.length;
          
          const floorDesc = floor.description?.trim();
          const isRedundantDesc = floorDesc?.toLowerCase() === `tầng ${floor.floorNumber}` || floorDesc?.toLowerCase() === `floor ${floor.floorNumber}`;

          return (
            <div key={floor.id} className="relative mb-2 last:mb-0">
              {/* Floor row */}
              <div 
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer border border-transparent hover:border-slate-200"
                onClick={() => onToggleFloor(floor.id)}
              >
                <button
                  type="button"
                  className={`w-6 h-6 flex items-center justify-center rounded-md bg-white border border-slate-200 shadow-sm text-slate-500 transition-all duration-200 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 ${expanded ? 'rotate-90 bg-teal-50 border-teal-200 text-teal-600' : ''}`}
                  aria-label={expanded ? 'Thu gọn' : 'Mở rộng'}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700">
                    Tầng {floor.floorNumber}
                  </span>
                  {!isRedundantDesc && floorDesc && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="text-sm text-slate-500 font-medium truncate">{floorDesc}</span>
                    </>
                  )}
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 ml-auto group-hover:bg-white transition-colors">
                    {roomCount} phòng
                  </span>
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <button
                    type="button"
                    className="text-xs font-medium text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-1.5 rounded-md hover:bg-teal-100 transition-colors flex items-center gap-1"
                    onClick={(e) => { e.stopPropagation(); onEditFloor(floor); }}
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    className="text-xs font-medium text-red-700 bg-red-50 border border-red-100 px-2.5 py-1.5 rounded-md hover:bg-red-100 transition-colors flex items-center gap-1"
                    onClick={(e) => { e.stopPropagation(); onDeleteFloor(floor); }}
                  >
                    Xóa
                  </button>
                </div>
              </div>

              {/* Room leaves (read-only) */}
              <div className={`grid transition-all duration-300 ease-in-out ${expanded ? 'grid-rows-[1fr] opacity-100 mt-2 mb-4' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="ml-6 pl-4 border-l-2 border-slate-100 pb-2 space-y-2">
                    {floor.rooms.length === 0 ? (
                      <p className="text-sm text-slate-400 py-2 italic flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Chưa có phòng trên tầng này.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {floor.rooms.map(room => (
                          <div
                            key={room.id}
                            className="flex flex-col gap-2 p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-teal-300 transition-all duration-200"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-bold text-slate-700 truncate">Phòng {room.roomNumber}</span>
                              <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getRoomStatusColor(room.status)}`}>
                                {ROOM_STATUS_VI[room.status] ?? room.status}
                              </span>
                            </div>
                            {room.roomType && (
                              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                {room.roomType}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TreeSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-10 bg-[#F1F5F9] rounded-lg animate-pulse" style={{ marginLeft: i % 2 * 16 }} />
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function StructureTreePage() {
  const [searchParams] = useSearchParams();
  const initPropertyId = searchParams.get('propertyId') ?? '';

  const [properties, setProperties] = useState<AssignedProperty[]>([]);
  const [propLoading, setPropLoading] = useState(true);
  const [propError, setPropError] = useState<string | null>(null);

  const [selectedPropId, setSelectedPropId] = useState(initPropertyId);
  const [structure, setStructure] = useState<PropertyStructure | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);

  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set());

  const [floorModal, setFloorModal] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    floor?: FloorNode;
  }>({ open: false, mode: 'add' });

  const [deleteTarget, setDeleteTarget] = useState<FloorNode | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Load assigned properties
  useEffect(() => {
    setPropLoading(true);
    managerApi.getMyAssignedProperties()
      .then(res => {
        if (res.success && res.data) {
          setProperties(res.data);
          const validInit = initPropertyId && res.data.some(p => p.id === initPropertyId);
          if (validInit) {
            setSelectedPropId(initPropertyId);
          } else if (!selectedPropId && res.data.length > 0) {
            setSelectedPropId(res.data[0].id);
          }
        }
      })
      .catch(() => setPropError('Không thể tải danh sách homestay.'))
      .finally(() => setPropLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadStructure = useCallback((propId: string) => {
    if (!propId) return;
    setTreeLoading(true);
    setTreeError(null);
    propertyApi.getStructureTree(propId)
      .then(res => {
        if (res.success && res.data) {
          setStructure(res.data);
          const expanded = new Set<string>();
          if (res.data.floors.length <= 5) {
            res.data.floors.forEach(f => expanded.add(f.id));
          }
          setExpandedFloors(expanded);
        }
      })
      .catch((err: unknown) => {
        const ax = err as { response?: { status?: number; data?: { message?: string } } };
        if (ax?.response?.status === 403) {
          setTreeError('Bạn không có quyền xem homestay này.');
        } else if (ax?.response?.status === 404) {
          setTreeError('Không tìm thấy homestay.');
        } else {
          setTreeError(ax?.response?.data?.message ?? 'Không thể tải cây cấu trúc. Vui lòng thử lại.');
        }
        setStructure(null);
      })
      .finally(() => setTreeLoading(false));
  }, []);

  useEffect(() => {
    if (selectedPropId) loadStructure(selectedPropId);
  }, [selectedPropId, loadStructure]);

  function toggleFloor(id: string) {
    setExpandedFloors(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function confirmDeleteFloor() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await floorApi.remove(selectedPropId, deleteTarget.id);
      setDeleteTarget(null);
      if (selectedPropId) loadStructure(selectedPropId);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      const msg = ax?.response?.data?.message ?? 'Không thể xóa tầng.';
      setDeleteError(
        msg.includes('phòng') ? 'Không thể xóa tầng đang có phòng.' : msg
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <ManagerLayout>
      <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-800 tracking-tight">
              Structure Tree
            </h1>
            <p className="text-slate-500 text-sm mt-1">Quản lý cấu trúc tầng và phòng</p>
          </div>
          {selectedPropId && properties.length > 0 && (
            <button
              type="button"
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-50"
              onClick={() => setFloorModal({ open: true, mode: 'add' })}
              disabled={treeLoading}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm tầng
            </button>
          )}
        </div>

        {/* Alerts */}
        {propError && <Alert variant="error" message={propError} />}
        {treeError && <Alert variant="error" message={treeError} />}

        {/* Empty: no assigned properties */}
        {!propLoading && properties.length === 0 && (
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-10 text-center">
            <p className="text-[#64748B]">Bạn chưa được gán homestay nào.</p>
          </div>
        )}

        {properties.length > 0 && (
          <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 space-y-6">
            <div className="max-w-md">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Homestay đang chọn</label>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all shadow-sm cursor-pointer pr-10"
                  value={selectedPropId}
                  onChange={e => setSelectedPropId(e.target.value)}
                  disabled={propLoading}
                >
                  {propLoading ? (
                    <option>Đang tải…</option>
                  ) : (
                    properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Tree card */}
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 shadow-sm">
              {treeLoading ? (
                <TreeSkeleton />
              ) : structure ? (
                <TreeView
                  structure={structure}
                  expandedFloors={expandedFloors}
                  onToggleFloor={toggleFloor}
                  onEditFloor={floor => setFloorModal({ open: true, mode: 'edit', floor })}
                  onDeleteFloor={floor => { setDeleteTarget(floor); setDeleteError(null); }}
                />
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Floor modal */}
      {floorModal.open && selectedPropId && (
        <FloorModal
          mode={floorModal.mode}
          propertyId={selectedPropId}
          initial={
            floorModal.floor
              ? {
                  id: floorModal.floor.id,
                  floorNumber: floorModal.floor.floorNumber,
                  description: floorModal.floor.description ?? '',
                }
              : undefined
          }
          onClose={() => setFloorModal({ open: false, mode: 'add' })}
          onSuccess={() => selectedPropId && loadStructure(selectedPropId)}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-[16px] shadow-lg border border-[#E2E8F0] p-7 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-[#1E293B] mb-3">
              Xóa Tầng {deleteTarget.floorNumber}?
            </h2>
            <p className="text-sm text-[#64748B] mb-4">
              Hành động này không thể hoàn tác.
              {(deleteTarget.roomCount ?? deleteTarget.rooms.length) > 0 && (
                <span className="block mt-2 text-[#B45309]">
                  Tầng này có {deleteTarget.roomCount ?? deleteTarget.rooms.length} phòng — cần xóa hết phòng trước.
                </span>
              )}
            </p>

            {deleteError && (
              <div className="mb-4">
                <Alert variant="error" message={deleteError} />
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 bg-[#EF4444] text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
                onClick={confirmDeleteFloor}
                disabled={deleting || (deleteTarget.roomCount ?? deleteTarget.rooms.length) > 0}
              >
                {deleting ? 'Đang xóa…' : 'Xóa tầng'}
              </button>
              <button
                type="button"
                className="flex-1 border border-[#E2E8F0] rounded-md py-2 text-sm"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </ManagerLayout>
  );
}
