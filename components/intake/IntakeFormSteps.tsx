'use client';

import { THEME, STYLES } from '@/lib/theme';
import type { IntakeFormData, EducationEntry, OBAEntry, EmploymentEntry, ResidentialEntry } from '@/lib/intake-form-schema';
import { detectEmploymentGaps } from '@/lib/intake-form-schema';

interface StepProps {
  data: IntakeFormData;
  onChange: (field: string, value: any) => void;
  errors: string[];
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

const fieldStyle: React.CSSProperties = {
  ...STYLES.input,
  marginBottom: 0,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: THEME.typography.fontSize.sm,
  fontWeight: THEME.typography.fontWeight.medium,
  color: THEME.colors.charcoal,
  fontFamily: THEME.typography.fontFamily.sans,
  marginBottom: THEME.spacing.xs,
};

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: THEME.spacing.lg,
};

const sectionStyle: React.CSSProperties = {
  marginBottom: THEME.spacing['2xl'],
};

const sectionTitleStyle: React.CSSProperties = {
  ...STYLES.heading,
  fontSize: THEME.typography.fontSize.lg,
  marginBottom: THEME.spacing.lg,
  paddingBottom: THEME.spacing.sm,
  borderBottom: `1px solid ${THEME.colors.borderLight}`,
};

function ErrorList({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <div style={{
      backgroundColor: THEME.colors.errorLight,
      border: `1px solid ${THEME.colors.error}`,
      borderRadius: THEME.layout.borderRadius,
      padding: THEME.spacing.lg,
      marginBottom: THEME.spacing.xl,
    }}>
      {errors.map((e, i) => (
        <p key={i} style={{ margin: i === 0 ? 0 : `${THEME.spacing.xs} 0 0`, color: THEME.colors.error, fontSize: THEME.typography.fontSize.sm, fontFamily: THEME.typography.fontFamily.sans }}>
          {e}
        </p>
      ))}
    </div>
  );
}

function SSNInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const masked = value ? `***-**-${value.replace(/\D/g, '').slice(-4) || '____'}` : '';
  return (
    <div>
      <input
        type="password"
        autoComplete="off"
        placeholder="XXX-XX-XXXX"
        value={value}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, '').slice(0, 9);
          onChange(raw);
        }}
        style={fieldStyle}
      />
      {value && (
        <span style={{ fontSize: THEME.typography.fontSize.xs, color: THEME.colors.charcoalMuted, fontFamily: THEME.typography.fontFamily.mono, marginTop: THEME.spacing.xs, display: 'block' }}>
          Showing: {masked}
        </span>
      )}
    </div>
  );
}

// ─── Step 1: General & Personal Info (Q1–Q13) ─────────────────

export function Step1({ data, onChange, errors }: StepProps) {
  return (
    <div>
      <ErrorList errors={errors} />

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Personal Information</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: THEME.spacing.lg }}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Q1. Full Legal Name *</label>
            <input style={fieldStyle} value={data.q1_full_legal_name} onChange={(e) => onChange('q1_full_legal_name', e.target.value)} placeholder="First Middle Last" />
          </div>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Q2. Other Names Used</label>
            <input style={fieldStyle} value={data.q2_other_names} onChange={(e) => onChange('q2_other_names', e.target.value)} placeholder="Maiden names, aliases, etc." />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: THEME.spacing.lg }}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Q3. Date of Birth *</label>
            <input type="date" style={fieldStyle} value={data.q3_date_of_birth} onChange={(e) => onChange('q3_date_of_birth', e.target.value)} />
          </div>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Q4. Social Security Number *</label>
            <SSNInput value={data.q4_ssn} onChange={(v) => onChange('q4_ssn', v)} />
          </div>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Q5. Country of Citizenship</label>
            <input style={fieldStyle} value={data.q5_country_of_citizenship} onChange={(e) => onChange('q5_country_of_citizenship', e.target.value)} />
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Residential Address</h3>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Q6. Street Address *</label>
          <input style={fieldStyle} value={data.q6_residential_address} onChange={(e) => onChange('q6_residential_address', e.target.value)} placeholder="123 Main St, Apt 4B" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: THEME.spacing.lg }}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Q7. City *</label>
            <input style={fieldStyle} value={data.q7_city} onChange={(e) => onChange('q7_city', e.target.value)} />
          </div>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Q8. State *</label>
            <select style={{ ...fieldStyle, cursor: 'pointer' }} value={data.q8_state} onChange={(e) => onChange('q8_state', e.target.value)}>
              <option value="">Select...</option>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Q9. ZIP Code *</label>
            <input style={fieldStyle} value={data.q9_zip} onChange={(e) => onChange('q9_zip', e.target.value)} placeholder="12345" />
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Contact Information</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: THEME.spacing.lg }}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Q10. Phone Number *</label>
            <input type="tel" style={fieldStyle} value={data.q10_phone} onChange={(e) => onChange('q10_phone', e.target.value)} placeholder="(555) 123-4567" />
          </div>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Q11. Email Address *</label>
            <input type="email" style={fieldStyle} value={data.q11_email} onChange={(e) => onChange('q11_email', e.target.value)} placeholder="advisor@example.com" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: THEME.spacing.lg }}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Q12. Marital Status</label>
            <select style={{ ...fieldStyle, cursor: 'pointer' }} value={data.q12_marital_status} onChange={(e) => onChange('q12_marital_status', e.target.value)}>
              <option value="">Select...</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
              <option value="Domestic Partnership">Domestic Partnership</option>
            </select>
          </div>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Q13. Number of Dependents</label>
            <input type="number" min="0" style={fieldStyle} value={data.q13_dependents} onChange={(e) => onChange('q13_dependents', e.target.value)} placeholder="0" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Qualifications & Insurance (Q14–Q18) ─────────────

export function Step2({ data, onChange, errors }: StepProps) {
  return (
    <div>
      <ErrorList errors={errors} />

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Registration & Licensing</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: THEME.spacing.lg }}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Q14. CRD Number *</label>
            <input style={fieldStyle} value={data.q14_crd_number} onChange={(e) => onChange('q14_crd_number', e.target.value)} placeholder="1234567" />
          </div>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Q15. Licenses Held *</label>
            <input style={fieldStyle} value={data.q15_licenses_held} onChange={(e) => onChange('q15_licenses_held', e.target.value)} placeholder="Series 7, Series 66, etc." />
          </div>
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Q16. States of License Registration</label>
          <input style={fieldStyle} value={data.q16_license_states} onChange={(e) => onChange('q16_license_states', e.target.value)} placeholder="TX, CA, NY, etc." />
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Errors & Omissions Insurance</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: THEME.spacing.lg }}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Q17. E&O Insurance Carrier</label>
            <input style={fieldStyle} value={data.q17_errors_omissions_carrier} onChange={(e) => onChange('q17_errors_omissions_carrier', e.target.value)} placeholder="Carrier name" />
          </div>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Q18. E&O Policy Number</label>
            <input style={fieldStyle} value={data.q18_eo_policy_number} onChange={(e) => onChange('q18_eo_policy_number', e.target.value)} placeholder="Policy #" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Education & OBAs (Q19–Q20) ───────────────────────

function EducationRow({ entry, index, onChange, onRemove, canRemove }: {
  entry: EducationEntry; index: number;
  onChange: (i: number, field: string, value: string) => void;
  onRemove: (i: number) => void;
  canRemove: boolean;
}) {
  return (
    <div style={{ ...STYLES.card, padding: THEME.spacing.lg, marginBottom: THEME.spacing.md, position: 'relative' }}>
      {canRemove && (
        <button onClick={() => onRemove(index)} style={{ ...STYLES.button.ghost, position: 'absolute', top: THEME.spacing.sm, right: THEME.spacing.sm, color: THEME.colors.error, fontSize: THEME.typography.fontSize.lg, padding: '4px 8px' }}>
          x
        </button>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: THEME.spacing.lg }}>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Institution</label>
          <input style={fieldStyle} value={entry.institution} onChange={(e) => onChange(index, 'institution', e.target.value)} placeholder="University / College" />
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Degree</label>
          <input style={fieldStyle} value={entry.degree} onChange={(e) => onChange(index, 'degree', e.target.value)} placeholder="B.S., M.B.A., etc." />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: THEME.spacing.lg }}>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Field of Study</label>
          <input style={fieldStyle} value={entry.fieldOfStudy} onChange={(e) => onChange(index, 'fieldOfStudy', e.target.value)} placeholder="Finance, Business, etc." />
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Graduation Date</label>
          <input type="month" style={fieldStyle} value={entry.graduationDate} onChange={(e) => onChange(index, 'graduationDate', e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function OBARow({ entry, index, onChange, onRemove }: {
  entry: OBAEntry; index: number;
  onChange: (i: number, field: string, value: any) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div style={{ ...STYLES.card, padding: THEME.spacing.lg, marginBottom: THEME.spacing.md, position: 'relative' }}>
      <button onClick={() => onRemove(index)} style={{ ...STYLES.button.ghost, position: 'absolute', top: THEME.spacing.sm, right: THEME.spacing.sm, color: THEME.colors.error, fontSize: THEME.typography.fontSize.lg, padding: '4px 8px' }}>
        x
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: THEME.spacing.lg }}>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Entity / Business Name</label>
          <input style={fieldStyle} value={entry.entityName} onChange={(e) => onChange(index, 'entityName', e.target.value)} />
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Your Position / Title</label>
          <input style={fieldStyle} value={entry.position} onChange={(e) => onChange(index, 'position', e.target.value)} />
        </div>
      </div>
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Description of Activity</label>
        <textarea style={{ ...fieldStyle, minHeight: '60px', resize: 'vertical' }} value={entry.description} onChange={(e) => onChange(index, 'description', e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: THEME.spacing.lg }}>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Start Date</label>
          <input type="month" style={fieldStyle} value={entry.startDate} onChange={(e) => onChange(index, 'startDate', e.target.value)} />
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Investment Related?</label>
          <select style={{ ...fieldStyle, cursor: 'pointer' }} value={entry.isInvestmentRelated ? 'yes' : 'no'} onChange={(e) => onChange(index, 'isInvestmentRelated', e.target.value === 'yes')}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Compensation Type</label>
          <select style={{ ...fieldStyle, cursor: 'pointer' }} value={entry.compensationType} onChange={(e) => onChange(index, 'compensationType', e.target.value)}>
            <option value="">Select...</option>
            <option value="Salary">Salary</option>
            <option value="Commission">Commission</option>
            <option value="Revenue Sharing">Revenue Sharing</option>
            <option value="Equity">Equity</option>
            <option value="None">None</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export function Step3({ data, onChange, errors }: StepProps) {
  const education = data.q19_education || [];
  const obas = data.q20_obas || [];

  const handleEduChange = (i: number, field: string, value: string) => {
    const updated = [...education];
    updated[i] = { ...updated[i], [field]: value };
    onChange('q19_education', updated);
  };

  const handleEduRemove = (i: number) => {
    onChange('q19_education', education.filter((_, idx) => idx !== i));
  };

  const handleOBAChange = (i: number, field: string, value: any) => {
    const updated = [...obas];
    updated[i] = { ...updated[i], [field]: value };
    onChange('q20_obas', updated);
  };

  const handleOBARemove = (i: number) => {
    onChange('q20_obas', obas.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <ErrorList errors={errors} />

      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: THEME.spacing.lg }}>
          <h3 style={{ ...sectionTitleStyle, marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>Q19. Education History *</h3>
          {education.length < 5 && (
            <button
              onClick={() => onChange('q19_education', [...education, { institution: '', degree: '', fieldOfStudy: '', graduationDate: '' }])}
              style={STYLES.button.secondary}
            >
              + Add Education
            </button>
          )}
        </div>
        {education.map((entry, i) => (
          <EducationRow key={i} entry={entry} index={i} onChange={handleEduChange} onRemove={handleEduRemove} canRemove={education.length > 1} />
        ))}
      </div>

      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: THEME.spacing.lg }}>
          <h3 style={{ ...sectionTitleStyle, marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>Q20. Other Business Activities (OBAs)</h3>
          {obas.length < 5 && (
            <button
              onClick={() => onChange('q20_obas', [...obas, { entityName: '', description: '', position: '', startDate: '', isInvestmentRelated: false, compensationType: '' }])}
              style={STYLES.button.secondary}
            >
              + Add OBA
            </button>
          )}
        </div>
        {obas.length === 0 && (
          <p style={{ ...STYLES.body, color: THEME.colors.charcoalMuted, fontStyle: 'italic' }}>
            No other business activities to report. Click &quot;+ Add OBA&quot; if applicable.
          </p>
        )}
        {obas.map((entry, i) => (
          <OBARow key={i} entry={entry} index={i} onChange={handleOBAChange} onRemove={handleOBARemove} />
        ))}
      </div>
    </div>
  );
}

// ─── Step 4: Employment, Residential & Disclosures (Q21–Q25) ──

function EmploymentRow({ entry, index, onChange, onRemove, canRemove }: {
  entry: EmploymentEntry; index: number;
  onChange: (i: number, field: string, value: string) => void;
  onRemove: (i: number) => void;
  canRemove: boolean;
}) {
  return (
    <div style={{ ...STYLES.card, padding: THEME.spacing.lg, marginBottom: THEME.spacing.md, position: 'relative' }}>
      {canRemove && (
        <button onClick={() => onRemove(index)} style={{ ...STYLES.button.ghost, position: 'absolute', top: THEME.spacing.sm, right: THEME.spacing.sm, color: THEME.colors.error, fontSize: THEME.typography.fontSize.lg, padding: '4px 8px' }}>
          x
        </button>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: THEME.spacing.lg }}>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Employer Name</label>
          <input style={fieldStyle} value={entry.employerName} onChange={(e) => onChange(index, 'employerName', e.target.value)} />
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Title / Position</label>
          <input style={fieldStyle} value={entry.title} onChange={(e) => onChange(index, 'title', e.target.value)} />
        </div>
      </div>
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Employer Address</label>
        <input style={fieldStyle} value={entry.employerAddress} onChange={(e) => onChange(index, 'employerAddress', e.target.value)} placeholder="Street, City, State ZIP" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: THEME.spacing.lg }}>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Start Date</label>
          <input type="month" style={fieldStyle} value={entry.startDate} onChange={(e) => onChange(index, 'startDate', e.target.value)} />
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>End Date</label>
          <input type="month" style={fieldStyle} value={entry.endDate} onChange={(e) => onChange(index, 'endDate', e.target.value)} placeholder="Leave blank if current" />
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Reason for Leaving</label>
          <input style={fieldStyle} value={entry.reasonForLeaving} onChange={(e) => onChange(index, 'reasonForLeaving', e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function ResidentialRow({ entry, index, onChange, onRemove, canRemove }: {
  entry: ResidentialEntry; index: number;
  onChange: (i: number, field: string, value: string) => void;
  onRemove: (i: number) => void;
  canRemove: boolean;
}) {
  return (
    <div style={{ ...STYLES.card, padding: THEME.spacing.lg, marginBottom: THEME.spacing.md, position: 'relative' }}>
      {canRemove && (
        <button onClick={() => onRemove(index)} style={{ ...STYLES.button.ghost, position: 'absolute', top: THEME.spacing.sm, right: THEME.spacing.sm, color: THEME.colors.error, fontSize: THEME.typography.fontSize.lg, padding: '4px 8px' }}>
          x
        </button>
      )}
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Street Address</label>
        <input style={fieldStyle} value={entry.address} onChange={(e) => onChange(index, 'address', e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: THEME.spacing.lg }}>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>City</label>
          <input style={fieldStyle} value={entry.city} onChange={(e) => onChange(index, 'city', e.target.value)} />
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>State</label>
          <input style={fieldStyle} value={entry.state} onChange={(e) => onChange(index, 'state', e.target.value)} placeholder="TX" />
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>ZIP</label>
          <input style={fieldStyle} value={entry.zip} onChange={(e) => onChange(index, 'zip', e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: THEME.spacing.lg }}>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>From</label>
          <input type="month" style={fieldStyle} value={entry.startDate} onChange={(e) => onChange(index, 'startDate', e.target.value)} />
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>To</label>
          <input type="month" style={fieldStyle} value={entry.endDate} onChange={(e) => onChange(index, 'endDate', e.target.value)} placeholder="Leave blank if current" />
        </div>
      </div>
    </div>
  );
}

export function Step4({ data, onChange, errors }: StepProps) {
  const employment = data.q21_employment_history || [];
  const residential = data.q22_residential_history || [];
  const empGaps = detectEmploymentGaps(employment);

  const handleEmpChange = (i: number, field: string, value: string) => {
    const updated = [...employment];
    updated[i] = { ...updated[i], [field]: value };
    onChange('q21_employment_history', updated);
  };
  const handleEmpRemove = (i: number) => {
    onChange('q21_employment_history', employment.filter((_, idx) => idx !== i));
  };

  const handleResChange = (i: number, field: string, value: string) => {
    const updated = [...residential];
    updated[i] = { ...updated[i], [field]: value };
    onChange('q22_residential_history', updated);
  };
  const handleResRemove = (i: number) => {
    onChange('q22_residential_history', residential.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <ErrorList errors={errors} />

      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: THEME.spacing.lg }}>
          <h3 style={{ ...sectionTitleStyle, marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>Q21. Employment History (10 years) *</h3>
          {employment.length < 10 && (
            <button
              onClick={() => onChange('q21_employment_history', [...employment, { employerName: '', employerAddress: '', title: '', startDate: '', endDate: '', reasonForLeaving: '' }])}
              style={STYLES.button.secondary}
            >
              + Add Employer
            </button>
          )}
        </div>
        {empGaps.length > 0 && (
          <div style={{ backgroundColor: THEME.colors.warningLight, border: `1px solid ${THEME.colors.warning}`, borderRadius: THEME.layout.borderRadius, padding: THEME.spacing.lg, marginBottom: THEME.spacing.lg }}>
            <p style={{ margin: 0, fontWeight: THEME.typography.fontWeight.semibold, color: THEME.colors.warning, fontSize: THEME.typography.fontSize.sm, fontFamily: THEME.typography.fontFamily.sans }}>Employment Gap Detected</p>
            {empGaps.map((g, i) => (
              <p key={i} style={{ margin: `${THEME.spacing.xs} 0 0`, color: THEME.colors.charcoal, fontSize: THEME.typography.fontSize.sm, fontFamily: THEME.typography.fontFamily.sans }}>{g}</p>
            ))}
          </div>
        )}
        {employment.map((entry, i) => (
          <EmploymentRow key={i} entry={entry} index={i} onChange={handleEmpChange} onRemove={handleEmpRemove} canRemove={employment.length > 1} />
        ))}
      </div>

      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: THEME.spacing.lg }}>
          <h3 style={{ ...sectionTitleStyle, marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>Q22. Residential History (5 years) *</h3>
          {residential.length < 10 && (
            <button
              onClick={() => onChange('q22_residential_history', [...residential, { address: '', city: '', state: '', zip: '', startDate: '', endDate: '' }])}
              style={STYLES.button.secondary}
            >
              + Add Address
            </button>
          )}
        </div>
        {residential.map((entry, i) => (
          <ResidentialRow key={i} entry={entry} index={i} onChange={handleResChange} onRemove={handleResRemove} canRemove={residential.length > 1} />
        ))}
      </div>

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Disclosure Questions (Q23–Q25)</h3>
        <p style={{ ...STYLES.body, color: THEME.colors.charcoalMuted, marginBottom: THEME.spacing.xl, fontSize: THEME.typography.fontSize.sm }}>
          Answer &quot;Yes&quot; or &quot;No&quot; to each of the following. If &quot;Yes&quot;, additional detail will be requested during processing.
        </p>

        {[
          { key: 'q23_disclosure_felony', label: 'Q23. Have you ever been charged with or convicted of a felony?' },
          { key: 'q24_disclosure_regulatory', label: 'Q24. Have you ever been the subject of a regulatory action by the SEC, FINRA, any state, or any foreign financial regulatory authority?' },
          { key: 'q25_disclosure_bankruptcy', label: 'Q25. Have you ever been the subject of a bankruptcy petition, or had a SIPC trustee appointed for any entity you controlled?' },
        ].map(({ key, label }) => (
          <div key={key} style={{ ...STYLES.card, padding: THEME.spacing.lg, marginBottom: THEME.spacing.md, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ ...STYLES.body, fontSize: THEME.typography.fontSize.sm, flex: 1, paddingRight: THEME.spacing.xl }}>{label}</span>
            <div style={{ display: 'flex', gap: THEME.spacing.md }}>
              {['Yes', 'No'].map((opt) => {
                const isSelected = opt === 'Yes' ? (data as any)[key] === true : (data as any)[key] === false;
                return (
                  <button
                    key={opt}
                    onClick={() => onChange(key, opt === 'Yes')}
                    style={{
                      ...(isSelected ? STYLES.button.primary : STYLES.button.secondary),
                      padding: `${THEME.spacing.sm} ${THEME.spacing.xl}`,
                      minWidth: '60px',
                      ...(opt === 'Yes' && isSelected ? { backgroundColor: THEME.colors.error } : {}),
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
