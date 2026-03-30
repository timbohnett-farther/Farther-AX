'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTheme } from '@/lib/theme-provider';

// ── Design tokens (from useTheme, populated in component) ────────────────────
// Note: C is now populated dynamically from THEME inside the component
let C: any;

// ── Form state ──────────────────────────────────────────────────────────────
interface FormData {
  laptop_choice: string;
  has_monitors: boolean | null;
  ship_to: string;
  shipping_street: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  phone: string;
  travel_dates: string;
  has_commercial_office: boolean | null;
  has_it_vendor: boolean | null;
  it_vendor_company: string;
  it_vendor_contact: string;
  it_vendor_phone: string;
  it_vendor_email: string;
  software_suite: string;
  has_domain: boolean | null;
  domain_names: string;
  launch_date: string;
}

const defaultFormData: FormData = {
  laptop_choice: '',
  has_monitors: null,
  ship_to: '',
  shipping_street: '',
  shipping_city: '',
  shipping_state: '',
  shipping_zip: '',
  phone: '',
  travel_dates: '',
  has_commercial_office: null,
  has_it_vendor: null,
  it_vendor_company: '',
  it_vendor_contact: '',
  it_vendor_phone: '',
  it_vendor_email: '',
  software_suite: '',
  has_domain: null,
  domain_names: '',
  launch_date: '',
};

// ── Shared components ────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: `1px solid ${C.border}`, background: C.cardBgAlt,
  color: C.dark, fontSize: 14, fontFamily: "'Inter', system-ui, sans-serif",
  outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: C.slate,
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block',
};

function FormField({ label, required, children, wide }: { label: string; required?: boolean; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ marginBottom: 16, gridColumn: wide ? '1 / -1' : undefined }}>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: C.red, marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', required }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} required={required}
      style={inputStyle}
      onFocus={e => { e.target.style.borderColor = C.teal; e.target.style.boxShadow = `0 0 0 3px rgba(29,118,130,0.15)`; }}
      onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      style={{ ...inputStyle, resize: 'vertical' as const }}
      onFocus={e => { e.target.style.borderColor = C.teal; e.target.style.boxShadow = `0 0 0 3px rgba(29,118,130,0.15)`; }}
      onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}
    />
  );
}

function BooleanToggle({ value, onChange, yesLabel = 'Yes', noLabel = 'No' }: {
  value: boolean | null; onChange: (v: boolean) => void; yesLabel?: string; noLabel?: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {[{ val: true, label: yesLabel }, { val: false, label: noLabel }].map(opt => {
        const isActive = value === opt.val;
        return (
          <button key={String(opt.val)} type="button" onClick={() => onChange(opt.val)}
            style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${isActive ? C.teal : C.border}`,
              background: isActive ? `${C.teal}20` : C.cardBgAlt,
              color: isActive ? C.tealLight : C.slate,
              transition: 'all 0.15s',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Laptop toggle card ──────────────────────────────────────────────────────
function LaptopCard({ label, icon, selected, onClick }: { label: string; icon: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      flex: 1, padding: '24px 20px', borderRadius: 12, cursor: 'pointer',
      border: `2px solid ${selected ? C.teal : C.border}`,
      background: selected ? `${C.teal}10` : C.cardBgAlt,
      boxShadow: selected ? `0 0 20px rgba(29,118,130,0.2)` : 'none',
      transition: 'all 0.2s', textAlign: 'center',
    }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: selected ? C.tealLight : C.dark }}>{label}</div>
      {selected && <div style={{ fontSize: 11, color: C.tealLight, marginTop: 6 }}>Selected</div>}
    </button>
  );
}

// ── Section divider ─────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, num }: { title: string; subtitle?: string; num: number }) {
  return (
    <div style={{ marginBottom: 20, marginTop: num > 1 ? 36 : 0 }}>
      {num > 1 && <div style={{ height: 1, background: C.border, marginBottom: 28 }} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{
          width: 26, height: 26, borderRadius: '50%', fontSize: 12, fontWeight: 700,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: C.teal, color: '#fff',
        }}>{num}</span>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.dark, fontFamily: "'Inter', system-ui, sans-serif" }}>{title}</h2>
      </div>
      {subtitle && <p style={{ fontSize: 13, color: C.slate, marginLeft: 36 }}>{subtitle}</p>}
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────
export default function TechIntakePage() {
  const { THEME } = useTheme();
  const params = useParams();
  const token = params.token as string;

  // Populate design tokens from THEME
  C = {
    bg: THEME.colors.bg,
    cardBg: THEME.colors.surface,
    cardBgAlt: THEME.colors.surfaceSubtle,
    border: THEME.colors.border,
    borderFocus: THEME.colors.teal,
    teal: THEME.colors.teal,
    tealLight: THEME.colors.tealLight,
    dark: THEME.colors.text,
    slate: THEME.colors.textSecondary,
    green: '#10b981',
    greenBg: 'rgba(16,185,129,0.15)',
    amber: '#f59e0b',
    amberBg: 'rgba(245,158,11,0.15)',
    red: '#ef4444',
    redBg: 'rgba(239,68,68,0.15)',
    white: '#595959',
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advisorName, setAdvisorName] = useState('');
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Validate token + load prefill
  useEffect(() => {
    if (!token) return;
    fetch(`/api/tech-intake/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else if (data.status === 'completed') {
          setSubmitted(true);
          setAdvisorName(data.advisorName);
        } else {
          setAdvisorName(data.advisorName);
          if (data.prefill) {
            setFormData(prev => ({
              ...prev,
              phone: data.prefill.phone || '',
              shipping_city: data.prefill.city || '',
              shipping_state: data.prefill.state || '',
              shipping_zip: data.prefill.zip || '',
              launch_date: data.prefill.launchDate || '',
              software_suite: data.prefill.softwareSuite || '',
            }));
          }
        }
      })
      .catch(() => setError('Unable to load form. Please try again later.'))
      .finally(() => setLoading(false));
  }, [token]);

  const updateField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = async () => {
    if (!formData.laptop_choice) {
      setError('Please select a laptop before submitting.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tech-intake/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Submission failed');
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Submission failed. Please try again.');
    }
    setSubmitting(false);
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: C.bg }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${C.teal}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 14, color: C.slate }}>Loading form...</p>
        </div>
      </div>
    );
  }

  // ── Error state (only show full-page error when no form) ──────────────────
  if (error && !submitted && loading === false && !advisorName) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: C.bg }}>
        <div style={{ textAlign: 'center', maxWidth: 420, padding: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.redBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24 }}>!</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.dark, fontFamily: "'Inter', system-ui, sans-serif", marginBottom: 12 }}>Unable to Load Form</h1>
          <p style={{ fontSize: 14, color: C.slate, lineHeight: 1.6 }}>{error}</p>
        </div>
      </div>
    );
  }

  // ── Submitted state ───────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: C.bg }}>
        <div style={{ textAlign: 'center', maxWidth: 480, padding: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.greenBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24, color: C.green }}>&#10003;</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.dark, fontFamily: "'Inter', system-ui, sans-serif", marginBottom: 12 }}>You&apos;re All Set, {advisorName.split(' ')[0]}!</h1>
          <p style={{ fontSize: 15, color: C.slate, lineHeight: 1.7, marginBottom: 24 }}>
            Your Technology Intake Form has been submitted successfully. Your AX team will get your equipment configured and shipped!
          </p>
          <div style={{ padding: '16px 20px', borderRadius: 10, background: C.cardBg, border: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 13, color: C.slate }}>Questions? Reach out to your AXM or email <a href="mailto:ax@farther.com" style={{ color: C.tealLight, textDecoration: 'none' }}>ax@farther.com</a></p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form (single page) ───────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: C.bg, padding: '32px 16px',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{ maxWidth: 720, margin: '0 auto 32px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.tealLight, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Farther</p>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.dark, fontFamily: "'Inter', system-ui, sans-serif", marginBottom: 8 }}>
          Technology Intake Form
        </h1>
        <p style={{ fontSize: 14, color: C.slate }}>
          Welcome, {advisorName}. Let&apos;s get your tech setup ready for launch.
        </p>
      </div>

      {/* Form card */}
      <div style={{
        maxWidth: 720, margin: '0 auto',
        background: C.cardBg, border: `1px solid ${C.border}`,
        borderRadius: 14, padding: '32px 36px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.36)',
      }}>

        {/* Inline error banner */}
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 8, background: C.redBg, border: `1px solid rgba(239,68,68,0.3)`, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>!</span>
            <span style={{ fontSize: 13, color: C.red, fontWeight: 500 }}>{error}</span>
          </div>
        )}

        {/* ─── 1. Laptop Selection ──────────────────────────────────────── */}
        <SectionHeader num={1} title="Laptop Selection" subtitle="Choose your preferred laptop — both come fully configured." />
        <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
          <LaptopCard
            label='MacBook Pro 14"'
            icon="💻"
            selected={formData.laptop_choice === 'MacBook Pro 14'}
            onClick={() => updateField('laptop_choice', 'MacBook Pro 14')}
          />
          <LaptopCard
            label='Lenovo ThinkPad 14"'
            icon="🖥️"
            selected={formData.laptop_choice === 'Lenovo ThinkPad 14'}
            onClick={() => updateField('laptop_choice', 'Lenovo ThinkPad 14')}
          />
        </div>

        {/* ─── 2. Monitor Setup ─────────────────────────────────────────── */}
        <SectionHeader num={2} title="Monitor Setup" />
        <FormField label="Do you already have a monitor configuration you plan to keep?">
          <BooleanToggle value={formData.has_monitors} onChange={v => updateField('has_monitors', v)} />
        </FormField>
        {formData.has_monitors === false && (
          <div style={{ padding: '10px 16px', borderRadius: 8, background: `${C.teal}10`, border: `1px solid ${C.teal}25`, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>🖵</span>
            <span style={{ fontSize: 13, color: C.tealLight, fontWeight: 500 }}>Great — we&apos;ll ship you 2 x 27&quot; monitors along with your laptop</span>
          </div>
        )}

        {/* ─── 3. Shipping Info ──────────────────────────────────────────── */}
        <SectionHeader num={3} title="Shipping Information" subtitle="Where should we send your equipment?" />
        <FormField label="Ship to">
          <BooleanToggle value={formData.ship_to === 'Home' ? true : formData.ship_to === 'Office' ? false : null} onChange={v => updateField('ship_to', v ? 'Home' : 'Office')} yesLabel="Home" noLabel="Office" />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0 20px' }}>
          <FormField label="Street Address" required>
            <TextInput value={formData.shipping_street} onChange={v => updateField('shipping_street', v)} placeholder="123 Main St, Apt 4B" required />
          </FormField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '0 12px' }}>
          <FormField label="City">
            <TextInput value={formData.shipping_city} onChange={v => updateField('shipping_city', v)} placeholder="City" />
          </FormField>
          <FormField label="State">
            <TextInput value={formData.shipping_state} onChange={v => updateField('shipping_state', v)} placeholder="State" />
          </FormField>
          <FormField label="ZIP">
            <TextInput value={formData.shipping_zip} onChange={v => updateField('shipping_zip', v)} placeholder="ZIP" />
          </FormField>
        </div>
        <FormField label="Phone Number">
          <TextInput value={formData.phone} onChange={v => updateField('phone', v)} placeholder="(555) 123-4567" type="tel" />
        </FormField>

        {/* ─── 4. Travel / Availability ──────────────────────────────────── */}
        <SectionHeader num={4} title="Travel / Availability" />
        <FormField label="Will you be out of town within 3 weeks of your proposed start date? If so, provide dates to avoid.">
          <TextArea value={formData.travel_dates} onChange={v => updateField('travel_dates', v)} placeholder="e.g., March 10–14 (family trip) — or leave blank if no travel planned" rows={2} />
        </FormField>

        {/* ─── 5. Office & IT ────────────────────────────────────────────── */}
        <SectionHeader num={5} title="Office & IT" />
        <FormField label="Do you operate out of a dedicated commercial office space?">
          <BooleanToggle value={formData.has_commercial_office} onChange={v => updateField('has_commercial_office', v)} />
        </FormField>
        <FormField label="Do you have a third-party IT vendor?">
          <BooleanToggle value={formData.has_it_vendor} onChange={v => updateField('has_it_vendor', v)} />
        </FormField>
        {formData.has_it_vendor === true && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px', padding: '16px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.cardBgAlt, marginBottom: 16 }}>
            <FormField label="Company Name">
              <TextInput value={formData.it_vendor_company} onChange={v => updateField('it_vendor_company', v)} placeholder="IT Company LLC" />
            </FormField>
            <FormField label="Contact Name">
              <TextInput value={formData.it_vendor_contact} onChange={v => updateField('it_vendor_contact', v)} placeholder="John Smith" />
            </FormField>
            <FormField label="Phone">
              <TextInput value={formData.it_vendor_phone} onChange={v => updateField('it_vendor_phone', v)} placeholder="(555) 123-4567" type="tel" />
            </FormField>
            <FormField label="Email">
              <TextInput value={formData.it_vendor_email} onChange={v => updateField('it_vendor_email', v)} placeholder="support@itcompany.com" type="email" />
            </FormField>
          </div>
        )}

        {/* ─── 6. Software & Domains ─────────────────────────────────────── */}
        <SectionHeader num={6} title="Software & Domains" />
        <FormField label="What software productivity suite do you use?">
          <TextInput value={formData.software_suite} onChange={v => updateField('software_suite', v)} placeholder="e.g., Microsoft 365, Google Workspace" />
        </FormField>
        <FormField label="Do you have website domain names you plan to continue using at Farther?">
          <BooleanToggle value={formData.has_domain} onChange={v => updateField('has_domain', v)} />
        </FormField>
        {formData.has_domain === true && (
          <FormField label="Domain Names">
            <TextArea value={formData.domain_names} onChange={v => updateField('domain_names', v)} placeholder="e.g., johndoefinancial.com, jdwealth.com" rows={2} />
          </FormField>
        )}

        {/* ─── 7. Launch Date ────────────────────────────────────────────── */}
        <SectionHeader num={7} title="Launch Date" subtitle="Confirm with your AXM if you're unsure." />
        <FormField label="Proposed Launch Date">
          <TextInput value={formData.launch_date} onChange={v => updateField('launch_date', v)} type="date" />
        </FormField>

        {/* ─── Submit ────────────────────────────────────────────────────── */}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${C.border}`, textAlign: 'center' }}>
          <button type="button" onClick={handleSubmit} disabled={submitting}
            style={{
              padding: '14px 48px', borderRadius: 10, fontSize: 16, fontWeight: 700,
              border: 'none', background: submitting ? C.slate : `linear-gradient(135deg, ${C.teal}, ${C.tealLight})`,
              color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: submitting ? 'none' : `0 4px 20px rgba(29,118,130,0.35)`,
              transition: 'all 0.2s',
            }}>
            {submitting ? 'Submitting...' : 'Submit Tech Intake'}
          </button>
          <p style={{ fontSize: 12, color: C.slate, marginTop: 12 }}>
            Takes about 3–5 minutes. You can only submit once.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ maxWidth: 720, margin: '24px auto 0', textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: 'rgba(248,244,240,0.3)' }}>
          Farther Finance Advisors LLC &middot; Information submitted is encrypted in transit and stored securely.
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
