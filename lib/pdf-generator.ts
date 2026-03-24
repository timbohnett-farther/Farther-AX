import React from 'react';
import { renderToBuffer, Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { IntakeFormData } from './intake-form-schema';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#1d7682',
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#1d7682',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#333333',
  },
  headerSubtitle: {
    fontSize: 9,
    color: '#888888',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1d7682',
    marginTop: 16,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E0DCD6',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  field: {
    flex: 1,
    marginRight: 8,
  },
  fieldLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 10,
    color: '#333333',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FAF7F2',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E0DCD6',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EBE8E3',
  },
  tableCell: {
    fontSize: 9,
    flex: 1,
  },
  tableCellHeader: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    flex: 1,
    color: '#888888',
    textTransform: 'uppercase',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#888888',
    borderTopWidth: 1,
    borderTopColor: '#E0DCD6',
    paddingTop: 8,
  },
  disclosureYes: {
    color: '#C62828',
    fontFamily: 'Helvetica-Bold',
  },
});

function FieldPair({ label, value }: { label: string; value: string }) {
  return React.createElement(View, { style: styles.field },
    React.createElement(Text, { style: styles.fieldLabel }, label),
    React.createElement(Text, { style: styles.fieldValue }, value || '—'),
  );
}

export async function generateIntakePDF(
  data: IntakeFormData,
  meta: { advisorName: string; completedAt: string | Date }
): Promise<Buffer> {
  const completedDate = meta.completedAt instanceof Date
    ? meta.completedAt.toLocaleDateString()
    : new Date(meta.completedAt).toLocaleDateString();

  const ssnMasked = data.q4_ssn
    ? `***-**-${data.q4_ssn.replace(/\D/g, '').slice(-4)}`
    : '—';

  const doc = React.createElement(Document, {},
    // Page 1: Personal Info
    React.createElement(Page, { size: 'LETTER', style: styles.page },
      // Header
      React.createElement(View, { style: styles.header },
        React.createElement(View, { style: styles.logo },
          React.createElement(Text, { style: styles.logoText }, 'F'),
        ),
        React.createElement(View, {},
          React.createElement(Text, { style: styles.headerTitle }, 'U4 & 2B Intake Form'),
          React.createElement(Text, { style: styles.headerSubtitle }, `Farther Advisory Experience — Completed ${completedDate}`),
        ),
      ),

      React.createElement(Text, { style: styles.sectionTitle }, 'Personal Information'),
      React.createElement(View, { style: styles.row },
        React.createElement(FieldPair, { label: 'Full Legal Name', value: data.q1_full_legal_name }),
        React.createElement(FieldPair, { label: 'Other Names', value: data.q2_other_names }),
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(FieldPair, { label: 'Date of Birth', value: data.q3_date_of_birth }),
        React.createElement(FieldPair, { label: 'SSN', value: ssnMasked }),
        React.createElement(FieldPair, { label: 'Citizenship', value: data.q5_country_of_citizenship }),
      ),

      React.createElement(Text, { style: styles.sectionTitle }, 'Residential Address'),
      React.createElement(View, { style: styles.row },
        React.createElement(FieldPair, { label: 'Street', value: data.q6_residential_address }),
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(FieldPair, { label: 'City', value: data.q7_city }),
        React.createElement(FieldPair, { label: 'State', value: data.q8_state }),
        React.createElement(FieldPair, { label: 'ZIP', value: data.q9_zip }),
      ),

      React.createElement(Text, { style: styles.sectionTitle }, 'Contact'),
      React.createElement(View, { style: styles.row },
        React.createElement(FieldPair, { label: 'Phone', value: data.q10_phone }),
        React.createElement(FieldPair, { label: 'Email', value: data.q11_email }),
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(FieldPair, { label: 'Marital Status', value: data.q12_marital_status }),
        React.createElement(FieldPair, { label: 'Dependents', value: data.q13_dependents }),
      ),

      React.createElement(Text, { style: styles.sectionTitle }, 'Registration & Licensing'),
      React.createElement(View, { style: styles.row },
        React.createElement(FieldPair, { label: 'CRD Number', value: data.q14_crd_number }),
        React.createElement(FieldPair, { label: 'Licenses', value: data.q15_licenses_held }),
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(FieldPair, { label: 'License States', value: data.q16_license_states }),
      ),

      React.createElement(Text, { style: styles.sectionTitle }, 'Errors & Omissions Insurance'),
      React.createElement(View, { style: styles.row },
        React.createElement(FieldPair, { label: 'E&O Carrier', value: data.q17_errors_omissions_carrier }),
        React.createElement(FieldPair, { label: 'Policy Number', value: data.q18_eo_policy_number }),
      ),

      React.createElement(View, { style: styles.footer },
        React.createElement(Text, {}, `${meta.advisorName || 'Advisor'} — U4 & 2B Intake`),
        React.createElement(Text, {}, 'Confidential — Farther Finance'),
      ),
    ),

    // Page 2: Education & OBAs
    React.createElement(Page, { size: 'LETTER', style: styles.page },
      React.createElement(View, { style: styles.header },
        React.createElement(View, { style: styles.logo },
          React.createElement(Text, { style: styles.logoText }, 'F'),
        ),
        React.createElement(View, {},
          React.createElement(Text, { style: styles.headerTitle }, 'U4 & 2B Intake Form'),
          React.createElement(Text, { style: styles.headerSubtitle }, 'Page 2 — Education & Other Business Activities'),
        ),
      ),

      React.createElement(Text, { style: styles.sectionTitle }, 'Education History'),
      ...(data.q19_education?.length > 0
        ? [
            React.createElement(View, { style: styles.tableHeader, key: 'edu-h' },
              React.createElement(Text, { style: styles.tableCellHeader }, 'Institution'),
              React.createElement(Text, { style: styles.tableCellHeader }, 'Degree'),
              React.createElement(Text, { style: styles.tableCellHeader }, 'Field of Study'),
              React.createElement(Text, { style: styles.tableCellHeader }, 'Graduated'),
            ),
            ...data.q19_education.map((edu, i) =>
              React.createElement(View, { style: styles.tableRow, key: `edu-${i}` },
                React.createElement(Text, { style: styles.tableCell }, edu.institution || '—'),
                React.createElement(Text, { style: styles.tableCell }, edu.degree || '—'),
                React.createElement(Text, { style: styles.tableCell }, edu.fieldOfStudy || '—'),
                React.createElement(Text, { style: styles.tableCell }, edu.graduationDate || '—'),
              ),
            ),
          ]
        : [React.createElement(Text, { style: styles.fieldValue, key: 'edu-none' }, 'None reported')]
      ),

      React.createElement(Text, { style: styles.sectionTitle }, 'Other Business Activities (OBAs)'),
      ...(data.q20_obas?.length > 0
        ? [
            React.createElement(View, { style: styles.tableHeader, key: 'oba-h' },
              React.createElement(Text, { style: styles.tableCellHeader }, 'Entity'),
              React.createElement(Text, { style: styles.tableCellHeader }, 'Position'),
              React.createElement(Text, { style: styles.tableCellHeader }, 'Inv. Related'),
              React.createElement(Text, { style: styles.tableCellHeader }, 'Compensation'),
            ),
            ...data.q20_obas.map((oba, i) =>
              React.createElement(View, { style: styles.tableRow, key: `oba-${i}` },
                React.createElement(Text, { style: styles.tableCell }, oba.entityName || '—'),
                React.createElement(Text, { style: styles.tableCell }, oba.position || '—'),
                React.createElement(Text, { style: styles.tableCell }, oba.isInvestmentRelated ? 'Yes' : 'No'),
                React.createElement(Text, { style: styles.tableCell }, oba.compensationType || '—'),
              ),
            ),
          ]
        : [React.createElement(Text, { style: styles.fieldValue, key: 'oba-none' }, 'None reported')]
      ),

      React.createElement(View, { style: styles.footer },
        React.createElement(Text, {}, `${meta.advisorName || 'Advisor'} — U4 & 2B Intake`),
        React.createElement(Text, {}, 'Page 2 — Confidential'),
      ),
    ),

    // Page 3: Employment History
    React.createElement(Page, { size: 'LETTER', style: styles.page },
      React.createElement(View, { style: styles.header },
        React.createElement(View, { style: styles.logo },
          React.createElement(Text, { style: styles.logoText }, 'F'),
        ),
        React.createElement(View, {},
          React.createElement(Text, { style: styles.headerTitle }, 'U4 & 2B Intake Form'),
          React.createElement(Text, { style: styles.headerSubtitle }, 'Page 3 — Employment History'),
        ),
      ),

      React.createElement(Text, { style: styles.sectionTitle }, 'Employment History (10 Years)'),
      ...(data.q21_employment_history?.length > 0
        ? [
            React.createElement(View, { style: styles.tableHeader, key: 'emp-h' },
              React.createElement(Text, { style: styles.tableCellHeader }, 'Employer'),
              React.createElement(Text, { style: styles.tableCellHeader }, 'Title'),
              React.createElement(Text, { style: styles.tableCellHeader }, 'Start'),
              React.createElement(Text, { style: styles.tableCellHeader }, 'End'),
              React.createElement(Text, { style: styles.tableCellHeader }, 'Reason'),
            ),
            ...data.q21_employment_history.map((emp, i) =>
              React.createElement(View, { style: styles.tableRow, key: `emp-${i}` },
                React.createElement(Text, { style: styles.tableCell }, emp.employerName || '—'),
                React.createElement(Text, { style: styles.tableCell }, emp.title || '—'),
                React.createElement(Text, { style: styles.tableCell }, emp.startDate || '—'),
                React.createElement(Text, { style: styles.tableCell }, emp.endDate || 'Present'),
                React.createElement(Text, { style: styles.tableCell }, emp.reasonForLeaving || '—'),
              ),
            ),
          ]
        : [React.createElement(Text, { style: styles.fieldValue, key: 'emp-none' }, 'None reported')]
      ),

      React.createElement(View, { style: styles.footer },
        React.createElement(Text, {}, `${meta.advisorName || 'Advisor'} — U4 & 2B Intake`),
        React.createElement(Text, {}, 'Page 3 — Confidential'),
      ),
    ),

    // Page 4: Residential + Disclosures
    React.createElement(Page, { size: 'LETTER', style: styles.page },
      React.createElement(View, { style: styles.header },
        React.createElement(View, { style: styles.logo },
          React.createElement(Text, { style: styles.logoText }, 'F'),
        ),
        React.createElement(View, {},
          React.createElement(Text, { style: styles.headerTitle }, 'U4 & 2B Intake Form'),
          React.createElement(Text, { style: styles.headerSubtitle }, 'Page 4 — Residential History & Disclosures'),
        ),
      ),

      React.createElement(Text, { style: styles.sectionTitle }, 'Residential History (5 Years)'),
      ...(data.q22_residential_history?.length > 0
        ? [
            React.createElement(View, { style: styles.tableHeader, key: 'res-h' },
              React.createElement(Text, { style: styles.tableCellHeader }, 'Address'),
              React.createElement(Text, { style: styles.tableCellHeader }, 'City'),
              React.createElement(Text, { style: styles.tableCellHeader }, 'State'),
              React.createElement(Text, { style: styles.tableCellHeader }, 'From'),
              React.createElement(Text, { style: styles.tableCellHeader }, 'To'),
            ),
            ...data.q22_residential_history.map((res, i) =>
              React.createElement(View, { style: styles.tableRow, key: `res-${i}` },
                React.createElement(Text, { style: styles.tableCell }, res.address || '—'),
                React.createElement(Text, { style: styles.tableCell }, res.city || '—'),
                React.createElement(Text, { style: styles.tableCell }, `${res.state || ''} ${res.zip || ''}`),
                React.createElement(Text, { style: styles.tableCell }, res.startDate || '—'),
                React.createElement(Text, { style: styles.tableCell }, res.endDate || 'Present'),
              ),
            ),
          ]
        : [React.createElement(Text, { style: styles.fieldValue, key: 'res-none' }, 'None reported')]
      ),

      React.createElement(Text, { style: styles.sectionTitle }, 'Disclosure Questions'),
      React.createElement(View, { style: { ...styles.row, marginTop: 8 } },
        React.createElement(View, { style: { flex: 1 } },
          React.createElement(Text, { style: styles.fieldLabel }, 'Q23. Felony Charge/Conviction'),
          React.createElement(Text, { style: data.q23_disclosure_felony ? styles.disclosureYes : styles.fieldValue },
            data.q23_disclosure_felony ? 'YES' : 'No',
          ),
        ),
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(View, { style: { flex: 1 } },
          React.createElement(Text, { style: styles.fieldLabel }, 'Q24. Regulatory Action'),
          React.createElement(Text, { style: data.q24_disclosure_regulatory ? styles.disclosureYes : styles.fieldValue },
            data.q24_disclosure_regulatory ? 'YES' : 'No',
          ),
        ),
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(View, { style: { flex: 1 } },
          React.createElement(Text, { style: styles.fieldLabel }, 'Q25. Bankruptcy/SIPC Trustee'),
          React.createElement(Text, { style: data.q25_disclosure_bankruptcy ? styles.disclosureYes : styles.fieldValue },
            data.q25_disclosure_bankruptcy ? 'YES' : 'No',
          ),
        ),
      ),

      React.createElement(View, { style: { marginTop: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E0DCD6' } },
        React.createElement(Text, { style: { fontSize: 9, color: '#888888' } },
          `Submitted electronically on ${completedDate} by ${meta.advisorName || 'Advisor'}`,
        ),
      ),

      React.createElement(View, { style: styles.footer },
        React.createElement(Text, {}, `${meta.advisorName || 'Advisor'} — U4 & 2B Intake`),
        React.createElement(Text, {}, 'Page 4 — Confidential'),
      ),
    ),
  );

  return renderToBuffer(doc);
}
