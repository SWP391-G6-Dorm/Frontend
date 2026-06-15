import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';

export default function ReceiptUploadPage() {
  const ref = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function handleFile(f: File | null) {
    if (!f) return;
    setFile(f);
    if (f.type.startsWith('image/')) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    try {
      // TODO: await paymentApi.uploadReceipt(paymentId, file);
      await new Promise(r => setTimeout(r, 800));
      setDone(true);
    } catch { setLoading(false); }
  }

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1 className="heading-md" style={{ marginBottom: 8 }}>Upload Receipt</h1>
        <p className="body-md text-charcoal" style={{ marginBottom: 24 }}>Upload your payment confirmation receipt</p>

        {done ? (
          <div className="alert alert-success" style={{ marginBottom: 20 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><polyline points="20,6 9,17 4,12"/></svg>
            Receipt uploaded successfully! Awaiting manager verification.
          </div>
        ) : (
          <form onSubmit={handleUpload} className="card" style={{ padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label form-label-required">Payment Receipt</label>
              <div
                onClick={() => ref.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0] || null); }}
                style={{ border: '2px dashed var(--hairline)', borderRadius: 10, padding: 28, textAlign: 'center', cursor: 'pointer', background: 'var(--surface-bone)', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--hairline)')}>
                <input ref={ref} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0] || null)} />
                {preview ? <img src={preview} alt="Receipt" style={{ maxHeight: 140, borderRadius: 8, marginBottom: 8, maxWidth: '100%' }} /> : <div style={{ fontSize: 32, marginBottom: 8 }}>📎</div>}
                <p style={{ fontWeight: 600, marginBottom: 4 }}>{file ? file.name : 'Click or drag to upload receipt'}</p>
                <p className="body-sm text-charcoal">JPG, PNG, PDF up to 10MB</p>
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={!file || loading}>
              {loading ? 'Uploading...' : 'Upload Receipt'}
            </button>
          </form>
        )}
        <Link to="/customer/payments" className="btn-ghost" style={{ marginTop: 12, width: '100%', justifyContent: 'center', display: 'flex' }}>
          ← Back to Payments
        </Link>
      </div>
    </CustomerLayout>
  );
}
