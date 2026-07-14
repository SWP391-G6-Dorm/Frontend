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
        await floorApi.update(initial.id, payload);
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

function TreeView({ structure, expandedFloors, onToggleFloor, onEditFloor, onDeleteFloor }: TreeViewProps) {
  if (structure.floors.length === 0) {
    return (
      <p className="text-sm text-[#64748B] py-6 text-center">
        Chưa có tầng nào. Nhấn &quot;Thêm tầng&quot; để bắt đầu.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Property root */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-[#F8FAFC] rounded-lg mb-3 border border-[#E2E8F0]">
        <span className="font-semibold text-[#1E293B] text-sm">{structure.propertyName}</span>
      </div>

      {structure.floors.map(floor => {
        const expanded = expandedFloors.has(floor.id);
        const roomCount = floor.roomCount ?? floor.rooms.length;

        return (
          <div key={floor.id} className="relative ml-3 pl-4 border-l border-[#E2E8F0]">
            {/* Floor row */}
            <div className="flex items-center gap-2 py-2 group">
              <button
                type="button"
                onClick={() => onToggleFloor(floor.id)}
                className="text-[#64748B] text-xs w-4 flex-shrink-0"
                aria-label={expanded ? 'Thu gọn' : 'Mở rộng'}
              >
                {expanded ? '▼' : '▶'}
              </button>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-[#1E293B]">
                  Tầng {floor.floorNumber}
                </span>
                {floor.description && (
                  <span className="text-sm text-[#64748B] ml-2">— {floor.description}</span>
                )}
                <span className="text-xs text-[#94A3B8] ml-2">({roomCount} phòng)</span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  className="text-xs text-[#0F766E] px-2 py-1 rounded hover:bg-[#CCFBF1]"
                  onClick={() => onEditFloor(floor)}
                >
                  Sửa
                </button>
                <button
                  type="button"
                  className="text-xs text-[#EF4444] px-2 py-1 rounded hover:bg-[#FEE2E2]"
                  onClick={() => onDeleteFloor(floor)}
                >
                  Xóa
                </button>
              </div>
            </div>

            {/* Room leaves (read-only) */}
            {expanded && (
              <div className="ml-6 border-l border-[#E2E8F0] pl-3 mb-2">
                {floor.rooms.length === 0 ? (
                  <p className="text-xs text-[#94A3B8] py-1">Chưa có phòng trên tầng này.</p>
                ) : (
                  floor.rooms.map(room => (
                    <div
                      key={room.id}
                      className="flex items-center gap-2 py-1.5 text-sm text-[#475569]"
                    >
                      <span className="text-[#1E293B]">Phòng {room.roomNumber}</span>
                      {room.roomType && (
                        <span className="text-xs text-[#94A3B8]">{room.roomType}</span>
                      )}
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B]">
                        {ROOM_STATUS_VI[room.status] ?? room.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
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
      await floorApi.remove(deleteTarget.id);
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
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="font-display text-[28px] font-bold text-[#1E293B]">
            Cây cấu trúc
          </h1>
          {selectedPropId && properties.length > 0 && (
            <button
              type="button"
              className="bg-[#0F766E] text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-[#0D6B63]"
              onClick={() => setFloorModal({ open: true, mode: 'add' })}
              disabled={treeLoading}
            >
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
          <>
            {/* Property selector */}
            <div className="max-w-md">
              <label className="block text-sm text-[#64748B] mb-1.5">Chọn homestay</label>
              <select
                className="w-full border border-[#E2E8F0] rounded-md px-3 py-2 text-sm bg-white"
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
          </>
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
