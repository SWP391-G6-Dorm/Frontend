// Customer Contract Detail — companion to SCR-21
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import CustomerLayout from '../../layouts/CustomerLayout';
import Alert from '../../components/ui/Alert';
import { contractApi } from '../../api/contractApi';

const STATUS_CONFIG: Record<string, { cls: string; label: string }> = {
  ACTIVE:    { cls: 'badge-success', label: 'Đang hiệu lực' },
  COMPLETED: { cls: 'badge-neutral', label: 'Hoàn thành' },
  CANCELLED: { cls: 'badge-error',   label: 'Đã hủy' },
};

function formatMoney(n: number) {
  return `₫${Number(n).toLocaleString('vi-VN')}`;
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { cls: 'badge-neutral', label: status };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-[11px] font-bold tracking-[0.06em] uppercase text-[var(--charcoal)] mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="body-sm text-[var(--charcoal)] mb-1">{label}</p>
      <div className="font-semibold text-[var(--ink)] break-words">{children}</div>
    </div>
  );
}

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const blobRef = useRef<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['customer_contract', id],
    queryFn: () => contractApi.getContractDetail(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setPdfLoading(true);
    setPdfError(null);
    setBlobUrl(null);

    contractApi.getContractPdfBlob(id)
      .then(blob => {
        if (cancelled) return;
        const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        blobRef.current = url;
        setBlobUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPdfError('Không thể tải PDF xem trước.');
      })
      .finally(() => {
        if (!cancelled) setPdfLoading(false);
      });

    return () => {
      cancelled = true;
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
        blobRef.current = null;
      }
    };
  }, [id]);

  const handleDownload = async () => {
    if (!id) return;
    setDownloading(true);
    try {
      await contractApi.downloadContractPdf(id, `contract-${shortId(id)}.pdf`);
    } catch {
      setPdfError('Tải xuống thất bại. Vui lòng thử lại.');
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="card p-12 text-center">
          <div className="w-10 h-10 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="body-md text-[var(--charcoal)]">Đang tải hợp đồng...</p>
        </div>
      </CustomerLayout>
    );
  }

  if (isError || !data?.data) {
    return (
      <CustomerLayout>
        <div className="card p-8 max-w-md mx-auto space-y-4 text-center">
          <Alert variant="error" message="Không tìm thấy hợp đồng hoặc bạn không có quyền xem." />
          <div className="flex gap-3 justify-center">
            <button type="button" className="btn-primary" onClick={() => refetch()}>Thử lại</button>
            <Link to="/customer/contracts" className="btn-outline">Quay lại</Link>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  const c = data.data;
  const idShort = shortId(c.id);
  const nights = Math.max(
    1,
    Math.round(
      (new Date(c.checkOutDate).getTime() - new Date(c.checkInDate).getTime()) / 86400000,
    ),
  );

  return (
    <CustomerLayout>
      <nav className="flex items-center gap-2 body-sm text-[var(--charcoal)] mb-5">
        <Link to="/customer/contracts" className="text-[var(--primary)] no-underline hover:underline">
          My Contracts
        </Link>
        <span aria-hidden>›</span>
        <span className="font-semibold code-md text-[var(--ink)]">{idShort}</span>
      </nav>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h1 className="heading-md m-0">Hợp đồng thuê phòng</h1>
            <StatusBadge status={c.status} />
          </div>
          <p className="body-sm text-[var(--charcoal)]">
            Mã HĐ <span className="code-md font-semibold text-[var(--ink)]">{idShort}</span>
            <span className="mx-2 text-[var(--hairline-strong)]">·</span>
            Booking{' '}
            <Link
              to={`/customer/bookings/${c.bookingId}`}
              className="code-md text-[var(--primary)] font-semibold no-underline hover:underline"
            >
              {shortId(c.bookingId)}
            </Link>
          </p>
        </div>
        <button
          type="button"
          className="btn-primary btn-sm"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? 'Đang tải...' : 'Tải PDF'}
        </button>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] items-start">
        <div className="space-y-4">
          <Section title="Lưu trú">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Phòng">{c.roomNumber}</Field>
              <Field label="Cơ sở">{c.propertyName}</Field>
              <Field label="Check-in">{formatDate(c.checkInDate)}</Field>
              <Field label="Check-out">{formatDate(c.checkOutDate)}</Field>
              <Field label="Số đêm">{nights} đêm</Field>
            </div>
          </Section>

          <Section title="Thanh toán">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Đặt cọc">
                <span className="text-[var(--primary)]">{formatMoney(c.depositAmount)}</span>
              </Field>
              <Field label="Tổng giá trị">{formatMoney(c.totalAmount)}</Field>
            </div>
          </Section>

          <Section title="Khách hàng">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Họ tên">{c.customerName}</Field>
              <Field label="Email">{c.customerEmail}</Field>
              <Field label="Số điện thoại">{c.customerPhone || '—'}</Field>
            </div>
          </Section>

          <Section title="Hệ thống">
            <Field label="Ngày tạo">{formatDateTime(c.generatedAt)}</Field>
          </Section>
        </div>

        <aside className="card overflow-hidden xl:sticky xl:top-6">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--hairline)] bg-[var(--surface-bone)]">
            <p className="text-[11px] font-bold tracking-[0.06em] uppercase text-[var(--charcoal)] m-0">
              Xem trước PDF
            </p>
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={handleDownload}
              disabled={downloading}
            >
              Tải xuống
            </button>
          </div>
          <div className="bg-[var(--surface-canvas)] min-h-[420px]">
            {pdfLoading && (
              <div className="flex flex-col items-center justify-center py-24 text-[var(--charcoal)] body-md">
                <div className="w-10 h-10 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-4" />
                Đang tải PDF...
              </div>
            )}
            {pdfError && !pdfLoading && (
              <div className="p-6 space-y-4">
                <Alert variant="error" message={pdfError} />
                <button type="button" className="btn-outline" onClick={handleDownload} disabled={downloading}>
                  Tải PDF
                </button>
              </div>
            )}
            {blobUrl && !pdfLoading && !pdfError && (
              <iframe
                src={blobUrl}
                title={`Hợp đồng ${idShort}`}
                className="w-full border-0 block"
                style={{ minHeight: 'min(72vh, 720px)' }}
              />
            )}
          </div>
        </aside>
      </div>
    </CustomerLayout>
  );
}
