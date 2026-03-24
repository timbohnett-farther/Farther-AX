'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { THEME, STYLES } from '@/lib/theme';
import IntakeFormWizard from '@/components/intake/IntakeFormWizard';

export default function IntakeFormPage() {
  const params = useParams();
  const token = params.token as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advisorName, setAdvisorName] = useState('');
  const [formData, setFormData] = useState(null);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  useEffect(() => {
    async function validate() {
      try {
        const res = await fetch(`/api/intake/${token}`);
        const data = await res.json();

        if (!res.ok || !data.valid) {
          if (data.status === 'completed') {
            setAlreadyCompleted(true);
          } else {
            setError(data.error || 'This link is invalid or has expired.');
          }
          return;
        }

        setAdvisorName(data.advisorName || '');
        setFormData(data.formData || null);
      } catch {
        setError('Unable to load the intake form. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    validate();
  }, [token]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: THEME.colors.cream,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ ...STYLES.body, color: THEME.colors.charcoalMuted }}>Loading...</p>
      </div>
    );
  }

  if (alreadyCompleted) {
    return (
      <PageShell>
        <div style={{ textAlign: 'center', padding: THEME.spacing['3xl'] }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', backgroundColor: THEME.colors.successLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
            fontSize: '40px', color: THEME.colors.success, marginBottom: THEME.spacing.xl,
          }}>
            {'\u2713'}
          </div>
          <h2 style={{ ...STYLES.heading, fontSize: THEME.typography.fontSize['2xl'], marginBottom: THEME.spacing.lg }}>
            Already Submitted
          </h2>
          <p style={{ ...STYLES.body, color: THEME.colors.charcoalMuted }}>
            This intake form has already been completed. If you need to make changes, please contact your Farther Advisory Experience Manager.
          </p>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <div style={{ textAlign: 'center', padding: THEME.spacing['3xl'] }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', backgroundColor: THEME.colors.errorLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
            fontSize: '40px', color: THEME.colors.error, marginBottom: THEME.spacing.xl,
          }}>
            !
          </div>
          <h2 style={{ ...STYLES.heading, fontSize: THEME.typography.fontSize['2xl'], marginBottom: THEME.spacing.lg }}>
            Link Unavailable
          </h2>
          <p style={{ ...STYLES.body, color: THEME.colors.charcoalMuted }}>
            {error}
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <IntakeFormWizard token={token} advisorName={advisorName} initialData={formData} />
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: THEME.colors.cream,
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: THEME.colors.white,
        borderBottom: `1px solid ${THEME.colors.border}`,
        padding: `${THEME.spacing.lg} ${THEME.spacing['2xl']}`,
        display: 'flex',
        alignItems: 'center',
        gap: THEME.spacing.lg,
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          backgroundColor: THEME.colors.teal,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: THEME.colors.white,
          fontWeight: THEME.typography.fontWeight.bold,
          fontFamily: THEME.typography.fontFamily.serif,
          fontSize: THEME.typography.fontSize.lg,
        }}>
          F
        </div>
        <div>
          <h1 style={{
            ...STYLES.heading,
            fontSize: THEME.typography.fontSize.lg,
            margin: 0,
          }}>
            U4 & 2B Intake Form
          </h1>
          <p style={{
            margin: 0,
            fontSize: THEME.typography.fontSize.xs,
            color: THEME.colors.charcoalMuted,
            fontFamily: THEME.typography.fontFamily.sans,
          }}>
            Farther Advisory Experience
          </p>
        </div>
      </header>

      {/* Content */}
      <main style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: `${THEME.spacing['2xl']} ${THEME.spacing.xl}`,
      }}>
        {children}
      </main>
    </div>
  );
}
