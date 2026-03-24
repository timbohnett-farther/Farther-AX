// U4 & 2B Intake Form — 25 Questions across 4 steps

export interface EducationEntry {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationDate: string;
}

export interface OBAEntry {
  entityName: string;
  description: string;
  position: string;
  startDate: string;
  isInvestmentRelated: boolean;
  compensationType: string;
}

export interface EmploymentEntry {
  employerName: string;
  employerAddress: string;
  title: string;
  startDate: string;
  endDate: string;
  reasonForLeaving: string;
}

export interface ResidentialEntry {
  address: string;
  city: string;
  state: string;
  zip: string;
  startDate: string;
  endDate: string;
}

export interface IntakeFormData {
  // Step 1: General & Personal Info (Q1–Q13)
  q1_full_legal_name: string;
  q2_other_names: string;
  q3_date_of_birth: string;
  q4_ssn: string; // encrypted at rest
  q5_country_of_citizenship: string;
  q6_residential_address: string;
  q7_city: string;
  q8_state: string;
  q9_zip: string;
  q10_phone: string;
  q11_email: string;
  q12_marital_status: string;
  q13_dependents: string;

  // Step 2: Qualifications & Insurance (Q14–Q18)
  q14_crd_number: string;
  q15_licenses_held: string;
  q16_license_states: string;
  q17_errors_omissions_carrier: string;
  q18_eo_policy_number: string;

  // Step 3: Education & Other Business Activities (Q19–Q20)
  q19_education: EducationEntry[];
  q20_obas: OBAEntry[];

  // Step 4: Employment, Residential & Disclosures (Q21–Q25)
  q21_employment_history: EmploymentEntry[];
  q22_residential_history: ResidentialEntry[];
  q23_disclosure_felony: boolean;
  q24_disclosure_regulatory: boolean;
  q25_disclosure_bankruptcy: boolean;
}

// Default empty form data
export function createEmptyFormData(): IntakeFormData {
  return {
    q1_full_legal_name: '',
    q2_other_names: '',
    q3_date_of_birth: '',
    q4_ssn: '',
    q5_country_of_citizenship: 'United States',
    q6_residential_address: '',
    q7_city: '',
    q8_state: '',
    q9_zip: '',
    q10_phone: '',
    q11_email: '',
    q12_marital_status: '',
    q13_dependents: '',
    q14_crd_number: '',
    q15_licenses_held: '',
    q16_license_states: '',
    q17_errors_omissions_carrier: '',
    q18_eo_policy_number: '',
    q19_education: [{ institution: '', degree: '', fieldOfStudy: '', graduationDate: '' }],
    q20_obas: [],
    q21_employment_history: [{ employerName: '', employerAddress: '', title: '', startDate: '', endDate: '', reasonForLeaving: '' }],
    q22_residential_history: [{ address: '', city: '', state: '', zip: '', startDate: '', endDate: '' }],
    q23_disclosure_felony: false,
    q24_disclosure_regulatory: false,
    q25_disclosure_bankruptcy: false,
  };
}

// Validation per step

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateStep1(data: Partial<IntakeFormData>): ValidationResult {
  const errors: string[] = [];
  if (!data.q1_full_legal_name?.trim()) errors.push('Full legal name is required');
  if (!data.q3_date_of_birth) errors.push('Date of birth is required');
  if (!data.q4_ssn || data.q4_ssn.replace(/\D/g, '').length !== 9) errors.push('Valid SSN is required (9 digits)');
  if (!data.q6_residential_address?.trim()) errors.push('Residential address is required');
  if (!data.q7_city?.trim()) errors.push('City is required');
  if (!data.q8_state?.trim()) errors.push('State is required');
  if (!data.q9_zip?.trim()) errors.push('ZIP code is required');
  if (!data.q10_phone?.trim()) errors.push('Phone number is required');
  if (!data.q11_email?.trim()) errors.push('Email address is required');
  return { valid: errors.length === 0, errors };
}

export function validateStep2(data: Partial<IntakeFormData>): ValidationResult {
  const errors: string[] = [];
  if (!data.q14_crd_number?.trim()) errors.push('CRD number is required');
  if (!data.q15_licenses_held?.trim()) errors.push('Licenses held is required');
  return { valid: errors.length === 0, errors };
}

export function validateStep3(data: Partial<IntakeFormData>): ValidationResult {
  const errors: string[] = [];
  if (!data.q19_education?.length || !data.q19_education[0]?.institution?.trim()) {
    errors.push('At least one education entry is required');
  }
  return { valid: errors.length === 0, errors };
}

export function validateStep4(data: Partial<IntakeFormData>): ValidationResult {
  const errors: string[] = [];
  if (!data.q21_employment_history?.length || !data.q21_employment_history[0]?.employerName?.trim()) {
    errors.push('At least one employment history entry is required');
  }
  if (!data.q22_residential_history?.length || !data.q22_residential_history[0]?.address?.trim()) {
    errors.push('At least one residential history entry is required');
  }
  return { valid: errors.length === 0, errors };
}

export function validateAllSteps(data: Partial<IntakeFormData>): ValidationResult {
  const results = [validateStep1(data), validateStep2(data), validateStep3(data), validateStep4(data)];
  const allErrors = results.flatMap((r) => r.errors);
  return { valid: allErrors.length === 0, errors: allErrors };
}

// Employment gap detection — warn if gap > 30 days between entries
export function detectEmploymentGaps(entries: EmploymentEntry[]): string[] {
  const warnings: string[] = [];
  const sorted = [...entries]
    .filter((e) => e.endDate && e.startDate)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = new Date(sorted[i - 1].endDate);
    const currStart = new Date(sorted[i].startDate);
    const gapDays = Math.floor((currStart.getTime() - prevEnd.getTime()) / (1000 * 60 * 60 * 24));
    if (gapDays > 30) {
      warnings.push(
        `Gap of ${gapDays} days between ${sorted[i - 1].employerName || 'previous employer'} (ended ${sorted[i - 1].endDate}) and ${sorted[i].employerName || 'next employer'} (started ${sorted[i].startDate})`
      );
    }
  }
  return warnings;
}
