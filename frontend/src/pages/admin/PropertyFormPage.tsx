import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import {
  getAdminProperties,
  createAdminProperty,
  updateAdminProperty,
  assignManagerToProperty,
  getManagers,
  type AdminUser,
} from '../../api/adminApi';
import { extractApiError, Spinner, ErrorBanner, StatusBadge } from './_adminShared';

type FormState = {
  name: string;
  address: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
};

export function PropertyFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormState>({
    name: '',
    address: '',
    description: '',
    status: 'ACTIVE',
  });
  const [managers, setManagers] = useState<AdminUser[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [initialManagerId, setInitialManagerId] = useState('');
  const [managerKeyword, setManagerKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [fetchingManagers, setFetchingManagers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadManagers() {
      setFetchingManagers(true);
      try {
        const res = await getManagers({ size: 100 });
        if (res.success) setManagers(res.data.content);
      } catch { /* silent */ }
      finally { setFetchingManagers(false); }
    }
    loadManagers();
  }, []);

  useEffect(() => {
    if (!id) return;
    async function loadProperty() {
      setFetching(true);
      try {
        const res = await getAdminProperties({ size: 200 });
        const prop = res.data?.content?.find(p => p.id === id);
        if (prop) {
          setForm({
            name: prop.name,
            address: prop.location || '',
            description: '',
            status: prop.status,
          });
          if (prop.managerId) {
            setSelectedManagerId(prop.managerId);
            setInitialManagerId(prop.managerId);
          }
        }
      } catch { /* silent */ }
      finally { setFetching(false); }
    }
    loadProperty();
  }, [id]);

  const filteredManagers = managers.filter(m =>
    !managerKeyword
    || m.fullName.toLowerCase().includes(managerKeyword.toLowerCase())
    || m.email.toLowerCase().includes(managerKeyword.toLowerCase())
  );

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Tên property không được để trống';
    if (!form.address.trim()) e.address = 'Địa chỉ không được để trống';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setError(null);
    setLoading(true);

    try {
      let propertyId = id;

      if (isEdit && id) {
        const res = await updateAdminProperty(id, {
          name: form.name.trim(),
          status: form.status,
        });
        if (!res.success) {
          setError('Cập nhật property thất bại.');
          return;
        }
      } else {
        const res = await createAdminProperty({
          name: form.name.trim(),
          address: form.address.trim(),
          description: form.description.trim() || undefined,
          status: form.status,
        });
        if (!res.success) {
          setError('Tạo property thất bại.');
          return;
        }
        propertyId = res.data.id;
      }

      if (propertyId && selectedManagerId && selectedManagerId !== initialManagerId) {
        const assignRes = await assignManagerToProperty(propertyId, selectedManagerId);
        if (!assignRes.success) {
          setError(isEdit ? 'Đã lưu property nhưng gán manager thất bại.' : 'Đã tạo property nhưng gán manager thất bại.');
          return;
        }
      }

      navigate('/admin/properties');
    } catch (err) {
      setError(extractApiError(err, isEdit ? 'Cập nhật property thất bại.' : 'Tạo property thất bại.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="animate-fade-in w-full">
        <div className="mb-6">
          <Link to="/admin/properties" className="body-sm text-primary no-underline">← Properties</Link>
          <h1 className="font-display text-2xl sm:text-[26px] font-bold text-[var(--ink)] mt-2 mb-1">
            {isEdit ? 'Chỉnh sửa Property' : 'Tạo Property mới'}
          </h1>
          <p className="body-sm text-charcoal">
            {isEdit ? 'SCR-47/48/49 — Cập nhật thông tin & gán Manager' : 'SCR-47 — Tạo chi nhánh & gán Manager (tùy chọn)'}
          </p>
        </div>

        {error && <ErrorBanner msg={error} />}

        {fetching ? (
          <Spinner />
        ) : (
          <form onSubmit={handleSubmit} className="w-full">
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] gap-5 lg:gap-6">
              {/* Property info */}
              <div className="card p-5 sm:p-6 lg:p-7 min-w-0">
                <h2 className="font-display text-[15px] font-bold text-[var(--ink)] mb-4">Thông tin cơ bản</h2>

                <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(140px,1fr)] gap-4 mb-5">
                  <div className="min-w-0">
                    <label className="form-label form-label-required" htmlFor="prop-name">Tên Property</label>
                    <input
                      id="prop-name"
                      className={`input w-full ${errors.name ? 'input-error' : ''}`}
                      placeholder="VD: Sunset Resort Đà Nẵng"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    />
                    {errors.name && <p className="form-error">{errors.name}</p>}
                  </div>
                  <div className="min-w-0">
                    <label className="form-label" htmlFor="prop-status">Trạng thái</label>
                    <select
                      id="prop-status"
                      className="input w-full"
                      value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value as FormState['status'] }))}
                    >
                      <option value="ACTIVE">Hoạt động</option>
                      <option value="INACTIVE">Ngưng hoạt động</option>
                    </select>
                  </div>
                </div>

                <h2 className="font-display text-[15px] font-bold text-[var(--ink)] mb-4">Địa điểm & Mô tả</h2>

                <div className="mb-4">
                  <label className="form-label form-label-required" htmlFor="prop-address">Địa chỉ chi tiết</label>
                  <input
                    id="prop-address"
                    className={`input w-full ${errors.address ? 'input-error' : ''}`}
                    placeholder="VD: 123 Đường Ven Biển, Đà Nẵng"
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    readOnly={isEdit}
                  />
                  {isEdit && (
                    <p className="body-sm text-charcoal mt-1">Địa chỉ chỉ chỉnh khi tạo mới.</p>
                  )}
                  {errors.address && <p className="form-error">{errors.address}</p>}
                </div>

                <div>
                  <label className="form-label" htmlFor="prop-desc">Mô tả (tùy chọn)</label>
                  <textarea
                    id="prop-desc"
                    className="input w-full resize-y min-h-[100px]"
                    rows={4}
                    placeholder="Nhập mô tả về property..."
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    readOnly={isEdit}
                  />
                </div>
              </div>

              {/* Manager assignment */}
              <div className="card p-5 sm:p-6 lg:p-7 min-w-0 flex flex-col">
                <h2 className="font-display text-[15px] font-bold text-[var(--ink)] mb-1">Gán Manager</h2>
                <p className="body-sm text-charcoal mb-4">Tùy chọn — có thể gán sau.</p>

                <label className="form-label" htmlFor="manager-search">Tìm Manager</label>
                <input
                  id="manager-search"
                  className="input w-full mb-4"
                  placeholder="Tìm theo tên hoặc email..."
                  value={managerKeyword}
                  onChange={e => setManagerKeyword(e.target.value)}
                />

                <div className="flex-1 min-h-[200px] max-h-[min(420px,50vh)] overflow-y-auto flex flex-col gap-2">
                  {fetchingManagers ? (
                    <Spinner />
                  ) : filteredManagers.length === 0 ? (
                    <p className="body-sm text-charcoal text-center py-8">Không tìm thấy manager</p>
                  ) : (
                    filteredManagers.map(m => (
                      <label
                        key={m.id}
                        className="flex items-center gap-3 p-3 rounded-[10px] cursor-pointer transition-all min-w-0"
                        style={{
                          border: `1.5px solid ${selectedManagerId === m.id ? 'var(--primary)' : 'var(--hairline)'}`,
                          background: selectedManagerId === m.id ? 'rgba(15,118,110,0.08)' : 'var(--surface-card)',
                        }}
                      >
                        <input
                          type="radio"
                          name="manager"
                          value={m.id}
                          checked={selectedManagerId === m.id}
                          onChange={() => setSelectedManagerId(m.id)}
                          className="shrink-0"
                          style={{ accentColor: 'var(--primary)' }}
                        />
                        <div
                          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-[var(--primary)]"
                          style={{ background: 'var(--surface-bone)' }}
                        >
                          {m.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{m.fullName}</p>
                          <p className="body-sm text-charcoal truncate">{m.email}</p>
                        </div>
                        <StatusBadge status={m.status} />
                      </label>
                    ))
                  )}
                </div>

                {selectedManagerId && (
                  <button
                    type="button"
                    className="btn-ghost mt-3 w-full sm:w-auto"
                    onClick={() => setSelectedManagerId('')}
                  >
                    Bỏ chọn Manager
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 mt-2 border-t border-[var(--hairline)]">
              <button type="submit" className="btn-primary w-full sm:w-auto" disabled={loading}>
                {loading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo Property'}
              </button>
              <Link to="/admin/properties" className="btn-ghost w-full sm:w-auto text-center">
                Hủy
              </Link>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
