import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complaintsApi } from '../../api/complaintsApi';

// Badge color mappings for customer
function ComplaintStatusBadge({ status }: { status: string }) {
  const m: Record<string, { cls: string; label: string }> = {
    OPEN:          { cls: 'badge-warning', label: 'Chờ xử lý' },
    INVESTIGATING: { cls: 'badge-info',    label: 'Đang điều tra' },
    RESOLVED:      { cls: 'badge-success', label: 'Đã giải quyết' },
    CLOSED:        { cls: 'badge-error',   label: 'Đã đóng' },
  };
  const s = m[status] || { cls: 'badge-neutral', label: status };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

// ─── Customer Complaint List Page ───
export function CustomerComplaintListPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['customer_complaints'],
    queryFn: () => complaintsApi.getMyComplaints()
  });

  const list = data?.data || [];

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
          <div>
            <h1 className="heading-md" style={{ marginBottom: 4 }}>My Complaints</h1>
            <p className="body-sm text-charcoal">Submit and track your issues or feedback</p>
          </div>
          <Link to="/customer/complaints/create" className="btn-primary">
            File a Complaint
          </Link>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <p className="body-md text-charcoal">Loading complaints...</p>
          </div>
        ) : isError ? (
          <div className="alert alert-error" style={{ padding: 20, textAlign: 'center' }}>
            Failed to load complaints. Please try again.
          </div>
        ) : list.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <h3 className="heading-sm" style={{ marginBottom: 8 }}>No complaints filed</h3>
            <p className="body-md text-charcoal" style={{ marginBottom: 20 }}>If you face any issues during your stay, feel free to file a complaint.</p>
            <Link to="/customer/complaints/create" className="btn-primary">File a Complaint Now</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {list.map(c => (
              <div key={c.id} className="card" style={{ padding: 24 }}>
                <div className="flex items-start justify-between" style={{ marginBottom: 12 }}>
                  <div>
                    <h3 className="heading-sm" style={{ margin: '0 0 4px 0' }}>{c.subject}</h3>
                    <p style={{ fontSize: 11, color: 'var(--ash)' }}>
                      Submitted on {new Date(c.createdAt).toLocaleString('en-US')}
                    </p>
                  </div>
                  <ComplaintStatusBadge status={c.status} />
                </div>
                
                <p className="body-md text-body" style={{ background: 'var(--surface-bone)', padding: '12px 16px', borderRadius: 8, margin: '0 0 16px 0', lineHeight: 1.6 }}>
                  {c.description}
                </p>

                {c.resolutionNotes && (
                  <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 16 }}>
                    <p style={{ fontWeight: 700, fontSize: 13, color: '#166534', margin: '0 0 6px 0' }}>Resolution Notes:</p>
                    <p className="body-sm" style={{ background: '#f0fdf4', padding: '10px 14px', borderRadius: 8, color: '#166534', margin: 0, lineHeight: 1.5 }}>
                      {c.resolutionNotes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}

// ─── Create Complaint Form Page ───
export function CreateComplaintPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: { subject: string; description: string }) => complaintsApi.submitComplaint(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer_complaints'] });
      queryClient.invalidateQueries({ queryKey: ['manager_complaints'] });
      navigate('/customer/complaints');
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || "Failed to submit complaint");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!subject.trim()) {
      setErrorMsg("Subject is required");
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Description is required");
      return;
    }

    mutation.mutate({
      subject: subject.trim(),
      description: description.trim()
    });
  };

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
          <Link to="/customer/complaints" className="text-primary" style={{ textDecoration: 'none' }}>Complaints</Link>
          <span>›</span>
          <span style={{ fontWeight: 600 }}>File a Complaint</span>
        </div>

        <h1 className="heading-md" style={{ marginBottom: 24 }}>Submit a Complaint</h1>

        {errorMsg && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card" style={{ padding: 28 }}>
          <div style={{ marginBottom: 20 }}>
            <label className="form-label form-label-required" htmlFor="complaint-subject">Subject</label>
            <input
              id="complaint-subject"
              className="input"
              type="text"
              placeholder="e.g. Broken faucet, noisy neighbours..."
              value={subject}
              onChange={e => setSubject(e.target.value)}
              maxLength={255}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="form-label form-label-required" htmlFor="complaint-description">Description</label>
            <textarea
              id="complaint-description"
              className="textarea"
              rows={6}
              placeholder="Please provide details about your issue..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Submitting...' : 'Submit'}
            </button>
            <Link to="/customer/complaints" className="btn-ghost">Cancel</Link>
          </div>
        </form>
      </div>
    </CustomerLayout>
  );
}
