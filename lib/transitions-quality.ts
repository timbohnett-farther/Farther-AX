/**
 * Transitions Data Quality Tracking
 *
 * Calculates data completeness metrics, identifies missing critical fields,
 * and generates actionable alerts for data quality issues.
 */

// ── Critical Fields Definition ──────────────────────────────────────────────

export const CRITICAL_FIELDS = [
  'primary_email',
  'household_name',
  'advisor_name',
] as const;

export const HIGH_VALUE_FIELDS = [
  'status_of_iaa',
  'status_of_account_paperwork',
  'custodian',
  'primary_first_name',
  'primary_last_name',
] as const;

export const ALL_TRANSITION_FIELDS = [
  'farther_contact',
  'advisor_name',
  'custodian',
  'document_readiness',
  'status_of_iaa',
  'status_of_account_paperwork',
  'portal_status',
  'household_name',
  'billing_group',
  'primary_first_name',
  'primary_middle_name',
  'primary_last_name',
  'primary_email',
  'primary_phone',
  'primary_dob',
  'primary_ssn_last4',
  'primary_street',
  'primary_city',
  'primary_state',
  'primary_zip',
  'primary_country',
  'secondary_first_name',
  'secondary_middle_name',
  'secondary_last_name',
  'secondary_email',
  'secondary_phone',
  'secondary_dob',
  'secondary_ssn_last4',
  'secondary_street',
  'secondary_city',
  'secondary_state',
  'secondary_zip',
  'secondary_country',
  'fee_schedule',
  'billing_exceptions',
  'billing_exception_explanation',
  'contra_account_firm',
  'contra_account_numbers',
  'new_account_number',
  'account_type',
  'account_name',
  'mailing_street',
  'mailing_city',
  'mailing_state',
  'mailing_zip',
  'mailing_country',
  'portal_invites',
  'welcome_gift_box',
  'notes',
  'billing_setup',
] as const;

// ── Quality Alert Interface ─────────────────────────────────────────────────

export interface QualityAlert {
  severity: 'critical' | 'warning' | 'info';
  field: string;
  message: string;
  impact: 'high' | 'medium' | 'low';
  remediation: string;
}

// ── Record Quality Interface ────────────────────────────────────────────────

export interface RecordQuality {
  fields_total: number;
  fields_populated: number;
  fields_null: number;
  completeness_pct: number;
  critical_fields_ok: boolean;
  missing_critical: string[];
  missing_high_value: string[];
  alerts: QualityAlert[];
}

// ── Quality Calculation ─────────────────────────────────────────────────────

/**
 * Calculate data quality metrics for a transition record
 */
export function calculateRecordQuality(
  record: Record<string, string | null | undefined>,
): RecordQuality {
  const fields_total = ALL_TRANSITION_FIELDS.length;
  let fields_populated = 0;
  let fields_null = 0;

  // Count populated vs null fields
  for (const field of ALL_TRANSITION_FIELDS) {
    const value = record[field];
    if (value && value.trim() !== '') {
      fields_populated++;
    } else {
      fields_null++;
    }
  }

  const completeness_pct = (fields_populated / fields_total) * 100;

  // Check critical fields
  const missing_critical: string[] = [];
  for (const field of CRITICAL_FIELDS) {
    const value = record[field];
    if (!value || value.trim() === '') {
      missing_critical.push(field);
    }
  }

  const critical_fields_ok = missing_critical.length === 0;

  // Check high-value fields
  const missing_high_value: string[] = [];
  for (const field of HIGH_VALUE_FIELDS) {
    const value = record[field];
    if (!value || value.trim() === '') {
      missing_high_value.push(field);
    }
  }

  // Generate alerts
  const alerts: QualityAlert[] = [];

  // Critical field alerts
  if (!record.primary_email || record.primary_email.trim() === '') {
    alerts.push({
      severity: 'critical',
      field: 'primary_email',
      message: 'Primary email missing - cannot link DocuSign envelopes',
      impact: 'high',
      remediation: 'Add email to "Primary Account Holder Email" column in Google Sheet',
    });
  }

  if (!record.household_name || record.household_name.trim() === '') {
    alerts.push({
      severity: 'critical',
      field: 'household_name',
      message: 'Household name missing - record cannot be identified',
      impact: 'high',
      remediation: 'Add household name to "Household Name" column in Google Sheet',
    });
  }

  if (!record.advisor_name || record.advisor_name.trim() === '') {
    alerts.push({
      severity: 'critical',
      field: 'advisor_name',
      message: 'Advisor name missing - cannot assign workbook owner',
      impact: 'high',
      remediation: 'Add advisor name to "Advisor Name" column in Google Sheet',
    });
  }

  // High-value field warnings
  if (!record.status_of_iaa || record.status_of_iaa.trim() === '') {
    alerts.push({
      severity: 'warning',
      field: 'status_of_iaa',
      message: 'IAA status missing - workflow tracking incomplete',
      impact: 'medium',
      remediation: 'Update "Status of IAA" column to track signing progress',
    });
  }

  if (!record.status_of_account_paperwork || record.status_of_account_paperwork.trim() === '') {
    alerts.push({
      severity: 'warning',
      field: 'status_of_account_paperwork',
      message: 'Account paperwork status missing - workflow tracking incomplete',
      impact: 'medium',
      remediation: 'Update "Status of Account Paperwork" column to track document progress',
    });
  }

  if (!record.custodian || record.custodian.trim() === '') {
    alerts.push({
      severity: 'warning',
      field: 'custodian',
      message: 'Custodian missing - cannot route account setup',
      impact: 'medium',
      remediation: 'Add custodian (Schwab, Fidelity, or Pershing) to "Custodian" column',
    });
  }

  // Info alerts for low completeness
  if (completeness_pct < 50) {
    alerts.push({
      severity: 'info',
      field: 'overall',
      message: `Low data completeness (${completeness_pct.toFixed(1)}%) - many fields empty`,
      impact: 'low',
      remediation: 'Review and populate missing fields in Google Sheet',
    });
  }

  return {
    fields_total,
    fields_populated,
    fields_null,
    completeness_pct: Math.round(completeness_pct * 10) / 10, // Round to 1 decimal
    critical_fields_ok,
    missing_critical,
    missing_high_value,
    alerts,
  };
}

// ── Workbook Quality Aggregation ────────────────────────────────────────────

export interface WorkbookQuality {
  total_rows: number;
  critical_rows_ok: number;
  critical_rows_missing: number;
  avg_completeness_pct: number;
  completeness_breakdown: {
    excellent: number; // >90%
    good: number; // 70-90%
    fair: number; // 50-70%
    poor: number; // <50%
  };
  all_alerts: QualityAlert[];
}

/**
 * Aggregate quality metrics across all records in a workbook
 */
export function aggregateWorkbookQuality(
  records: RecordQuality[]
): WorkbookQuality {
  const total_rows = records.length;
  let critical_rows_ok = 0;
  let sum_completeness = 0;

  const completeness_breakdown = {
    excellent: 0,
    good: 0,
    fair: 0,
    poor: 0,
  };

  const all_alerts: QualityAlert[] = [];

  for (const record of records) {
    if (record.critical_fields_ok) {
      critical_rows_ok++;
    }

    sum_completeness += record.completeness_pct;

    // Categorize by completeness
    if (record.completeness_pct >= 90) {
      completeness_breakdown.excellent++;
    } else if (record.completeness_pct >= 70) {
      completeness_breakdown.good++;
    } else if (record.completeness_pct >= 50) {
      completeness_breakdown.fair++;
    } else {
      completeness_breakdown.poor++;
    }

    // Collect alerts
    all_alerts.push(...record.alerts);
  }

  const avg_completeness_pct = total_rows > 0
    ? Math.round((sum_completeness / total_rows) * 10) / 10
    : 0;

  const critical_rows_missing = total_rows - critical_rows_ok;

  return {
    total_rows,
    critical_rows_ok,
    critical_rows_missing,
    avg_completeness_pct,
    completeness_breakdown,
    all_alerts,
  };
}

// ── Quality Summary ─────────────────────────────────────────────────────────

export interface QualitySummary {
  total_workbooks: number;
  total_records: number;
  avg_data_quality: number;
  critical_rows_ok: number;
  critical_rows_missing: number;
  completeness_breakdown: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  top_alerts: Array<{
    severity: 'critical' | 'warning' | 'info';
    message: string;
    count: number;
  }>;
}

/**
 * Generate overall quality summary across all workbooks
 */
export function generateQualitySummary(
  workbooks: WorkbookQuality[]
): QualitySummary {
  const total_workbooks = workbooks.length;
  let total_records = 0;
  let sum_quality = 0;
  let critical_rows_ok = 0;
  let critical_rows_missing = 0;

  const completeness_breakdown = {
    excellent: 0,
    good: 0,
    fair: 0,
    poor: 0,
  };

  // Aggregate alert counts
  const alertCounts = new Map<string, { severity: QualityAlert['severity']; count: number }>();

  for (const wb of workbooks) {
    total_records += wb.total_rows;
    sum_quality += wb.avg_completeness_pct * wb.total_rows;
    critical_rows_ok += wb.critical_rows_ok;
    critical_rows_missing += wb.critical_rows_missing;

    completeness_breakdown.excellent += wb.completeness_breakdown.excellent;
    completeness_breakdown.good += wb.completeness_breakdown.good;
    completeness_breakdown.fair += wb.completeness_breakdown.fair;
    completeness_breakdown.poor += wb.completeness_breakdown.poor;

    // Count unique alert messages
    for (const alert of wb.all_alerts) {
      const key = `${alert.severity}:${alert.message}`;
      const existing = alertCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        alertCounts.set(key, { severity: alert.severity, count: 1 });
      }
    }
  }

  const avg_data_quality = total_records > 0
    ? Math.round((sum_quality / total_records) * 10) / 10
    : 0;

  // Get top 10 most common alerts
  const top_alerts = Array.from(alertCounts.entries())
    .map(([key, val]) => {
      const message = key.split(':').slice(1).join(':'); // Remove severity prefix
      return {
        severity: val.severity,
        message,
        count: val.count,
      };
    })
    .sort((a, b) => {
      // Sort by severity first (critical > warning > info), then by count
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.count - a.count;
    })
    .slice(0, 10);

  return {
    total_workbooks,
    total_records,
    avg_data_quality,
    critical_rows_ok,
    critical_rows_missing,
    completeness_breakdown,
    top_alerts,
  };
}
