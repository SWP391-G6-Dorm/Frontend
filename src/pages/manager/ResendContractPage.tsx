import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import { useQuery, useMutation } from '@tanstack/react-query';
import { contractApi } from '../../api/contractApi';

export default function ResendContractPage() {
  const { id } = useParams();
  const [email, setEmail] = useState('');
  const [isEmailDirty, setIsEmailDirty] = useState(false);
  const [done, setDone] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['manager_contract', id],
    queryFn: () => contractApi.getContractDetail(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (data?.data && !isEmailDirty) {
      setEmail(data.data.customerEmail);
    }
  }, [data, isEmailDirty]);

  const resendMutation = useMutation({
    mutationFn: (targetEmail: string) => contractApi.resendContractEmail(id!, targetEmail),
    onSuccess: () => {
      setDone(true);
    },
    onError: (error) => {
      console.error(error);
      alert("Failed to send email. Check backend logs or credentials.");
    }
  });

  if (isLoading) return <ManagerLayout><div style={{ padding: 40 }}>Loading contract details...</div></ManagerLayout>;
  if (isError || !data?.data) return <ManagerLayout><div style={{ padding: 40, color: 'var(--error)' }}>Error loading contract or not found.</div></ManagerLayout>;

  const c = data.data;

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    resendMutation.mutate(email);
  }

  return (
    <ManagerLayout>
      <div className="flex items-center gap-2 body-sm text-charcoal" style={{ marginBottom: 20 }}>
        <Link to={`/manager/contracts/${c.id}`} className="text-primary" style={{ textDecoration: 'none' }}>Contract #{c.id.substring(0, 8)}...</Link>
        <span>›</span>
        <span style={{ fontWeight: 600 }}>Resend</span>
      </div>
      <h1 className="heading-md" style={{ marginBottom: 24 }}>Resend Contract Email</h1>
      <div style={{ maxWidth: 480 }}>
        {done ? (
          <div className="alert alert-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><polyline points="20,6 9,17 4,12"/></svg>
            Contract successfully resent to {email}
          </div>
        ) : (
          <form onSubmit={handleResend} className="card-lg" style={{ padding: 28 }}>
            <div style={{ padding: 16, background: 'var(--surface-bone)', borderRadius: 10, marginBottom: 20 }}>
              <p className="body-sm text-charcoal">Contract</p>
              <p style={{ fontWeight: 700 }}>#{c.id.substring(0, 8)}... · {c.roomNumber} · {c.customerName}</p>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label form-label-required" htmlFor="resendEmail">Send to Email</label>
              <input 
                id="resendEmail" 
                type="email" 
                className="input" 
                value={email} 
                onChange={e => { setEmail(e.target.value); setIsEmailDirty(true); }} 
                required 
              />
              <p className="form-hint">Default is the customer's registered email</p>
            </div>
            <div className="alert alert-info" style={{ marginBottom: 20 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              The contract PDF will be generated and attached to the email immediately.
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={resendMutation.isLoading}
              >
                {resendMutation.isLoading ? 'Sending...' : 'Send Contract'}
              </button>
              <Link to={`/manager/contracts/${c.id}`} className="btn-ghost">Cancel</Link>
            </div>
          </form>
        )}
      </div>
    </ManagerLayout>
  );
}
