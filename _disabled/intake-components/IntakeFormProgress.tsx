'use client';

import { THEME } from '@/lib/theme';

const STEPS = [
  { num: 1, title: 'Personal Info' },
  { num: 2, title: 'Qualifications' },
  { num: 3, title: 'Education & OBAs' },
  { num: 4, title: 'Employment & Disclosures' },
];

interface IntakeFormProgressProps {
  currentStep: number;
  completedSteps: Set<number>;
}

export default function IntakeFormProgress({ currentStep, completedSteps }: IntakeFormProgressProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: THEME.spacing['2xl'] }}>
      {STEPS.map((step, i) => {
        const isActive = step.num === currentStep;
        const isCompleted = completedSteps.has(step.num);
        const isLast = i === STEPS.length - 1;

        return (
          <div key={step.num} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '100px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: THEME.typography.fontSize.sm,
                  fontWeight: THEME.typography.fontWeight.bold,
                  fontFamily: THEME.typography.fontFamily.sans,
                  backgroundColor: isCompleted ? THEME.colors.success : isActive ? THEME.colors.teal : THEME.colors.creamDark,
                  color: isCompleted || isActive ? THEME.colors.white : THEME.colors.charcoalMuted,
                  transition: `all ${THEME.transitions.normal}`,
                }}
              >
                {isCompleted ? '\u2713' : step.num}
              </div>
              <span
                style={{
                  marginTop: THEME.spacing.xs,
                  fontSize: THEME.typography.fontSize.xs,
                  fontFamily: THEME.typography.fontFamily.sans,
                  fontWeight: isActive ? THEME.typography.fontWeight.semibold : THEME.typography.fontWeight.normal,
                  color: isActive ? THEME.colors.teal : THEME.colors.charcoalMuted,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {step.title}
              </span>
            </div>
            {!isLast && (
              <div
                style={{
                  width: '60px',
                  height: '2px',
                  backgroundColor: isCompleted ? THEME.colors.success : THEME.colors.borderLight,
                  marginBottom: '18px',
                  transition: `background-color ${THEME.transitions.normal}`,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
