// ─── MaintenancePages.tsx — SCR-27, 28, 29 ───────────────────────────────────
// Exports: MaintenanceListPage, CreateMaintenancePage, MaintenanceDetailPage

import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';
import { maintenanceApi, MaintenanceTicket } from '../../api/maintenanceApi';
import { bookingApi, BookingSummary } from '../../api/bookingApi';
import { PhotoLightbox } from '../../components/PhotoLightbox';

// Helper to format static image URLs from the backend upload directory
const getPhotoUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const backendBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

function StatusBadge({ s }: { s: string }) {
  const m: Record<string, { cls: string; l: string }> = {
    OPEN:        { cls: 'badge-warning', l: 'Open' },
    IN_PROGRESS: { cls: 'badge-info',    l: 'In Progress' },
    RESOLVED:    { cls: 'badge-success', l: 'Resolved' },
    CLOSED:      { cls: 'badge-neutral', l: 'Closed' },
  };
  const v = m[s] || { cls: 'badge-neutral', l: s };
  return <span className={`badge ${v.cls}`}>{v.l}</span>;
}

function StatusTimeline({ status }: { status: string }) {
  const steps = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  const curIdx = steps.indexOf(status);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {steps.map((step, i) => {
        const done = i <= curIdx;
        const isLast = i === steps.length - 1;
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', flex: isLast ? 'none' : 1 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? 'var(--primary)' : 'var(--stone)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px' }}>
                {done ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg> : <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{i+1}</span>}
              </div>
              <p style={{ fontSize: 10, fontWeight: 600, color: done ? 'var(--primary)' : 'var(--charcoal)', whiteSpace: 'nowrap' }}>{step.replace('_',' ')}</p>
            </div>
            {!isLast && <div style={{ flex: 1, height: 2, background: i < curIdx ? 'var(--primary)' : 'var(--stone)', margin: '0 4px', marginBottom: 16 }} />}
          </div>
        );
      })}
    </div>
  );
}

// ── SCR-27: List ──────────────────────────────────────────────────────────────
export function MaintenanceListPage() {
  const [filter, setFilter] = useState('ALL');
  const [list, setList] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const tabs = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

  useEffect(() => {
    async function loadTickets() {
      setLoading(true);
      setError(null);
      try {
        const res = await maintenanceApi.getCustomerTickets({ status: filter, page: 0, size: 100 });
        if (res.success && res.data) {
          setList(res.data.content);
        } else {
          setError("Failed to retrieve tickets.");
        }
      } catch (err: any) {
        console.error("Error loading tickets:", err);
        setError("Error loading tickets. Please verify connection to server.");
      } finally {
        setLoading(false);
      }
    }
    loadTickets();
  }, [filter]);

  return (
    <CustomerLayout>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="heading-md">Maintenance Requests</h1>
        <Link to="/customer/maintenance/create" className="btn-primary btn-sm">+ New Request</Link>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, padding: '4px', background: 'var(--surface-bone)', borderRadius: 9999, width: 'fit-content' }}>
        {tabs.map(tab => (
          <button key={tab} className={`tab-pill ${filter === tab ? 'active' : ''}`} onClick={() => setFilter(tab)}>
            {tab.replace('_',' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p className="body-md text-charcoal">Loading tickets...</p>
        </div>
      ) : error ? (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          {error}
        </div>
      ) : list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔧</div>
          <h3 className="heading-sm" style={{ marginBottom: 8 }}>No maintenance requests</h3>
          <p className="body-md text-charcoal" style={{ marginBottom: 16 }}>Report an issue with your accommodation</p>
          <Link to="/customer/maintenance/create" className="btn-primary">Submit Request</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map(t => (
            <div key={t.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{t.title}</span>
                    <StatusBadge s={t.status} />
                  </div>
                  <p className="body-sm text-charcoal" style={{ marginBottom: 4 }}>
                    📍 {t.roomNumber} · {t.propertyName}
                  </p>
                  <p className="body-sm text-charcoal">
                    Submitted {new Date(t.createdAt).toLocaleDateString('en-US')} · Updated {new Date(t.updatedAt).toLocaleDateString('en-US')}
                  </p>
                </div>
                <Link to={`/customer/maintenance/${t.id}`} className="btn-outline btn-sm" style={{ flexShrink: 0 }}>View</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </CustomerLayout>
  );
}

// ── SCR-28: Create ────────────────────────────────────────────────────────────
export function CreateMaintenancePage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [form, setForm] = useState({ bookingId: '', title: '', description: '' });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadBookings() {
      try {
        const res = await bookingApi.getMyActiveBookings();
        if (res.success && res.data) {
          setBookings(res.data);
        }
      } catch (err) {
        console.error("Failed to load active bookings", err);
      }
    }
    loadBookings();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (photos.length + selectedFiles.length > 5) {
        alert('You can only upload up to 5 photos.');
        return;
      }
      
      const newPhotos = [...photos, ...selectedFiles];
      setPhotos(newPhotos);

      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setPhotoPreviews([...photoPreviews, ...newPreviews]);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);

    const newPreviews = [...photoPreviews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPhotoPreviews(newPreviews);
  };

  function validate() {
    const e: Record<string, string> = {};
    if (!form.bookingId.trim()) e.bookingId = 'Booking is required';
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (form.description.length < 20) e.description = 'Please provide more detail (at least 20 characters)';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('roomId', form.bookingId);
      formData.append('title', form.title);
      formData.append('description', form.description);
      photos.forEach(photo => {
        formData.append('photos', photo);
      });

      const res = await maintenanceApi.createTicket(formData);
      if (res.success) {
        navigate('/customer/maintenance');
      } else {
        setErrors({ submit: 'Failed to submit maintenance request.' });
        setLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setErrors({ submit: err.response?.data?.message || 'Server error occurred during submission.' });
      setLoading(false);
    }
  }

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/customer/maintenance" className="text-primary" style={{ textDecoration: 'none' }}>Maintenance</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>New Request</span>
        </div>

        <h1 className="heading-md" style={{ marginBottom: 24 }}>Submit Maintenance Request</h1>

        {errors.submit && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card" style={{ padding: 28 }}>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label form-label-required" htmlFor="bookingId">Related Booking / Room</label>
            <select id="bookingId" className={`select ${errors.bookingId ? 'input-error' : ''}`}
              value={form.bookingId} onChange={e => setForm(p => ({ ...p, bookingId: e.target.value }))}>
              <option value="">Select a booking</option>
              {bookings.map(b => (
                <option key={b.bookingId} value={b.roomId}>
                  {b.roomNumber} – {b.propertyName} ({new Date(b.checkInDate).toLocaleDateString('en-US')} to {new Date(b.checkOutDate).toLocaleDateString('en-US')})
                </option>
              ))}
            </select>
            {errors.bookingId && <p className="form-error">{errors.bookingId}</p>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label form-label-required" htmlFor="title">Issue Title</label>
            <input id="title" className={`input ${errors.title ? 'input-error' : ''}`}
              placeholder="e.g., Air conditioner not working"
              value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label form-label-required" htmlFor="description">Description</label>
            <textarea id="description" className={`textarea ${errors.description ? 'input-error' : ''}`}
              rows={5} placeholder="Describe the issue in detail so we can help you quickly..."
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {errors.description ? <p className="form-error">{errors.description}</p> : <span />}
              <span className="form-hint">{form.description.length} chars</span>
            </div>
          </div>

          {/* Photo upload field */}
          <div style={{ marginBottom: 24 }}>
            <label className="form-label">Attach Photos (Optional, max 5)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="file" multiple accept="image/*" onChange={handlePhotoChange} disabled={loading} style={{ display: 'none' }} id="photo-upload" />
              <label htmlFor="photo-upload" className="btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '8px 14px', borderRadius: 8 }}>
                <span>📁 Select Images</span>
              </label>
              <span className="body-xs text-charcoal">{photos.length}/5 images attached</span>
            </div>
            {photoPreviews.length > 0 && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                {photoPreviews.map((preview, idx) => (
                  <div key={idx} style={{ position: 'relative', width: 70, height: 70 }}>
                    <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: '1px solid var(--hairline)' }} />
                    <button type="button" onClick={() => removePhoto(idx)} style={{ position: 'absolute', top: -6, right: -6, background: 'var(--error)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold' }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="alert alert-info" style={{ marginBottom: 20 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Our team will review your request and update the status within 24 hours.
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
            <Link to="/customer/maintenance" className="btn-ghost">Cancel</Link>
          </div>
        </form>
      </div>
    </CustomerLayout>
  );
}

// ── SCR-29: Detail ────────────────────────────────────────────────────────────
export function MaintenanceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [ticket, setTicket] = useState<MaintenanceTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  
  // Photo editing state
  const [editExistingPhotos, setEditExistingPhotos] = useState<string[]>([]);
  const [editNewPhotos, setEditNewPhotos] = useState<File[]>([]);
  
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    async function loadTicket() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await maintenanceApi.getTicketDetail(id);
        if (res.success && res.data) {
          setTicket(res.data);
          setEditForm({ title: res.data.title, description: res.data.description });
        } else {
          setError("Maintenance request not found.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load maintenance request details.");
      } finally {
        setLoading(false);
      }
    }
    loadTicket();
  }, [id]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !ticket) return;
    if (!editForm.title.trim()) { setEditError('Title is required'); return; }
    if (!editForm.description.trim()) { setEditError('Description is required'); return; }
    if (editForm.description.length < 20) { setEditError('Description must be at least 20 characters'); return; }
    
    const totalPhotos = editExistingPhotos.length + editNewPhotos.length;
    if (totalPhotos > 5) { setEditError('Maximum 5 photos allowed'); return; }
    
    setEditLoading(true);
    setEditError(null);
    try {
      const formData = new FormData();
      formData.append('title', editForm.title.trim());
      formData.append('description', editForm.description.trim());
      
      // Send which existing photos to keep
      editExistingPhotos.forEach(url => {
        formData.append('existingPhotoUrls', url);
      });
      
      // Send new photos
      editNewPhotos.forEach(file => {
        formData.append('photos', file);
      });
      
      const res = await maintenanceApi.updateTicket(id, formData as any);
      if (res.success && res.data) {
        setTicket(res.data);
        setIsEditing(false);
        setEditNewPhotos([]);
      } else {
        setEditError('Update failed.');
      }
    } catch (err: any) {
      console.error(err);
      setEditError(err.response?.data?.message || 'Server error occurred during update.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleteLoading(true);
    try {
      const res = await maintenanceApi.deleteTicket(id);
      if (res.success) {
        navigate('/customer/maintenance');
      } else {
        alert('Failed to delete ticket.');
        setDeleteLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Server error occurred during deletion.');
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div style={{ textAlign: 'center', padding: 60 }}>
          <p className="body-md text-charcoal">Loading ticket details...</p>
        </div>
      </CustomerLayout>
    );
  }

  if (error || !ticket) {
    return (
      <CustomerLayout>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            {error || 'Maintenance ticket details could not be found.'}
          </div>
          <Link to="/customer/maintenance" className="btn-outline">← Back to List</Link>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/customer/maintenance" className="text-primary" style={{ textDecoration: 'none' }}>Maintenance</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>#{ticket.id.substring(0, 8)}...</span>
        </div>

        {isEditing ? (
          <div className="card" style={{ padding: 28, marginBottom: 20 }}>
            <h2 className="heading-sm" style={{ marginBottom: 20 }}>Edit Maintenance Request</h2>
            {editError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{editError}</div>}
            
            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label form-label-required" htmlFor="edit-title">Issue Title</label>
                <input id="edit-title" className="input" value={editForm.title}
                  onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} disabled={editLoading} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label className="form-label form-label-required" htmlFor="edit-description">Description</label>
                <textarea id="edit-description" className="textarea" rows={5} value={editForm.description}
                  onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} disabled={editLoading} />
              </div>

              {/* ── Photo Editing Section ── */}
              <div style={{ marginBottom: 24 }}>
                <label className="form-label">Attached Photos <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({editExistingPhotos.length + editNewPhotos.length}/5)</span></label>

                {/* Existing photos with remove button */}
                {editExistingPhotos.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p className="body-sm text-charcoal" style={{ marginBottom: 6 }}>Current photos (click ✕ to remove):</p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {editExistingPhotos.map((url, idx) => (
                        <div key={idx} style={{ position: 'relative', width: 90, height: 90, borderRadius: 8, overflow: 'hidden', border: '2px solid var(--hairline)' }}>
                          <img src={getPhotoUrl(url)} alt={`Photo ${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => setEditExistingPhotos(p => p.filter((_, i) => i !== idx))}
                            style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(234,40,4,0.85)', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                            disabled={editLoading}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New photos with preview and remove */}
                {editNewPhotos.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p className="body-sm text-charcoal" style={{ marginBottom: 6 }}>New photos to add:</p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {editNewPhotos.map((file, idx) => (
                        <div key={idx} style={{ position: 'relative', width: 90, height: 90, borderRadius: 8, overflow: 'hidden', border: '2px solid #22c55e' }}>
                          <img src={URL.createObjectURL(file)} alt={`New ${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => setEditNewPhotos(p => p.filter((_, i) => i !== idx))}
                            style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(234,40,4,0.85)', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                            disabled={editLoading}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add more button */}
                {(editExistingPhotos.length + editNewPhotos.length) < 5 && (
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--surface-bone)', border: '1.5px dashed var(--stone)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                    Add Photos
                    <input type="file" accept="image/*" multiple hidden
                      onChange={e => {
                        if (!e.target.files) return;
                        const remaining = 5 - editExistingPhotos.length - editNewPhotos.length;
                        const files = Array.from(e.target.files).slice(0, remaining);
                        setEditNewPhotos(p => [...p, ...files]);
                        e.target.value = '';
                      }} disabled={editLoading} />
                  </label>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn-primary" disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn-ghost" onClick={() => { setIsEditing(false); setEditError(null); setEditNewPhotos([]); }} disabled={editLoading}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between" style={{ marginBottom: 24 }}>
              <div>
                <h1 className="heading-md" style={{ marginBottom: 4 }}>{ticket.title}</h1>
                <p className="body-sm text-charcoal">Ticket #{ticket.id} · {ticket.roomNumber} · {ticket.propertyName}</p>
              </div>
              <StatusBadge s={ticket.status} />
            </div>

            {/* Management Buttons for OPEN tickets */}
            {ticket.status === 'OPEN' && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <button className="btn-outline btn-sm" onClick={() => { setIsEditing(true); setEditExistingPhotos(ticket.photoUrls || []); setEditNewPhotos([]); }}>✏️ Edit Request</button>
                <button className="btn-outline btn-sm" style={{ borderColor: 'var(--error)', color: 'var(--error)' }} onClick={() => setShowDeleteConfirm(true)}>🗑️ Delete Request</button>
              </div>
            )}

            {showDeleteConfirm && (
              <div className="alert alert-error" style={{ marginBottom: 20, padding: 20, display: 'block' }}>
                <h4 style={{ fontWeight: 700, marginBottom: 8, color: '#991b1b' }}>Are you sure you want to delete this request?</h4>
                <p className="body-sm text-charcoal" style={{ marginBottom: 16 }}>This action cannot be undone and will permanently remove this maintenance ticket.</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn-danger" onClick={handleDelete} disabled={deleteLoading}>
                    {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button className="btn-ghost" onClick={() => setShowDeleteConfirm(false)} disabled={deleteLoading} style={{ background: 'var(--surface-bone)' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Resolution note from Manager */}
            {ticket.resolutionNote && (
              <div className="card" style={{ padding: 24, marginBottom: 20, borderLeft: '4px solid var(--primary)' }}>
                <h2 className="heading-sm" style={{ marginBottom: 8 }}>Manager Resolution Note</h2>
                <p className="body-md text-charcoal">{ticket.resolutionNote}</p>
              </div>
            )}

            {/* Progress */}
            <div className="card" style={{ padding: 24, marginBottom: 20 }}>
              <h2 className="heading-sm" style={{ marginBottom: 20 }}>Status Progress</h2>
              <StatusTimeline status={ticket.status} />
            </div>

            {/* Info */}
            <div className="card" style={{ padding: 24, marginBottom: 20 }}>
              <h2 className="heading-sm" style={{ marginBottom: 16 }}>Issue Details</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <p className="body-sm text-charcoal">Room</p>
                  <p style={{ fontWeight: 600 }}>{ticket.roomNumber}</p>
                </div>
                <div>
                  <p className="body-sm text-charcoal">Property</p>
                  <p style={{ fontWeight: 600 }}>{ticket.propertyName}</p>
                </div>
                <div>
                  <p className="body-sm text-charcoal">Submitted</p>
                  <p style={{ fontWeight: 600 }}>{new Date(ticket.createdAt).toLocaleString('en-US')}</p>
                </div>
                <div>
                  <p className="body-sm text-charcoal">Last Updated</p>
                  <p style={{ fontWeight: 600 }}>{new Date(ticket.updatedAt).toLocaleString('en-US')}</p>
                </div>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <p className="body-sm text-charcoal" style={{ marginBottom: 6 }}>Description</p>
                <p className="body-md" style={{ padding: '12px 16px', background: 'var(--surface-bone)', borderRadius: 8, whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
              </div>

              {/* Photos rendering */}
              {ticket.photoUrls && ticket.photoUrls.length > 0 && (
                <div>
                  <p className="body-sm text-charcoal" style={{ marginBottom: 8 }}>Attached Photos</p>
                  <PhotoLightbox photoUrls={ticket.photoUrls} getPhotoUrl={getPhotoUrl} />
                </div>
              )}
            </div>
          </>
        )}

        <Link to="/customer/maintenance" className="btn-outline">← Back to List</Link>
      </div>
    </CustomerLayout>
  );
}
