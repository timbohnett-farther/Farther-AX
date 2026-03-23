'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

// ── Design tokens (matching Farther brand) ──────────────────────────────────
const C = {
  bg: '#111111',
  cardBg: '#2f2f2f',
  cardBgAlt: '#262626',
  border: 'rgba(250,247,242,0.08)',
  borderFocus: '#1d7682',
  teal: '#1d7682',
  tealLight: '#28a1af',
  dark: '#FAF7F2',
  slate: 'rgba(250,247,242,0.5)',
  green: '#10b981',
  greenBg: 'rgba(16,185,129,0.15)',
  amber: '#f59e0b',
  amberBg: 'rgba(245,158,11,0.15)',
  red: '#ef4444',
  redBg: 'rgba(239,68,68,0.15)',
  white: '#1a1a1a',
};

const STEPS = [
  { num: 1, label: 'General Information' },
  { num: 2, label: 'Personal Information' },
  { num: 3, label: 'Qualifications & Licensing' },
  { num: 4, label: 'Employment & Disclosures' },
];

// ── Form state types ────────────────────────────────────────────────────────
interface EducationEntry { institution: string; degree: string; year: string; }
interface ObaEntry { description: string; hours_per_month: string; compensation: string; }
interface EmploymentEntry { firm: string; address: string; position: string; start_date: string; end_date: string; reason_for_leaving: string; }
interface ResidentialEntry { address: string; city: string; state: string; zip: string; from_date: string; to_date: string; }

interface FormData {
  // Section 1
  full_name: string; business_address: string; other_jurisdictions: string;
  texas_clients: boolean | null; start_date: string; position_title: string;
  independent_contractor: boolean | null;
  // Section 2
  personal_email: string; date_of_birth: string; state_of_birth: string;
  height_ft: string; height_in: string; weight: string; sex: string;
  hair_color: string; eye_color: string; ssn: string; crd_number: string;
  series_65_registered: boolean | null;
  // Section 3
  iar_qualifications: string[];
  series_65_exam_date: string; other_designations: string;
  designations_confirmed: boolean | null; designations_comments: string;
  insurance_licensed: boolean | null; insurance_date: string; insurance_type: string;
  agency_name: string; agency_address: string; insurance_hours_month: string;
  insurance_trading_hours: string; is_cpa: boolean | null; cpa_year: string;
  cpa_confirmed: boolean | null; education: EducationEntry[];
  // Section 4
  other_business_activities: ObaEntry[];
  employment_history: EmploymentEntry[];
  residential_history: ResidentialEntry[];
  disclosures: { has_disclosures: boolean | null; details: string };
  income_new_client: boolean | null;
  compensation_asset_based: boolean | null;
}

const defaultFormData: FormData = {
  full_name: '', business_address: '', other_jurisdictions: '',
  texas_clients: null, start_date: '', position_title: '',
  independent_contractor: null,
  personal_email: '', date_of_birth: '', state_of_birth: '',
  height_ft: '', height_in: '', weight: '', sex: '',
  hair_color: '', eye_color: '', ssn: '', crd_number: '',
  series_65_registered: null,
  iar_qualifications: [],
  series_65_exam_date: '', other_designations: '',
  designations_confirmed: null, designations_comments: '',
  insurance_licensed: null, insurance_date: '', insurance_type: '',
  agency_name: '', agency_address: '', insurance_hours_month: '',
  insurance_trading_hours: '', is_cpa: null, cpa_year: '',
  cpa_confirmed: null, education: [{ institution: '', degree: '', year: '' }],
  other_business_activities: [],
  employment_history: [{ firm: '', address: '', position: '', start_date: '', end_date: '', reason_for_leaving: '' }],
  residential_history: [{ address: '', city: '', state: '', zip: '', from_date: '', to_date: '' }],
  disclosures: { has_disclosures: null, details: '' },
  income_new_client: null, compensation_asset_based: null,
};

// ── Shared components ────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: `1px solid ${C.border}`, background: C.cardBgAlt,
  color: C.dark, fontSize: 14, fontFamily: "'Fakt', system-ui, sans-serif",
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

function SelectInput({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <select
      value={value} onChange={e => onChange(e.target.value)}
      style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' as const }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
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

function CheckboxGroup({ options, selected, onChange }: {
  options: { value: string; label: string }[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter(s => s !== val) : [...selected, val]);
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(o => {
        const isChecked = selected.includes(o.value);
        return (
          <button key={o.value} type="button" onClick={() => toggle(o.value)}
            style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${isChecked ? C.teal : C.border}`,
              background: isChecked ? `${C.teal}20` : C.cardBgAlt,
              color: isChecked ? C.tealLight : C.slate,
              transition: 'all 0.15s',
            }}
          >
            {isChecked ? '✓ ' : ''}{o.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────
export default function U4FormPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advisorName, setAdvisorName] = useState('');
  const [tokenStatus, setTokenStatus] = useState<string>('');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) return;
    fetch(`/api/u4-2b/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else if (data.status === 'completed') {
          setSubmitted(true);
          setAdvisorName(data.advisorName);
        } else {
          setAdvisorName(data.advisorName);
          setTokenStatus(data.status);
          if (data.contactEmail) {
            setFormData(prev => ({ ...prev, personal_email: data.contactEmail }));
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
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        height_ft: formData.height_ft ? parseInt(formData.height_ft) : null,
        height_in: formData.height_in ? parseInt(formData.height_in) : null,
        weight: formData.weight ? parseInt(formData.weight) : null,
      };

      const res = await fetch(`/api/u4-2b/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  // ── Loading / Error / Submitted states ────────────────────────────────────
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

  if (error && !submitted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: C.bg }}>
        <div style={{ textAlign: 'center', maxWidth: 420, padding: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.redBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24 }}>!</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif", marginBottom: 12 }}>Unable to Load Form</h1>
          <p style={{ fontSize: 14, color: C.slate, lineHeight: 1.6 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: C.bg }}>
        <div style={{ textAlign: 'center', maxWidth: 480, padding: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.greenBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24, color: C.green }}>&#10003;</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif", marginBottom: 12 }}>Thank You, {advisorName.split(' ')[0]}!</h1>
          <p style={{ fontSize: 15, color: C.slate, lineHeight: 1.7, marginBottom: 24 }}>
            Your U4 & 2B Intake Form has been submitted successfully. Our compliance team has been notified and your Farther AX team will be in touch with next steps.
          </p>
          <div style={{ padding: '16px 20px', borderRadius: 10, background: C.cardBg, border: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 13, color: C.slate }}>Questions? Reach out to your AXM or email <a href="mailto:ax@farther.com" style={{ color: C.tealLight, textDecoration: 'none' }}>ax@farther.com</a></p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form render ──────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: C.bg, padding: '32px 16px',
      fontFamily: "'Fakt', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{ maxWidth: 720, margin: '0 auto 32px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.tealLight, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Farther</p>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif", marginBottom: 8 }}>
          U4 & 2B Intake Form
        </h1>
        <p style={{ fontSize: 14, color: C.slate }}>
          Welcome, {advisorName}. Please complete all sections below.
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ maxWidth: 720, margin: '0 auto 32px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {STEPS.map(s => (
            <div key={s.num} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                height: 4, borderRadius: 2, marginBottom: 8,
                background: step >= s.num ? C.teal : C.border,
                transition: 'background 0.3s',
              }} />
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%', fontSize: 11, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: step >= s.num ? C.teal : 'transparent',
                  color: step >= s.num ? '#fff' : C.slate,
                  border: `1px solid ${step >= s.num ? C.teal : C.border}`,
                }}>
                  {step > s.num ? '✓' : s.num}
                </span>
                <span style={{ fontSize: 11, color: step >= s.num ? C.dark : C.slate, fontWeight: step === s.num ? 600 : 400 }}>
                  {s.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form card */}
      <div style={{
        maxWidth: 720, margin: '0 auto',
        background: C.cardBg, border: `1px solid ${C.border}`,
        borderRadius: 14, padding: '32px 36px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.36)',
      }}>
        {/* Step 1: General Information */}
        {step === 1 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif", marginBottom: 4 }}>
              General Information
            </h2>
            <p style={{ fontSize: 13, color: C.slate, marginBottom: 24 }}>Basic business and registration details.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
              <FormField label="Full Legal Name" required wide>
                <TextInput value={formData.full_name} onChange={v => updateField('full_name', v)} placeholder="First Middle Last" required />
              </FormField>

              <FormField label="Business Address" required wide>
                <TextArea value={formData.business_address} onChange={v => updateField('business_address', v)} placeholder="Street, City, State, ZIP" rows={2} />
              </FormField>

              <FormField label="Other Jurisdictions Registered In" wide>
                <TextArea value={formData.other_jurisdictions} onChange={v => updateField('other_jurisdictions', v)} placeholder="List any states/jurisdictions where you are registered" rows={2} />
              </FormField>

              <FormField label="Will you have clients in Texas?">
                <BooleanToggle value={formData.texas_clients} onChange={v => updateField('texas_clients', v)} />
              </FormField>

              <FormField label="Anticipated Start Date">
                <TextInput value={formData.start_date} onChange={v => updateField('start_date', v)} type="date" />
              </FormField>

              <FormField label="Position / Title" required>
                <TextInput value={formData.position_title} onChange={v => updateField('position_title', v)} placeholder="e.g., Investment Adviser Representative" />
              </FormField>

              <FormField label="Independent Contractor?">
                <BooleanToggle value={formData.independent_contractor} onChange={v => updateField('independent_contractor', v)} />
              </FormField>
            </div>
          </>
        )}

        {/* Step 2: Personal Information */}
        {step === 2 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif", marginBottom: 4 }}>
              Personal Information
            </h2>
            <p style={{ fontSize: 13, color: C.slate, marginBottom: 24 }}>Required for regulatory filings. This information is stored securely.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
              <FormField label="Personal Email" required>
                <TextInput value={formData.personal_email} onChange={v => updateField('personal_email', v)} type="email" placeholder="you@email.com" required />
              </FormField>

              <FormField label="Date of Birth" required>
                <TextInput value={formData.date_of_birth} onChange={v => updateField('date_of_birth', v)} type="date" required />
              </FormField>

              <FormField label="State of Birth">
                <TextInput value={formData.state_of_birth} onChange={v => updateField('state_of_birth', v)} placeholder="e.g., California" />
              </FormField>

              <FormField label="Sex">
                <SelectInput value={formData.sex} onChange={v => updateField('sex', v)} placeholder="— Select —" options={[
                  { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' },
                ]} />
              </FormField>

              <FormField label="Height">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <TextInput value={formData.height_ft} onChange={v => updateField('height_ft', v)} placeholder="ft" />
                  <span style={{ color: C.slate, fontSize: 13 }}>ft</span>
                  <TextInput value={formData.height_in} onChange={v => updateField('height_in', v)} placeholder="in" />
                  <span style={{ color: C.slate, fontSize: 13 }}>in</span>
                </div>
              </FormField>

              <FormField label="Weight (lbs)">
                <TextInput value={formData.weight} onChange={v => updateField('weight', v)} placeholder="e.g., 175" />
              </FormField>

              <FormField label="Hair Color">
                <SelectInput value={formData.hair_color} onChange={v => updateField('hair_color', v)} placeholder="— Select —" options={[
                  { value: 'Black', label: 'Black' }, { value: 'Brown', label: 'Brown' },
                  { value: 'Blonde', label: 'Blonde' }, { value: 'Red', label: 'Red' },
                  { value: 'Gray', label: 'Gray' }, { value: 'White', label: 'White' },
                  { value: 'Bald', label: 'Bald' }, { value: 'Other', label: 'Other' },
                ]} />
              </FormField>

              <FormField label="Eye Color">
                <SelectInput value={formData.eye_color} onChange={v => updateField('eye_color', v)} placeholder="— Select —" options={[
                  { value: 'Brown', label: 'Brown' }, { value: 'Blue', label: 'Blue' },
                  { value: 'Green', label: 'Green' }, { value: 'Hazel', label: 'Hazel' },
                  { value: 'Gray', label: 'Gray' }, { value: 'Other', label: 'Other' },
                ]} />
              </FormField>

              <FormField label="Social Security Number" required>
                <TextInput value={formData.ssn} onChange={v => updateField('ssn', v)} placeholder="XXX-XX-XXXX" required />
              </FormField>

              <FormField label="CRD Number" required>
                <TextInput value={formData.crd_number} onChange={v => updateField('crd_number', v)} placeholder="e.g., 1234567" required />
              </FormField>

              <FormField label="Are you currently Series 65 registered?" wide>
                <BooleanToggle value={formData.series_65_registered} onChange={v => updateField('series_65_registered', v)} />
              </FormField>
            </div>

            <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(29,118,130,0.06)', border: `1px solid rgba(29,118,130,0.15)`, marginTop: 8 }}>
              <p style={{ fontSize: 12, color: C.tealLight }}>
                Your SSN is transmitted securely over HTTPS and stored with restricted access. Only compliance personnel can view it.
              </p>
            </div>
          </>
        )}

        {/* Step 3: Qualifications & Licensing */}
        {step === 3 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif", marginBottom: 4 }}>
              Qualifications & Licensing
            </h2>
            <p style={{ fontSize: 13, color: C.slate, marginBottom: 24 }}>Professional qualifications, designations, and licensing information.</p>

            <FormField label="IAR Qualifications (select all that apply)">
              <CheckboxGroup
                options={[
                  { value: 'Series 65', label: 'Series 65' },
                  { value: 'Series 66', label: 'Series 66' },
                  { value: 'Series 7', label: 'Series 7' },
                  { value: 'CFP', label: 'CFP' },
                  { value: 'CFA', label: 'CFA' },
                  { value: 'ChFC', label: 'ChFC' },
                  { value: 'CIMA', label: 'CIMA' },
                  { value: 'CPA/PFS', label: 'CPA/PFS' },
                  { value: 'JD', label: 'JD' },
                  { value: 'PhD', label: 'PhD (Finance)' },
                ]}
                selected={formData.iar_qualifications}
                onChange={v => updateField('iar_qualifications', v)}
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
              <FormField label="Series 65 Exam Date (if applicable)">
                <TextInput value={formData.series_65_exam_date} onChange={v => updateField('series_65_exam_date', v)} type="date" />
              </FormField>

              <FormField label="Other Professional Designations">
                <TextInput value={formData.other_designations} onChange={v => updateField('other_designations', v)} placeholder="e.g., CLU, CPWA, AIF" />
              </FormField>
            </div>

            <FormField label="I confirm the designations listed above are current and in good standing">
              <BooleanToggle value={formData.designations_confirmed} onChange={v => updateField('designations_confirmed', v)} yesLabel="Confirmed" noLabel="Need to Update" />
            </FormField>

            {formData.designations_confirmed === false && (
              <FormField label="Please explain">
                <TextArea value={formData.designations_comments} onChange={v => updateField('designations_comments', v)} placeholder="Which designations need updating?" />
              </FormField>
            )}

            <div style={{ height: 1, background: C.border, margin: '20px 0' }} />

            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.dark, marginBottom: 16 }}>Insurance Licensing</h3>

            <FormField label="Are you licensed to sell insurance?">
              <BooleanToggle value={formData.insurance_licensed} onChange={v => updateField('insurance_licensed', v)} />
            </FormField>

            {formData.insurance_licensed && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                <FormField label="License Date">
                  <TextInput value={formData.insurance_date} onChange={v => updateField('insurance_date', v)} type="date" />
                </FormField>
                <FormField label="Insurance Type">
                  <TextInput value={formData.insurance_type} onChange={v => updateField('insurance_type', v)} placeholder="e.g., Life, Health, Variable" />
                </FormField>
                <FormField label="Agency / Broker-Dealer Name">
                  <TextInput value={formData.agency_name} onChange={v => updateField('agency_name', v)} />
                </FormField>
                <FormField label="Agency Address">
                  <TextInput value={formData.agency_address} onChange={v => updateField('agency_address', v)} />
                </FormField>
                <FormField label="Hours per Month on Insurance">
                  <TextInput value={formData.insurance_hours_month} onChange={v => updateField('insurance_hours_month', v)} placeholder="e.g., 10" />
                </FormField>
                <FormField label="Trading Hours for Insurance Activities">
                  <TextInput value={formData.insurance_trading_hours} onChange={v => updateField('insurance_trading_hours', v)} placeholder="e.g., After market hours" />
                </FormField>
              </div>
            )}

            <div style={{ height: 1, background: C.border, margin: '20px 0' }} />

            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.dark, marginBottom: 16 }}>CPA Status</h3>

            <FormField label="Are you a CPA?">
              <BooleanToggle value={formData.is_cpa} onChange={v => updateField('is_cpa', v)} />
            </FormField>

            {formData.is_cpa && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                <FormField label="Year Obtained">
                  <TextInput value={formData.cpa_year} onChange={v => updateField('cpa_year', v)} placeholder="e.g., 2015" />
                </FormField>
                <FormField label="CPA License Active & In Good Standing?">
                  <BooleanToggle value={formData.cpa_confirmed} onChange={v => updateField('cpa_confirmed', v)} />
                </FormField>
              </div>
            )}

            <div style={{ height: 1, background: C.border, margin: '20px 0' }} />

            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.dark, marginBottom: 16 }}>Education</h3>
            {formData.education.map((edu, i) => (
              <div key={i} style={{ padding: '16px 18px', borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 12, background: C.cardBgAlt }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.tealLight }}>Education #{i + 1}</span>
                  {formData.education.length > 1 && (
                    <button type="button" onClick={() => {
                      const updated = formData.education.filter((_, idx) => idx !== i);
                      updateField('education', updated);
                    }} style={{ fontSize: 11, color: C.red, background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: '0 12px' }}>
                  <FormField label="Institution">
                    <TextInput value={edu.institution} onChange={v => {
                      const updated = [...formData.education];
                      updated[i] = { ...updated[i], institution: v };
                      updateField('education', updated);
                    }} placeholder="University name" />
                  </FormField>
                  <FormField label="Degree">
                    <TextInput value={edu.degree} onChange={v => {
                      const updated = [...formData.education];
                      updated[i] = { ...updated[i], degree: v };
                      updateField('education', updated);
                    }} placeholder="e.g., BS Finance" />
                  </FormField>
                  <FormField label="Year">
                    <TextInput value={edu.year} onChange={v => {
                      const updated = [...formData.education];
                      updated[i] = { ...updated[i], year: v };
                      updateField('education', updated);
                    }} placeholder="2010" />
                  </FormField>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => updateField('education', [...formData.education, { institution: '', degree: '', year: '' }])}
              style={{ fontSize: 13, color: C.tealLight, background: 'none', border: `1px dashed ${C.teal}`, borderRadius: 8, padding: '8px 16px', cursor: 'pointer', width: '100%' }}>
              + Add Education
            </button>
          </>
        )}

        {/* Step 4: Employment & Disclosures */}
        {step === 4 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.dark, fontFamily: "'ABC Arizona Text', Georgia, serif", marginBottom: 4 }}>
              Employment & Disclosures
            </h2>
            <p style={{ fontSize: 13, color: C.slate, marginBottom: 24 }}>Outside business activities, employment history, and regulatory disclosures.</p>

            {/* OBA */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.dark, marginBottom: 12 }}>Other Business Activities (OBA)</h3>
            <p style={{ fontSize: 12, color: C.slate, marginBottom: 16 }}>List any outside business activities you are engaged in or plan to engage in.</p>

            {formData.other_business_activities.map((oba, i) => (
              <div key={i} style={{ padding: '16px 18px', borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 12, background: C.cardBgAlt }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.tealLight }}>Activity #{i + 1}</span>
                  <button type="button" onClick={() => {
                    updateField('other_business_activities', formData.other_business_activities.filter((_, idx) => idx !== i));
                  }} style={{ fontSize: 11, color: C.red, background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                </div>
                <FormField label="Description" wide>
                  <TextArea value={oba.description} onChange={v => {
                    const updated = [...formData.other_business_activities];
                    updated[i] = { ...updated[i], description: v };
                    updateField('other_business_activities', updated);
                  }} placeholder="Describe the business activity" rows={2} />
                </FormField>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                  <FormField label="Hours per Month">
                    <TextInput value={oba.hours_per_month} onChange={v => {
                      const updated = [...formData.other_business_activities];
                      updated[i] = { ...updated[i], hours_per_month: v };
                      updateField('other_business_activities', updated);
                    }} placeholder="e.g., 10" />
                  </FormField>
                  <FormField label="Compensation Type">
                    <TextInput value={oba.compensation} onChange={v => {
                      const updated = [...formData.other_business_activities];
                      updated[i] = { ...updated[i], compensation: v };
                      updateField('other_business_activities', updated);
                    }} placeholder="e.g., Fee-based, Commission" />
                  </FormField>
                </div>
              </div>
            ))}

            {formData.other_business_activities.length < 5 && (
              <button type="button" onClick={() => updateField('other_business_activities', [...formData.other_business_activities, { description: '', hours_per_month: '', compensation: '' }])}
                style={{ fontSize: 13, color: C.tealLight, background: 'none', border: `1px dashed ${C.teal}`, borderRadius: 8, padding: '8px 16px', cursor: 'pointer', width: '100%', marginBottom: 24 }}>
                + Add OBA
              </button>
            )}

            {/* Employment History */}
            <div style={{ height: 1, background: C.border, margin: '24px 0' }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.dark, marginBottom: 12 }}>10-Year Employment History</h3>
            <p style={{ fontSize: 12, color: C.slate, marginBottom: 16 }}>List all employment for the past 10 years, starting with the most recent.</p>

            {formData.employment_history.map((emp, i) => (
              <div key={i} style={{ padding: '16px 18px', borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 12, background: C.cardBgAlt }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.tealLight }}>Position #{i + 1}</span>
                  {formData.employment_history.length > 1 && (
                    <button type="button" onClick={() => {
                      updateField('employment_history', formData.employment_history.filter((_, idx) => idx !== i));
                    }} style={{ fontSize: 11, color: C.red, background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                  <FormField label="Firm / Employer" required>
                    <TextInput value={emp.firm} onChange={v => {
                      const updated = [...formData.employment_history];
                      updated[i] = { ...updated[i], firm: v };
                      updateField('employment_history', updated);
                    }} placeholder="Company name" />
                  </FormField>
                  <FormField label="Position">
                    <TextInput value={emp.position} onChange={v => {
                      const updated = [...formData.employment_history];
                      updated[i] = { ...updated[i], position: v };
                      updateField('employment_history', updated);
                    }} placeholder="Title/Role" />
                  </FormField>
                  <FormField label="Address" wide>
                    <TextInput value={emp.address} onChange={v => {
                      const updated = [...formData.employment_history];
                      updated[i] = { ...updated[i], address: v };
                      updateField('employment_history', updated);
                    }} placeholder="City, State" />
                  </FormField>
                  <FormField label="Start Date">
                    <TextInput value={emp.start_date} onChange={v => {
                      const updated = [...formData.employment_history];
                      updated[i] = { ...updated[i], start_date: v };
                      updateField('employment_history', updated);
                    }} type="date" />
                  </FormField>
                  <FormField label="End Date">
                    <TextInput value={emp.end_date} onChange={v => {
                      const updated = [...formData.employment_history];
                      updated[i] = { ...updated[i], end_date: v };
                      updateField('employment_history', updated);
                    }} type="date" />
                  </FormField>
                  <FormField label="Reason for Leaving" wide>
                    <TextInput value={emp.reason_for_leaving} onChange={v => {
                      const updated = [...formData.employment_history];
                      updated[i] = { ...updated[i], reason_for_leaving: v };
                      updateField('employment_history', updated);
                    }} placeholder="e.g., Seeking independence" />
                  </FormField>
                </div>
              </div>
            ))}

            <button type="button" onClick={() => updateField('employment_history', [...formData.employment_history, { firm: '', address: '', position: '', start_date: '', end_date: '', reason_for_leaving: '' }])}
              style={{ fontSize: 13, color: C.tealLight, background: 'none', border: `1px dashed ${C.teal}`, borderRadius: 8, padding: '8px 16px', cursor: 'pointer', width: '100%', marginBottom: 24 }}>
              + Add Employment
            </button>

            {/* Residential History */}
            <div style={{ height: 1, background: C.border, margin: '24px 0' }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.dark, marginBottom: 12 }}>5-Year Residential History</h3>
            <p style={{ fontSize: 12, color: C.slate, marginBottom: 16 }}>List all residential addresses for the past 5 years.</p>

            {formData.residential_history.map((res, i) => (
              <div key={i} style={{ padding: '16px 18px', borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 12, background: C.cardBgAlt }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.tealLight }}>Address #{i + 1}</span>
                  {formData.residential_history.length > 1 && (
                    <button type="button" onClick={() => {
                      updateField('residential_history', formData.residential_history.filter((_, idx) => idx !== i));
                    }} style={{ fontSize: 11, color: C.red, background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                  <FormField label="Street Address" wide>
                    <TextInput value={res.address} onChange={v => {
                      const updated = [...formData.residential_history];
                      updated[i] = { ...updated[i], address: v };
                      updateField('residential_history', updated);
                    }} placeholder="123 Main St" />
                  </FormField>
                  <FormField label="City">
                    <TextInput value={res.city} onChange={v => {
                      const updated = [...formData.residential_history];
                      updated[i] = { ...updated[i], city: v };
                      updateField('residential_history', updated);
                    }} />
                  </FormField>
                  <FormField label="State">
                    <TextInput value={res.state} onChange={v => {
                      const updated = [...formData.residential_history];
                      updated[i] = { ...updated[i], state: v };
                      updateField('residential_history', updated);
                    }} />
                  </FormField>
                  <FormField label="ZIP">
                    <TextInput value={res.zip} onChange={v => {
                      const updated = [...formData.residential_history];
                      updated[i] = { ...updated[i], zip: v };
                      updateField('residential_history', updated);
                    }} />
                  </FormField>
                  <FormField label="From">
                    <TextInput value={res.from_date} onChange={v => {
                      const updated = [...formData.residential_history];
                      updated[i] = { ...updated[i], from_date: v };
                      updateField('residential_history', updated);
                    }} type="date" />
                  </FormField>
                  <FormField label="To">
                    <TextInput value={res.to_date} onChange={v => {
                      const updated = [...formData.residential_history];
                      updated[i] = { ...updated[i], to_date: v };
                      updateField('residential_history', updated);
                    }} type="date" />
                  </FormField>
                </div>
              </div>
            ))}

            <button type="button" onClick={() => updateField('residential_history', [...formData.residential_history, { address: '', city: '', state: '', zip: '', from_date: '', to_date: '' }])}
              style={{ fontSize: 13, color: C.tealLight, background: 'none', border: `1px dashed ${C.teal}`, borderRadius: 8, padding: '8px 16px', cursor: 'pointer', width: '100%', marginBottom: 24 }}>
              + Add Address
            </button>

            {/* Disclosures */}
            <div style={{ height: 1, background: C.border, margin: '24px 0' }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.dark, marginBottom: 12 }}>Disclosures</h3>

            <FormField label="Do you have any regulatory, civil, or criminal disclosures?">
              <BooleanToggle value={formData.disclosures.has_disclosures} onChange={v => updateField('disclosures', { ...formData.disclosures, has_disclosures: v })} />
            </FormField>

            {formData.disclosures.has_disclosures && (
              <FormField label="Please provide details">
                <TextArea value={formData.disclosures.details} onChange={v => updateField('disclosures', { ...formData.disclosures, details: v })} placeholder="Describe any disclosures..." rows={4} />
              </FormField>
            )}

            {/* Compensation */}
            <div style={{ height: 1, background: C.border, margin: '24px 0' }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.dark, marginBottom: 12 }}>Compensation</h3>

            <FormField label="Will you receive income from new client assets?">
              <BooleanToggle value={formData.income_new_client} onChange={v => updateField('income_new_client', v)} />
            </FormField>

            <FormField label="Is your compensation primarily asset-based?">
              <BooleanToggle value={formData.compensation_asset_based} onChange={v => updateField('compensation_asset_based', v)} />
            </FormField>
          </>
        )}

        {/* Navigation buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
          {step > 1 ? (
            <button type="button" onClick={() => { setStep(step - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{
                padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                border: `1px solid ${C.border}`, background: C.cardBgAlt, color: C.slate, cursor: 'pointer',
              }}>
              Back
            </button>
          ) : <div />}

          {step < 4 ? (
            <button type="button" onClick={() => { setStep(step + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{
                padding: '10px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                border: 'none', background: `linear-gradient(135deg, ${C.teal}, ${C.tealLight})`,
                color: '#fff', cursor: 'pointer', boxShadow: `0 4px 16px rgba(29,118,130,0.3)`,
              }}>
              Save & Continue
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={submitting}
              style={{
                padding: '12px 36px', borderRadius: 8, fontSize: 15, fontWeight: 700,
                border: 'none', background: submitting ? C.slate : `linear-gradient(135deg, ${C.teal}, ${C.tealLight})`,
                color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: submitting ? 'none' : `0 4px 16px rgba(29,118,130,0.3)`,
              }}>
              {submitting ? 'Submitting...' : 'Submit Form'}
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ maxWidth: 720, margin: '24px auto 0', textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: 'rgba(250,247,242,0.3)' }}>
          Farther Finance Advisors LLC &middot; Information submitted is encrypted in transit and stored securely.
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
