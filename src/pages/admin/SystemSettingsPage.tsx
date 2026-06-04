// SCR-80 — System Settings
// Actor: Admin
// Entity: No direct entity — platform configuration
// Tabs: General · Security · Billing · Notifications · Integrations

import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';

type SettingsTab = 'general' | 'security' | 'billing' | 'notifications' | 'integrations';

const TABS: { key: SettingsTab; label: string; icon: string }[] = [
  { key: 'general',       label: 'General',       icon: '🌐' },
  { key: 'security',      label: 'Security',       icon: '🛡️' },
  { key: 'billing',       label: 'Billing',        icon: '💳' },
  { key: 'notifications', label: 'Notifications',  icon: '🔔' },
  { key: 'integrations',  label: 'Integrations',   icon: '🔗' },
];

function ToggleSwitch({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, position: 'relative',
        background: checked ? 'var(--primary)' : '#CBD5E1',
        border: 'none', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: checked ? 22 : 2,
        width: 20, height: 20, borderRadius: '50%', background: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        transition: 'left 0.2s',
      }} />
    </button>
  );
}

function FormField({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="label-sm mb-1.5 block" style={{ color: 'var(--charcoal)' }}>{label}</label>
      {children}
      {hint && <p className="caption mt-1" style={{ color: 'var(--ash)' }}>{hint}</p>}
    </div>
  );
}

function SaveButton({ label = 'Save Changes' }: { label?: string }) {
  const [saved, setSaved] = useState(false);
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  return (
    <button
      onClick={handleSave}
      className="btn-primary"
      style={{ borderRadius: 9999, fontSize: 14, padding: '10px 24px' }}
    >
      {saved ? '✓ Saved!' : label}
    </button>
  );
}

function SectionDivider() {
  return <hr style={{ borderColor: 'var(--hairline)', margin: '4px 0' }} />;
}

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // General
  const [platformName, setPlatformName]     = useState('BoardingHub');
  const [supportEmail, setSupportEmail]     = useState('support@boardinghub.vn');
  const [timezone, setTimezone]             = useState('Asia/Ho_Chi_Minh');

  // Security
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  const [sessionTimeout, setSessionTimeout]     = useState(60);
  const [require2FA, setRequire2FA]             = useState(false);
  const [lockoutDuration, setLockoutDuration]   = useState(30);

  // Billing
  const [defaultDueDate, setDefaultDueDate]   = useState(15);
  const [lateFee, setLateFee]                 = useState(0);
  const [reminderDays, setReminderDays]       = useState([7, 3, 1]);
  const [newReminderDay, setNewReminderDay]   = useState('');

  // Notifications
  const [emailNotif, setEmailNotif]   = useState(true);
  const [inAppNotif, setInAppNotif]   = useState(true);

  const addReminderDay = () => {
    const day = parseInt(newReminderDay, 10);
    if (!isNaN(day) && day > 0 && !reminderDays.includes(day)) {
      setReminderDays(prev => [...prev, day].sort((a, b) => b - a));
      setNewReminderDay('');
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 animate-fade-up">
        <div>
          <h1 className="heading-lg" style={{ color: 'var(--ink)' }}>System Settings</h1>
          <p className="body-sm mt-1" style={{ color: 'var(--charcoal)' }}>
            Platform-level configuration. Changes take effect immediately unless noted otherwise.
          </p>
        </div>

        {/* Tabs.Card layout — sidebar nav + content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Tab sidebar */}
          <div className="card" style={{ padding: 8, height: 'fit-content' }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg body-sm font-medium transition-all text-left"
                style={{
                  background: activeTab === tab.key ? 'var(--primary-light)' : 'transparent',
                  color: activeTab === tab.key ? 'var(--primary)' : 'var(--charcoal)',
                  border: 'none', cursor: 'pointer',
                  borderLeft: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Settings content */}
          <div className="lg:col-span-3">

            {/* ── GENERAL TAB ── */}
            {activeTab === 'general' && (
              <div className="card" style={{ padding: 32 }}>
                <h2 className="heading-sm mb-6" style={{ color: 'var(--ink)' }}>General Settings</h2>
                <div className="flex flex-col gap-5">
                  <FormField label="Platform Name" hint="Displayed in emails, receipts, and the browser title.">
                    <input
                      className="input-field-rect w-full"
                      value={platformName}
                      onChange={e => setPlatformName(e.target.value)}
                      placeholder="Platform name"
                    />
                  </FormField>
                  <FormField label="Support Email" hint="Outgoing emails use this address as the reply-to.">
                    <input
                      className="input-field-rect w-full"
                      type="email"
                      value={supportEmail}
                      onChange={e => setSupportEmail(e.target.value)}
                      placeholder="support@example.com"
                    />
                  </FormField>
                  <FormField label="Default Timezone" hint="Used for billing periods and notification scheduling.">
                    <select
                      className="input-field-rect w-full"
                      value={timezone}
                      onChange={e => setTimezone(e.target.value)}
                    >
                      <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (UTC+7)</option>
                      <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
                      <option value="UTC">UTC</option>
                      <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                    </select>
                  </FormField>
                  <div className="mt-2">
                    <SaveButton label="Save General" />
                  </div>
                </div>
              </div>
            )}

            {/* ── SECURITY TAB ── */}
            {activeTab === 'security' && (
              <div className="card" style={{ padding: 32 }}>
                <h2 className="heading-sm mb-2" style={{ color: 'var(--ink)' }}>Security Settings</h2>
                <p className="body-sm mb-6" style={{ color: 'var(--charcoal)' }}>
                  Configure login protection and session management policies.
                </p>
                <div className="flex flex-col gap-5">
                  <FormField
                    label="Max Login Attempts"
                    hint="Account is temporarily locked after this many failed attempts."
                  >
                    <input
                      className="input-field-rect"
                      type="number"
                      min={1} max={20}
                      value={maxLoginAttempts}
                      onChange={e => setMaxLoginAttempts(parseInt(e.target.value, 10))}
                      style={{ width: 120 }}
                    />
                  </FormField>

                  <SectionDivider />

                  <FormField
                    label="Session Timeout (minutes)"
                    hint="Users are automatically signed out after this period of inactivity."
                  >
                    <input
                      className="input-field-rect"
                      type="number"
                      min={5} max={1440}
                      value={sessionTimeout}
                      onChange={e => setSessionTimeout(parseInt(e.target.value, 10))}
                      style={{ width: 120 }}
                    />
                  </FormField>

                  <SectionDivider />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>Require 2FA for Admin</p>
                      <p className="caption mt-0.5" style={{ color: 'var(--ash)' }}>
                        All users with ADMIN role must enable two-factor authentication.
                      </p>
                    </div>
                    <ToggleSwitch id="require-2fa" checked={require2FA} onChange={setRequire2FA} />
                  </div>

                  <SectionDivider />

                  <FormField
                    label="Account Lockout Duration (minutes)"
                    hint="How long an account remains locked after exceeding max login attempts."
                  >
                    <input
                      className="input-field-rect"
                      type="number"
                      min={1}
                      value={lockoutDuration}
                      onChange={e => setLockoutDuration(parseInt(e.target.value, 10))}
                      style={{ width: 120 }}
                    />
                  </FormField>

                  <div className="mt-2">
                    <SaveButton label="Save Security" />
                  </div>
                </div>
              </div>
            )}

            {/* ── BILLING TAB ── */}
            {activeTab === 'billing' && (
              <div className="card" style={{ padding: 32 }}>
                <h2 className="heading-sm mb-2" style={{ color: 'var(--ink)' }}>Billing Settings</h2>

                {/* Warning alert */}
                <div className="flex items-start gap-3 mb-6 px-4 py-3 rounded-lg"
                  style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
                  <p className="body-sm" style={{ color: '#92400E' }}>
                    Changes affect all <strong>FUTURE</strong> bills only. Existing bills are unaffected.
                  </p>
                </div>

                <div className="flex flex-col gap-5">
                  <FormField
                    label="Default Due Date (days after bill issue)"
                    hint="Bills become OVERDUE after this many days from the issue date."
                  >
                    <input
                      className="input-field-rect"
                      type="number"
                      min={1} max={90}
                      value={defaultDueDate}
                      onChange={e => setDefaultDueDate(parseInt(e.target.value, 10))}
                      style={{ width: 120 }}
                    />
                  </FormField>

                  <SectionDivider />

                  <FormField
                    label="Late Fee (%)"
                    hint="Percentage added to bill total after the due date (0 = no late fee)."
                  >
                    <div className="flex items-center gap-2">
                      <input
                        className="input-field-rect"
                        type="number"
                        min={0} max={100} step={0.5}
                        value={lateFee}
                        onChange={e => setLateFee(parseFloat(e.target.value))}
                        style={{ width: 120 }}
                      />
                      <span className="body-sm" style={{ color: 'var(--charcoal)' }}>%</span>
                    </div>
                  </FormField>

                  <SectionDivider />

                  <FormField
                    label="Reminder Days Before Due Date"
                    hint="Send payment reminders this many days before the due date."
                  >
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      {reminderDays.map(day => (
                        <span
                          key={day}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full body-sm font-semibold"
                          style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid #FDCFAE' }}
                        >
                          {day}d before
                          <button
                            onClick={() => setReminderDays(prev => prev.filter(d => d !== day))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 14, lineHeight: 1, padding: 0 }}
                          >×</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        className="input-field-rect"
                        type="number"
                        min={1}
                        placeholder="Days"
                        value={newReminderDay}
                        onChange={e => setNewReminderDay(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addReminderDay()}
                        style={{ width: 100 }}
                      />
                      <button
                        className="btn-outline"
                        style={{ borderRadius: 9999, fontSize: 13, padding: '6px 16px' }}
                        onClick={addReminderDay}
                      >+ Add</button>
                    </div>
                  </FormField>

                  <div className="mt-2">
                    <SaveButton label="Save Billing" />
                  </div>
                </div>
              </div>
            )}

            {/* ── NOTIFICATIONS TAB ── */}
            {activeTab === 'notifications' && (
              <div className="card" style={{ padding: 32 }}>
                <h2 className="heading-sm mb-6" style={{ color: 'var(--ink)' }}>Notification Settings</h2>
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between py-4 border-b" style={{ borderColor: 'var(--hairline)' }}>
                    <div>
                      <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>Enable Email Notifications</p>
                      <p className="caption mt-0.5" style={{ color: 'var(--ash)' }}>
                        Send bill reminders, contract updates, and system alerts via email.
                      </p>
                    </div>
                    <ToggleSwitch id="email-notif" checked={emailNotif} onChange={setEmailNotif} />
                  </div>

                  <div className="flex items-center justify-between py-4 border-b" style={{ borderColor: 'var(--hairline)' }}>
                    <div>
                      <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>Enable In-App Notifications</p>
                      <p className="caption mt-0.5" style={{ color: 'var(--ash)' }}>
                        Show real-time notifications in the Notification Center (Notification entity).
                      </p>
                    </div>
                    <ToggleSwitch id="inapp-notif" checked={inAppNotif} onChange={setInAppNotif} />
                  </div>

                  {!emailNotif && !inAppNotif && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg"
                      style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                      <span>⚠️</span>
                      <p className="caption" style={{ color: '#DC2626' }}>
                        All notifications are disabled. Users will not receive any alerts.
                      </p>
                    </div>
                  )}

                  <div className="mt-2">
                    <SaveButton label="Save Notifications" />
                  </div>
                </div>
              </div>
            )}

            {/* ── INTEGRATIONS TAB ── */}
            {activeTab === 'integrations' && (
              <div className="card" style={{ padding: 32 }}>
                <h2 className="heading-sm mb-2" style={{ color: 'var(--ink)' }}>Integrations</h2>
                <p className="body-sm mb-6" style={{ color: 'var(--charcoal)' }}>
                  Third-party service credentials. Secret values are masked and only updateable by Admin.
                </p>

                {/* VNPay */}
                <div className="border rounded-lg mb-4 overflow-hidden" style={{ borderColor: 'var(--hairline)' }}>
                  <div className="flex items-center justify-between px-5 py-4"
                    style={{ background: 'var(--surface-bone)', borderBottom: '1px solid var(--hairline)' }}>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center rounded-lg"
                        style={{ width: 40, height: 40, background: '#005EB8', color: 'white', fontSize: 16, fontWeight: 700 }}>V</div>
                      <div>
                        <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>VNPay</p>
                        <p className="caption" style={{ color: 'var(--ash)' }}>Payment gateway integration</p>
                      </div>
                    </div>
                    <span className="badge badge-success" style={{ fontSize: 11 }}>Configured</span>
                  </div>
                  <div className="px-5 py-4 flex flex-col gap-4">
                    <div>
                      <label className="label-sm mb-1.5 block" style={{ color: 'var(--charcoal)' }}>Merchant ID</label>
                      <div className="relative">
                        <input
                          className="input-field-rect w-full"
                          type="text"
                          value="BOARDHUB_VN_2024"
                          readOnly
                          style={{ fontFamily: 'monospace', fontSize: 13, paddingRight: 80 }}
                        />
                        <span
                          className="absolute right-3 top-1/2 -translate-y-1/2 caption"
                          style={{ color: 'var(--ash)' }}
                        >read-only</span>
                      </div>
                    </div>
                    <div>
                      <label className="label-sm mb-1.5 block" style={{ color: 'var(--charcoal)' }}>Secret Key Status</label>
                      <div className="flex items-center gap-3">
                        <input
                          className="input-field-rect"
                          type="password"
                          value="••••••••••••••••••••"
                          readOnly
                          style={{ fontFamily: 'monospace', flex: 1 }}
                        />
                        <button
                          className="btn-outline"
                          style={{ borderRadius: 9999, fontSize: 13, padding: '6px 14px', whiteSpace: 'nowrap' }}
                        >🔑 Update Key</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Google OAuth */}
                <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--hairline)' }}>
                  <div className="flex items-center justify-between px-5 py-4"
                    style={{ background: 'var(--surface-bone)', borderBottom: '1px solid var(--hairline)' }}>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center rounded-lg"
                        style={{ width: 40, height: 40, background: '#FFFFFF', border: '1px solid var(--hairline)', fontSize: 20 }}>🔵</div>
                      <div>
                        <p className="body-sm font-semibold" style={{ color: 'var(--ink)' }}>Google OAuth 2.0</p>
                        <p className="caption" style={{ color: 'var(--ash)' }}>Social login via User.googleId</p>
                      </div>
                    </div>
                    <span className="badge badge-success" style={{ fontSize: 11 }}>Configured</span>
                  </div>
                  <div className="px-5 py-4 flex flex-col gap-4">
                    <div>
                      <label className="label-sm mb-1.5 block" style={{ color: 'var(--charcoal)' }}>Client ID</label>
                      <div className="relative">
                        <input
                          className="input-field-rect w-full"
                          type="text"
                          value="123456789-abc.apps.googleusercontent.com"
                          readOnly
                          style={{ fontFamily: 'monospace', fontSize: 12, paddingRight: 80 }}
                        />
                        <span
                          className="absolute right-3 top-1/2 -translate-y-1/2 caption"
                          style={{ color: 'var(--ash)' }}
                        >read-only</span>
                      </div>
                    </div>
                    <div>
                      <label className="label-sm mb-1.5 block" style={{ color: 'var(--charcoal)' }}>Client Secret Status</label>
                      <div className="flex items-center gap-3">
                        <input
                          className="input-field-rect"
                          type="password"
                          value="••••••••••••••••••••"
                          readOnly
                          style={{ fontFamily: 'monospace', flex: 1 }}
                        />
                        <button
                          className="btn-outline"
                          style={{ borderRadius: 9999, fontSize: 13, padding: '6px 14px', whiteSpace: 'nowrap' }}
                        >🔑 Update Secret</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
