'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { THEME, STYLES } from '@/lib/theme';
import IntakeFormProgress from './IntakeFormProgress';
import { Step1, Step2, Step3, Step4 } from './IntakeFormSteps';
import {
  IntakeFormData,
  createEmptyFormData,
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
  validateAllSteps,
} from '@/lib/intake-form-schema';

interface IntakeFormWizardProps {
  token: string;
  advisorName: string;
  initialData: IntakeFormData | null;
}

const STEP_TITLES = [
  'General & Personal Information',
  'Qualifications & Insurance',
  'Education & Other Business Activities',
  'Employment, Residential & Disclosures',
];

const validators = [validateStep1, validateStep2, validateStep3, validateStep4];

export default function IntakeFormWizard({ token, advisorName, initialData }: IntakeFormWizardProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<IntakeFormData>(initialData || createEmptyFormData());
  const [errors, setErrors] = useState<string[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`intake_${token}`);
    if (saved && !initialData) {
      try {
        const parsed = JSON.parse(saved);
        setData(parsed);
      } catch {
        // ignore
      }
    }
  }, [token, initialData]);

  // Auto-save every 30 seconds
  const autoSave = useCallback(async () => {
    const current = dataRef.current;
    // Save to localStorage
    localStorage.setItem(`intake_${token}`, JSON.stringify(current));

    // Save to server
    setSaving(true);
    try {
      await fetch(`/api/intake/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: current }),
      });
      setLastSaved(new Date());
    } catch {
      // silent fail — localStorage is the backup
    } finally {
      setSaving(false);
    }
  }, [token]);

  useEffect(() => {
    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, [autoSave]);

  const handleChange = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors([]);
  };

  const handleNext = () => {
    const result = validators[step - 1](data);
    if (!result.valid) {
      setErrors(result.errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrors([]);
    setCompletedSteps((prev) => { const next = new Set(prev); next.add(step); return next; });

    if (step === 4) {
      // Show confirmation
      const allResult = validateAllSteps(data);
      if (!allResult.valid) {
        setErrors(allResult.errors);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setShowConfirmation(true);
    } else {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/intake/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: data }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Submission failed');
      }
      localStorage.removeItem(`intake_${token}`);
      setSubmitted(true);
    } catch (err: any) {
      setErrors([err.message]);
      setShowConfirmation(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Thank you screen
  if (submitted) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: THEME.spacing['3xl'] }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%', backgroundColor: THEME.colors.successLight,
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
          fontSize: '40px', color: THEME.colors.success, marginBottom: THEME.spacing.xl,
        }}>
          {'\u2713'}
        </div>
        <h2 style={{ ...STYLES.heading, fontSize: THEME.typography.fontSize['2xl'], marginBottom: THEME.spacing.lg }}>
          Thank You!
        </h2>
        <p style={{ ...STYLES.body, color: THEME.colors.charcoalMuted, lineHeight: THEME.typography.lineHeight.relaxed }}>
          Your U4 & 2B Intake Form has been submitted successfully. The Farther Advisory Experience team will review your information and follow up with any questions.
        </p>
        <p style={{ ...STYLES.body, color: THEME.colors.charcoalMuted, marginTop: THEME.spacing.xl, fontSize: THEME.typography.fontSize.sm }}>
          You may safely close this window.
        </p>
      </div>
    );
  }

  // Confirmation screen
  if (showConfirmation) {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <h2 style={{ ...STYLES.heading, fontSize: THEME.typography.fontSize.xl, marginBottom: THEME.spacing.xl }}>
          Review & Submit
        </h2>
        <p style={{ ...STYLES.body, color: THEME.colors.charcoalMuted, marginBottom: THEME.spacing.xl }}>
          Please review your information before submitting. Once submitted, this form cannot be edited.
        </p>

        {errors.length > 0 && (
          <div style={{ backgroundColor: THEME.colors.errorLight, border: `1px solid ${THEME.colors.error}`, borderRadius: THEME.layout.borderRadius, padding: THEME.spacing.lg, marginBottom: THEME.spacing.xl }}>
            {errors.map((e, i) => (
              <p key={i} style={{ margin: i === 0 ? 0 : `${THEME.spacing.xs} 0 0`, color: THEME.colors.error, fontSize: THEME.typography.fontSize.sm }}>{e}</p>
            ))}
          </div>
        )}

        <div style={{ ...STYLES.card, marginBottom: THEME.spacing.xl }}>
          <h4 style={{ ...STYLES.heading, fontSize: THEME.typography.fontSize.md, marginBottom: THEME.spacing.lg }}>Summary</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: THEME.spacing.lg }}>
            <div>
              <span style={STYLES.label}>Name</span>
              <p style={{ ...STYLES.body, margin: `${THEME.spacing.xs} 0 ${THEME.spacing.md}` }}>{data.q1_full_legal_name}</p>
            </div>
            <div>
              <span style={STYLES.label}>Date of Birth</span>
              <p style={{ ...STYLES.body, margin: `${THEME.spacing.xs} 0 ${THEME.spacing.md}` }}>{data.q3_date_of_birth}</p>
            </div>
            <div>
              <span style={STYLES.label}>SSN</span>
              <p style={{ ...STYLES.body, margin: `${THEME.spacing.xs} 0 ${THEME.spacing.md}` }}>***-**-{data.q4_ssn.slice(-4)}</p>
            </div>
            <div>
              <span style={STYLES.label}>CRD Number</span>
              <p style={{ ...STYLES.body, margin: `${THEME.spacing.xs} 0 ${THEME.spacing.md}` }}>{data.q14_crd_number}</p>
            </div>
            <div>
              <span style={STYLES.label}>Education</span>
              <p style={{ ...STYLES.body, margin: `${THEME.spacing.xs} 0 ${THEME.spacing.md}` }}>{data.q19_education.length} {data.q19_education.length === 1 ? 'entry' : 'entries'}</p>
            </div>
            <div>
              <span style={STYLES.label}>OBAs</span>
              <p style={{ ...STYLES.body, margin: `${THEME.spacing.xs} 0 ${THEME.spacing.md}` }}>{data.q20_obas.length} reported</p>
            </div>
            <div>
              <span style={STYLES.label}>Employment History</span>
              <p style={{ ...STYLES.body, margin: `${THEME.spacing.xs} 0 ${THEME.spacing.md}` }}>{data.q21_employment_history.length} {data.q21_employment_history.length === 1 ? 'entry' : 'entries'}</p>
            </div>
            <div>
              <span style={STYLES.label}>Disclosures</span>
              <p style={{ ...STYLES.body, margin: `${THEME.spacing.xs} 0 ${THEME.spacing.md}` }}>
                {data.q23_disclosure_felony || data.q24_disclosure_regulatory || data.q25_disclosure_bankruptcy
                  ? 'Yes — review required'
                  : 'None reported'}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: THEME.spacing.lg, justifyContent: 'flex-end' }}>
          <button
            onClick={() => { setShowConfirmation(false); setErrors([]); }}
            style={STYLES.button.secondary}
          >
            Go Back & Edit
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              ...STYLES.button.primary,
              backgroundColor: THEME.colors.success,
              opacity: submitting ? 0.7 : 1,
              minWidth: '160px',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Form'}
          </button>
        </div>
      </div>
    );
  }

  const stepComponent = () => {
    const props = { data, onChange: handleChange, errors };
    switch (step) {
      case 1: return <Step1 {...props} />;
      case 2: return <Step2 {...props} />;
      case 3: return <Step3 {...props} />;
      case 4: return <Step4 {...props} />;
      default: return null;
    }
  };

  return (
    <div>
      <IntakeFormProgress currentStep={step} completedSteps={completedSteps} />

      <div style={{ ...STYLES.card, marginBottom: THEME.spacing.xl }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: THEME.spacing.xl }}>
          <div>
            <h2 style={{ ...STYLES.heading, fontSize: THEME.typography.fontSize.xl }}>
              Step {step}: {STEP_TITLES[step - 1]}
            </h2>
            <p style={{ ...STYLES.body, color: THEME.colors.charcoalMuted, fontSize: THEME.typography.fontSize.sm, marginTop: THEME.spacing.xs }}>
              {advisorName ? `Completing for ${advisorName}` : 'Complete all required fields'}
            </p>
          </div>
          {lastSaved && (
            <span style={{
              fontSize: THEME.typography.fontSize.xs,
              color: THEME.colors.charcoalMuted,
              fontFamily: THEME.typography.fontFamily.sans,
            }}>
              {saving ? 'Saving...' : `Saved ${lastSaved.toLocaleTimeString()}`}
            </span>
          )}
        </div>

        {stepComponent()}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: THEME.spacing['2xl'],
          paddingTop: THEME.spacing.xl,
          borderTop: `1px solid ${THEME.colors.borderLight}`,
        }}>
          <button
            onClick={handleBack}
            disabled={step === 1}
            style={{
              ...STYLES.button.ghost,
              opacity: step === 1 ? 0.4 : 1,
              cursor: step === 1 ? 'default' : 'pointer',
            }}
          >
            Back
          </button>

          <div style={{ display: 'flex', gap: THEME.spacing.md, alignItems: 'center' }}>
            <button onClick={autoSave} style={STYLES.button.ghost}>
              Save Progress
            </button>
            <button onClick={handleNext} style={STYLES.button.primary}>
              {step === 4 ? 'Review & Submit' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
