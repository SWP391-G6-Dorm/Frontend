import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import LandlordLayout from '../../layouts/LandlordLayout';
import { MOCK_UTILITY_READINGS, MOCK_UTILITY_PRICES, MOCK_ROOMS, MOCK_PROPERTIES, KpiCard, StatusBadge, PageHeader, formatDate, formatPrice } from './shared';

// SCR-62 — Utility Dashboard
// SCR-63 — Electricity Meter Entry
// SCR-64 — Water Meter Entry
// SCR-65 — Utility Pricing Settings

const totalElec  = MOCK_UTILITY_READINGS.filter(r => r.utilityType === 'ELECTRICITY').reduce((s, r) => s + (r.currentReading - r.previousReading), 0);
const totalWater = MOCK_UTILITY_READINGS.filter(r => r.utilityType === 'WATER').reduce((s, r) => s + (r.currentReading - r.previousReading), 0);
const elecPrice  = MOCK_UTILITY_PRICES.find(p => p.utilityType === 'ELECTRICITY')!;
const waterPrice = MOCK_UTILITY_PRICES.find(p => p.utilityType === 'WATER')!;

// ─── SCR-62: Utility Dashboard ────────────────────────────────────────────────
export function UtilityDashboardPage() {
  return (
    <LandlordLayout>
      <div className="animate-fade-up flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <PageHeader title="Utility Management" sub="Consumption summary and meter readings" />
          <div className="flex gap-2">
            <Link to="/landlord/utilities/electricity" className="btn-outline" style={{ height: 38, padding: '0 16px', fontSize: 13 }}>⚡ Enter Electricity</Link>
            <Link to="/landlord/utilities/water" className="btn-primary" style={{ height: 38, padding: '0 16px', fontSize: 13, textDecoration: 'none' }}>💧 Enter Water</Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard icon="⚡" label="Total Electricity (Oct)" value={`${totalElec} kWh`}
            sub={`Revenue: ${formatPrice(totalElec * elecPrice.unitPrice)}`} color="var(--warning)" />
          <KpiCard icon="💧" label="Total Water (Oct)" value={`${totalWater} m³`}
            sub={`Revenue: ${formatPrice(totalWater * waterPrice.unitPrice)}`} color="var(--primary)" />
          <KpiCard icon="💰" label="Utility Revenue" value={formatPrice(totalElec * elecPrice.unitPrice + totalWater * waterPrice.unitPrice)}
            sub="Combined this period" color="var(--success)" />
        </div>

        {/* Recent readings table */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--hairline)' }}>
            <h3 className="heading-sm" style={{ color: 'var(--ink)' }}>Recent Meter Readings</h3>
            <Link to="/landlord/utilities/pricing" className="btn-ghost" style={{ height: 34, padding: '0 16px', fontSize: 13, color: 'var(--charcoal)' }}>⚙️ Pricing Settings</Link>
          </div>
          <div className="grid px-5 py-3 border-b"
            style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: '12px', background: 'var(--surface-bone)', borderColor: 'var(--hairline)' }}>
            {['Room', 'Type', 'Previous', 'Current', 'Usage', 'Reading Date'].map(h => (
              <div key={h} className="label-sm" style={{ color: 'var(--charcoal)' }}>{h}</div>
            ))}
          </div>
          {MOCK_UTILITY_READINGS.map((r, i) => (
            <div key={r.id} className="grid px-5 py-4 items-center"
              style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: '12px', borderBottom: i < MOCK_UTILITY_READINGS.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
              <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{r.roomNumber}</p>
              <div className="flex items-center gap-1">
                <span>{r.utilityType === 'ELECTRICITY' ? '⚡' : '💧'}</span>
                <p className="caption" style={{ color: 'var(--charcoal)' }}>{r.utilityType === 'ELECTRICITY' ? 'Elec.' : 'Water'}</p>
              </div>
              <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{r.previousReading}</p>
              <p className="body-sm" style={{ color: 'var(--ink)' }}>{r.currentReading}</p>
              <p className="body-sm font-semibold" style={{ color: 'var(--primary)' }}>
                {r.currentReading - r.previousReading} {r.utilityType === 'ELECTRICITY' ? 'kWh' : 'm³'}
              </p>
              <p className="body-sm" style={{ color: 'var(--charcoal)' }}>{formatDate(r.readingDate)}</p>
            </div>
          ))}
        </div>
      </div>
    </LandlordLayout>
  );
}

// ─── SCR-63 / SCR-64: Meter Entry (shared form) ────────────────────────────────
export function MeterEntryPage({ utilityType }: { utilityType: 'ELECTRICITY' | 'WATER' }) {
  const navigate = useNavigate();
  const isElec = utilityType === 'ELECTRICITY';
  const [propertyId, setPropertyId] = useState('');
  const [roomId, setRoomId]         = useState('');
  const [prevReading, setPrev]      = useState('');
  const [currReading, setCurr]      = useState('');
  const [readingDate, setDate]      = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading]       = useState(false);
  const [errors, setErrors]         = useState<Record<string, string>>({});

  const selectedRoom = MOCK_ROOMS.find(r => r.id === roomId);
  const usage        = Math.max(0, Number(currReading) - Number(prevReading));
  const unitPrice    = isElec ? elecPrice.unitPrice : waterPrice.unitPrice;
  const unit         = isElec ? 'kWh' : 'm³';
  const amount       = usage * unitPrice;

  // Pre-fill previous reading from mock data
  const lastReading  = MOCK_UTILITY_READINGS.find(r => r.roomId === roomId && r.utilityType === utilityType);

  function validate() {
    const e: Record<string, string> = {};
    if (!roomId) e.room = 'Room is required.';
    if (!currReading) e.curr = 'Current reading is required.';
    if (Number(currReading) < Number(prevReading)) e.curr = 'Current reading must be ≥ previous reading.';
    return e;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate('/landlord/utilities'); }, 1000);
  }

  return (
    <LandlordLayout>
      <div className="animate-fade-up" style={{ maxWidth: 580 }}>
        <div className="flex items-center gap-4 mb-6">
          <Link to="/landlord/utilities" className="btn-ghost" style={{ padding: '8px', color: 'var(--charcoal)' }}>←</Link>
          <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>
            {isElec ? '⚡ Electricity' : '💧 Water'} Meter Entry
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ padding: 28 }}>
            <div className="flex flex-col gap-5">
              {/* UtilityReading.property + room */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Property</label>
                  <select className="input-field-rect" style={{ cursor: 'pointer' }} value={propertyId} onChange={e => { setPropertyId(e.target.value); setRoomId(''); }}>
                    <option value="">All properties…</option>
                    {MOCK_PROPERTIES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Room <span style={{ color: 'var(--error)' }}>*</span></label>
                  <select className="input-field-rect" style={{ cursor: 'pointer' }} value={roomId}
                    onChange={e => {
                      setRoomId(e.target.value);
                      const lr = MOCK_UTILITY_READINGS.find(r => r.roomId === e.target.value && r.utilityType === utilityType);
                      if (lr) setPrev(String(lr.currentReading));
                    }}>
                    <option value="">Select room…</option>
                    {MOCK_ROOMS.filter(r => !propertyId || r.propertyId === propertyId).map(r => (
                      <option key={r.id} value={r.id}>{r.roomNumber}</option>
                    ))}
                  </select>
                  {errors.room && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.room}</p>}
                </div>
              </div>

              {/* UtilityReading.readingDate */}
              <div>
                <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Reading Date</label>
                <input type="date" className="input-field-rect" value={readingDate} onChange={e => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
              </div>

              {/* UtilityReading.previousReading / currentReading */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Previous Reading ({unit})</label>
                  <input type="number" className="input-field-rect" value={prevReading} onChange={e => setPrev(e.target.value)} placeholder="0" min="0"
                    style={{ background: 'var(--surface-bone)' }} readOnly={!!lastReading} />
                  {lastReading && <p className="caption mt-1" style={{ color: 'var(--ash)' }}>Auto-filled from last reading</p>}
                </div>
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Current Reading ({unit}) <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input type="number" className="input-field-rect" value={currReading} onChange={e => setCurr(e.target.value)} placeholder="0" min="0" />
                  {errors.curr && <p className="caption mt-1" style={{ color: 'var(--error)' }}>{errors.curr}</p>}
                </div>
              </div>

              {/* Usage preview */}
              {currReading && prevReading && (
                <div className="rounded-lg p-4" style={{ background: 'var(--surface-bone)' }}>
                  <p className="label-sm mb-2" style={{ color: 'var(--charcoal)' }}>USAGE PREVIEW</p>
                  <div className="flex justify-between mb-1">
                    <span className="body-sm" style={{ color: 'var(--charcoal)' }}>Consumption</span>
                    <span className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>{usage} {unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="body-sm" style={{ color: 'var(--charcoal)' }}>Estimated charge</span>
                    <span className="body-sm font-semibold" style={{ color: 'var(--primary)' }}>{formatPrice(amount)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--hairline)' }}>
              <button type="submit" className="btn-primary" style={{ height: 44, padding: '0 28px' }} disabled={loading}>
                {loading ? '…' : `${isElec ? '⚡' : '💧'} Save Reading`}
              </button>
              <Link to="/landlord/utilities" className="btn-outline" style={{ height: 44, padding: '0 24px' }}>Cancel</Link>
            </div>
          </div>
        </form>
      </div>
    </LandlordLayout>
  );
}

// ─── SCR-65: Utility Pricing Settings ─────────────────────────────────────────
export function UtilityPricingPage() {
  const navigate = useNavigate();
  const [prices, setPrices] = useState(
    MOCK_UTILITY_PRICES.map(p => ({ ...p, newPrice: String(p.unitPrice), effectiveDate: p.effectiveDate }))
  );
  const [loading, setLoading] = useState(false);
  const [saved, setSaved]     = useState(false);

  function handleSave() {
    setLoading(true);
    setTimeout(() => { setLoading(false); setSaved(true); setTimeout(() => setSaved(false), 2000); }, 800);
  }

  return (
    <LandlordLayout>
      <div className="animate-fade-up" style={{ maxWidth: 600 }}>
        <div className="flex items-center gap-4 mb-6">
          <Link to="/landlord/utilities" className="btn-ghost" style={{ padding: '8px', color: 'var(--charcoal)' }}>←</Link>
          <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>Utility Pricing Settings</h1>
        </div>

        {saved && (
          <div className="rounded-lg px-5 py-3 mb-5 flex items-center gap-2" style={{ background: '#dcfce7' }}>
            <span>✅</span>
            <p className="body-sm font-semibold" style={{ color: 'var(--success)' }}>Pricing updated successfully!</p>
          </div>
        )}

        <div className="card" style={{ padding: 28 }}>
          {prices.map((price, i) => (
            <div key={price.id} className="mb-6 pb-6 border-b last:border-0 last:pb-0 last:mb-0" style={{ borderColor: 'var(--hairline)' }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{price.utilityType === 'ELECTRICITY' ? '⚡' : '💧'}</span>
                <h3 className="heading-sm" style={{ color: 'var(--ink)' }}>
                  {price.utilityType === 'ELECTRICITY' ? 'Electricity Rate' : 'Water Rate'}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* UtilityPrice.unitPrice */}
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>
                    Unit Price (₫ / {price.unitLabel}) <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <input
                    type="number"
                    className="input-field-rect"
                    value={price.newPrice}
                    onChange={e => setPrices(prev => prev.map((p, j) => j === i ? { ...p, newPrice: e.target.value } : p))}
                    min="0"
                  />
                  <p className="caption mt-1" style={{ color: 'var(--ash)' }}>
                    Currently: {formatPrice(price.unitPrice)} / {price.unitLabel}
                  </p>
                </div>
                {/* UtilityPrice.effectiveDate */}
                <div>
                  <label className="label-sm block mb-2" style={{ color: 'var(--ink)' }}>Effective Date</label>
                  <input
                    type="date"
                    className="input-field-rect"
                    value={price.effectiveDate}
                    onChange={e => setPrices(prev => prev.map((p, j) => j === i ? { ...p, effectiveDate: e.target.value } : p))}
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--hairline)' }}>
            <button className="btn-primary" style={{ height: 44, padding: '0 28px' }} onClick={handleSave} disabled={loading}>
              {loading ? '…' : '💾 Save Pricing'}
            </button>
            <Link to="/landlord/utilities" className="btn-outline" style={{ height: 44, padding: '0 24px' }}>Cancel</Link>
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}
