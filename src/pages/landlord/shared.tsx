// Shared mock data for Landlord Portal
// All data is entity-driven per figma-generation-prompt.md

export const MOCK_PROPERTIES = [
  { id: 'p-001', name: 'Sunset Apartments', address: '125 Nguyen Hue, District 1, HCMC', description: 'Modern serviced apartments in the heart of D1.', status: 'ACTIVE', geoLat: 10.7769, geoLng: 106.7009, createdAt: '2023-06-01', totalRooms: 12, occupiedRooms: 10 },
  { id: 'p-002', name: 'Green House',        address: '88 Le Van Viet, Thu Duc, HCMC',     description: 'Affordable boarding house near university.',    status: 'ACTIVE', geoLat: 10.8372, geoLng: 106.7785, createdAt: '2023-09-15', totalRooms: 8,  occupiedRooms: 5  },
  { id: 'p-003', name: 'City Center',        address: '45 Tran Hung Dao, District 5, HCMC', description: 'Central location, great for young professionals.', status: 'DRAFT', geoLat: 10.7535, geoLng: 106.6836, createdAt: '2024-02-20', totalRooms: 6,  occupiedRooms: 0  },
];

export const MOCK_ROOMS = [
  { id: 'r-001', propertyId: 'p-001', propertyName: 'Sunset Apartments', blockFloorId: 'bf-001', blockName: 'Block A', floorNumber: 3, roomNumber: 'A-301', roomType: 'Studio',      code: 'SS-A301', capacity: 2, genderType: 'MIXED',  pricePerMonth: 3500000, area: 25, status: 'OCCUPIED',     amenities: ['WiFi','AC','Kitchen'] },
  { id: 'r-002', propertyId: 'p-001', propertyName: 'Sunset Apartments', blockFloorId: 'bf-001', blockName: 'Block A', floorNumber: 3, roomNumber: 'A-302', roomType: 'Single Room', code: 'SS-A302', capacity: 1, genderType: 'FEMALE', pricePerMonth: 2000000, area: 15, status: 'AVAILABLE',   amenities: ['WiFi','AC'] },
  { id: 'r-003', propertyId: 'p-001', propertyName: 'Sunset Apartments', blockFloorId: 'bf-002', blockName: 'Block B', floorNumber: 1, roomNumber: 'B-101', roomType: 'Double Room', code: 'SS-B101', capacity: 2, genderType: 'MALE',   pricePerMonth: 4000000, area: 30, status: 'OCCUPIED',     amenities: ['WiFi','AC','Parking'] },
  { id: 'r-004', propertyId: 'p-002', propertyName: 'Green House',        blockFloorId: 'bf-003', blockName: 'Block A', floorNumber: 1, roomNumber: 'A-101', roomType: 'Dormitory',   code: 'GH-A101', capacity: 4, genderType: 'MALE',   pricePerMonth: 1200000, area: 40, status: 'OCCUPIED',     amenities: ['WiFi'] },
  { id: 'r-005', propertyId: 'p-002', propertyName: 'Green House',        blockFloorId: 'bf-003', blockName: 'Block A', floorNumber: 2, roomNumber: 'A-201', roomType: 'Single Room', code: 'GH-A201', capacity: 1, genderType: 'FEMALE', pricePerMonth: 1800000, area: 14, status: 'MAINTENANCE', amenities: ['WiFi'] },
  { id: 'r-006', propertyId: 'p-001', propertyName: 'Sunset Apartments', blockFloorId: 'bf-002', blockName: 'Block B', floorNumber: 2, roomNumber: 'B-201', roomType: 'Studio',      code: 'SS-B201', capacity: 2, genderType: 'MIXED',  pricePerMonth: 3200000, area: 22, status: 'AVAILABLE',   amenities: ['WiFi','AC'] },
];

export const MOCK_BLOCKS = [
  { id: 'bf-001', propertyId: 'p-001', blockName: 'Block A', floorNumber: 3 },
  { id: 'bf-002', propertyId: 'p-001', blockName: 'Block B', floorNumber: 2 },
  { id: 'bf-003', propertyId: 'p-002', blockName: 'Block A', floorNumber: 2 },
];

export const MOCK_TENANTS = [
  { id: 'u-001', name: 'Nguyen Van A',  email: 'vana@example.com',  phone: '+84 912 345 678', role: 'TENANT', status: 'ACTIVE',  createdAt: '2024-08-15', roomNumber: 'A-301', contractStatus: 'ACTIVE' },
  { id: 'u-002', name: 'Tran Thi B',   email: 'bbb@example.com',   phone: '+84 908 111 222', role: 'TENANT', status: 'ACTIVE',  createdAt: '2024-07-01', roomNumber: 'B-101', contractStatus: 'ACTIVE' },
  { id: 'u-003', name: 'Le Van C',     email: 'ccc@example.com',   phone: '+84 901 333 444', role: 'TENANT', status: 'ACTIVE',  createdAt: '2024-09-01', roomNumber: 'A-101', contractStatus: 'ACTIVE' },
  { id: 'u-004', name: 'Pham Thi D',   email: 'ddd@example.com',   phone: '+84 912 555 666', role: 'TENANT', status: 'PENDING', createdAt: '2025-01-10', roomNumber: '—',     contractStatus: '—'      },
];

export const MOCK_REQUESTS = [
  { id: 'RR-010', roomId: 'r-002', roomNumber: 'A-302', propertyName: 'Sunset Apartments', tenantId: 'u-004', tenantName: 'Pham Thi D', tenantEmail: 'ddd@example.com', tenantPhone: '+84 912 555 666', startDate: '2025-12-01', durationMonths: 6, note: 'Prefer quiet floor.', status: 'PENDING',  createdAt: '2025-11-20' },
  { id: 'RR-009', roomId: 'r-006', roomNumber: 'B-201', propertyName: 'Sunset Apartments', tenantId: 'u-003', tenantName: 'Le Van C',   tenantEmail: 'ccc@example.com', tenantPhone: '+84 901 333 444', startDate: '2025-10-01', durationMonths: 12, note: '',                status: 'APPROVED', createdAt: '2025-09-15' },
  { id: 'RR-008', roomId: 'r-005', roomNumber: 'A-201', propertyName: 'Green House',       tenantId: 'u-002', tenantName: 'Tran Thi B', tenantEmail: 'bbb@example.com', tenantPhone: '+84 908 111 222', startDate: '2025-08-01', durationMonths: 3,  note: 'Short-term only.',  status: 'REJECTED', createdAt: '2025-07-20' },
];

export const MOCK_CONTRACTS = [
  { id: 'C-2024-001', rentalRequestId: 'RR-009', tenantId: 'u-001', tenantName: 'Nguyen Van A', roomId: 'r-001', roomNumber: 'A-301', propertyName: 'Sunset Apartments', effectiveFrom: '2024-09-01', effectiveTo: '2026-01-31', monthlyRent: 3500000, depositAmount: 7000000, status: 'ACTIVE',       pdfUrl: '#', terms: 'Standard terms.', signedBy: { tenant: '2024-08-28T10:00:00Z', landlord: '2024-08-29T14:00:00Z' } },
  { id: 'C-2024-002', rentalRequestId: 'RR-008', tenantId: 'u-002', tenantName: 'Tran Thi B',  roomId: 'r-003', roomNumber: 'B-101', propertyName: 'Sunset Apartments', effectiveFrom: '2024-07-01', effectiveTo: '2025-06-30', monthlyRent: 4000000, depositAmount: 8000000, status: 'ACTIVE',       pdfUrl: '#', terms: 'Standard terms.', signedBy: { tenant: '2024-06-28T10:00:00Z', landlord: '2024-06-29T14:00:00Z' } },
  { id: 'C-2024-003', rentalRequestId: 'RR-007', tenantId: 'u-003', tenantName: 'Le Van C',    roomId: 'r-004', roomNumber: 'A-101', propertyName: 'Green House',       effectiveFrom: '2024-09-01', effectiveTo: '2025-08-31', monthlyRent: 1200000, depositAmount: 2400000, status: 'PENDING_SIGN', pdfUrl: null, terms: 'Standard terms.', signedBy: { landlord: '2024-08-30T10:00:00Z' } },
];

export const MOCK_BILLS = [
  { id: 'B-001', contractId: 'C-2024-001', tenantName: 'Nguyen Van A', roomNumber: 'A-301', billingPeriod: 'October 2025',   roomRent: 3500000, electricityFee: 420000, waterFee: 80000, serviceFee: 200000, totalAmount: 4200000, issueDate: '2025-10-28', dueDate: '2025-11-10', status: 'PENDING' },
  { id: 'B-002', contractId: 'C-2024-001', tenantName: 'Nguyen Van A', roomNumber: 'A-301', billingPeriod: 'September 2025', roomRent: 3500000, electricityFee: 280000, waterFee: 100000, serviceFee: 200000, totalAmount: 4080000, issueDate: '2025-09-28', dueDate: '2025-10-10', status: 'PAID' },
  { id: 'B-003', contractId: 'C-2024-002', tenantName: 'Tran Thi B',  roomNumber: 'B-101', billingPeriod: 'October 2025',   roomRent: 4000000, electricityFee: 350000, waterFee: 90000,  serviceFee: 200000, totalAmount: 4640000, issueDate: '2025-10-28', dueDate: '2025-11-10', status: 'OVERDUE' },
  { id: 'B-004', contractId: 'C-2024-003', tenantName: 'Le Van C',    roomNumber: 'A-101', billingPeriod: 'October 2025',   roomRent: 1200000, electricityFee: 180000, waterFee: 40000,  serviceFee: 100000, totalAmount: 1520000, issueDate: '2025-10-28', dueDate: '2025-11-10', status: 'PENDING' },
];

export const MOCK_PAYMENTS = [
  { id: 'PMT-001', billId: 'B-002', tenantName: 'Nguyen Van A', amount: 4080000, method: 'VNPAY',         status: 'SUCCESS', transactionRef: 'TXN-8821', paidAt: '2025-10-08T10:30:00Z', receiptUrl: 'https://placehold.co/400x600?text=Receipt' },
  { id: 'PMT-002', billId: 'B-003', tenantName: 'Tran Thi B',  amount: 4640000, method: 'BANK_TRANSFER', status: 'PENDING', transactionRef: 'TXN-9012', paidAt: '2025-11-01T09:00:00Z', receiptUrl: 'https://placehold.co/400x600?text=Receipt' },
];

export const MOCK_UTILITY_READINGS = [
  { id: 'ur-001', roomId: 'r-001', roomNumber: 'A-301', utilityType: 'ELECTRICITY', previousReading: 1200, currentReading: 1320, readingDate: '2025-10-01', isEstimated: false, enteredBy: 'Le Quoc Hung' },
  { id: 'ur-002', roomId: 'r-001', roomNumber: 'A-301', utilityType: 'WATER',       previousReading: 80,   currentReading: 88,   readingDate: '2025-10-01', isEstimated: false, enteredBy: 'Le Quoc Hung' },
  { id: 'ur-003', roomId: 'r-003', roomNumber: 'B-101', utilityType: 'ELECTRICITY', previousReading: 2100, currentReading: 2200, readingDate: '2025-10-01', isEstimated: false, enteredBy: 'Le Quoc Hung' },
  { id: 'ur-004', roomId: 'r-003', roomNumber: 'B-101', utilityType: 'WATER',       previousReading: 120,  currentReading: 129,  readingDate: '2025-10-01', isEstimated: false, enteredBy: 'Le Quoc Hung' },
];

export const MOCK_UTILITY_PRICES = [
  { id: 'up-001', utilityType: 'ELECTRICITY', unitPrice: 3500,  unitLabel: 'kWh', effectiveDate: '2025-01-01' },
  { id: 'up-002', utilityType: 'WATER',        unitPrice: 10000, unitLabel: 'm³',  effectiveDate: '2025-01-01' },
];

export const MOCK_MAINTENANCE = [
  { id: 'MT-042', tenantId: 'u-001', tenantName: 'Nguyen Van A', roomId: 'r-001', roomNumber: 'A-301', title: 'Broken AC Unit',            description: 'AC not working, loud noise.', status: 'IN_PROGRESS', createdAt: '2025-10-20T10:00:00Z' },
  { id: 'MT-039', tenantId: 'u-001', tenantName: 'Nguyen Van A', roomId: 'r-001', roomNumber: 'A-301', title: 'Leaking bathroom faucet',   description: 'Constant dripping.',          status: 'OPEN',        createdAt: '2025-10-05T08:00:00Z' },
  { id: 'MT-035', tenantId: 'u-002', tenantName: 'Tran Thi B',  roomId: 'r-003', roomNumber: 'B-101', title: 'Broken window latch',       description: 'Cannot lock window.',         status: 'RESOLVED',    createdAt: '2025-09-28T09:00:00Z' },
  { id: 'MT-030', tenantId: 'u-003', tenantName: 'Le Van C',    roomId: 'r-004', roomNumber: 'A-101', title: 'Faulty electrical socket',  description: 'Socket sparking when used.',  status: 'CLOSED',      createdAt: '2025-09-10T14:00:00Z' },
];

// Helpers
export function formatPrice(p: number) { return '₫' + p.toLocaleString('vi-VN'); }
export function formatDate(d: string)  { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
export function formatDateTime(iso: string) { return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }); }
export function relTime(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d}d ago`;
}

// Status badges
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: 'badge-success', AVAILABLE: 'badge-success', PAID: 'badge-success', RESOLVED: 'badge-success', SUCCESS: 'badge-success', APPROVED: 'badge-success', VISIBLE: 'badge-success',
    PENDING: 'badge-warning', IN_PROGRESS: 'badge-info', PENDING_SIGN: 'badge-warning',
    OVERDUE: 'badge-error', REJECTED: 'badge-error', FAILED: 'badge-error', TERMINATED: 'badge-error',
    OCCUPIED: 'badge-info', CONFIRMED: 'badge-info', DRAFT: 'badge-neutral',
    MAINTENANCE: 'badge-warning', SUSPENDED: 'badge-error',
    EXPIRED: 'badge-neutral', ARCHIVED: 'badge-neutral', CANCELLED: 'badge-neutral', CLOSED: 'badge-neutral', INACTIVE: 'badge-neutral',
    OPEN: 'badge-warning',
  };
  return <span className={`badge ${map[status] ?? 'badge-neutral'}`} style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
    {status.replace(/_/g, ' ')}
  </span>;
}

// KPI card
export function KpiCard({ icon, label, value, sub, color, trend }: {
  icon: string; label: string; value: string | number; sub?: string; color?: string; trend?: string;
}) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="flex items-center justify-between mb-3">
        <p className="body-sm font-semibold" style={{ color: 'var(--charcoal)' }}>{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p style={{ fontSize: 28, fontWeight: 700, color: color ?? 'var(--ink)', lineHeight: 1 }}>{value}</p>
      {sub && <p className="caption mt-1.5" style={{ color: 'var(--ash)' }}>{sub}</p>}
      {trend && <p className="caption mt-1" style={{ color: trend.startsWith('+') ? 'var(--success)' : 'var(--error)' }}>{trend}</p>}
    </div>
  );
}

// CRUD table header row
export function TableHeader({ cols }: { cols: string[] }) {
  return (
    <div className="flex gap-0 border-b" style={{ background: 'var(--surface-bone)', borderColor: 'var(--hairline)' }}>
      {cols.map(c => (
        <div key={c} className="label-sm px-4 py-3 flex-1" style={{ color: 'var(--charcoal)', minWidth: 0 }}>{c}</div>
      ))}
    </div>
  );
}

// Page header
export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>{title}</h1>
        {sub && <p className="body-sm mt-1" style={{ color: 'var(--charcoal)' }}>{sub}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// Search + filter bar
export function FilterBar({ search, onSearch, children }: { search: string; onSearch: (v: string) => void; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4 flex-wrap">
      <div className="relative flex-1" style={{ minWidth: 240, maxWidth: 360 }}>
        <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ash)" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          className="input-field-rect"
          style={{ paddingLeft: 36, height: 38 }}
          placeholder="Search…"
          value={search}
          onChange={e => onSearch(e.target.value)}
        />
      </div>
      {children}
    </div>
  );
}
