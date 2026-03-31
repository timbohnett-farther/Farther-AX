/**
 * Farther Advisor Onboarding Tasks
 * Source: ADVISOR ONBOARDING - Task-Based Operating Guide v1.2 (December 2025)
 *
 * 8 Phases (0-7) with ~100 tasks total
 */

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────

export type Phase =
  | 'phase_0' // Sales Handoff
  | 'phase_1' // Post-Signing Prep
  | 'phase_2' // Onboarding Kick-Off
  | 'phase_3' // Pre-Launch Build
  | 'phase_4' // T-7 Final Countdown
  | 'phase_5' // Launch Day
  | 'phase_6' // Active Transition
  | 'phase_7' // Graduation & Handoff
;

export type Owner =
  | 'AXM'           // Advisor Experience Manager
  | 'AXA'           // Advisor Experience Associate
  | 'CTM'           // Client Transition Manager
  | 'CXM'           // Client Experience Manager
  | 'Recruiter'
  | 'Director'
  | 'IT'
  | 'HR'
  | 'Finance'
  | 'Marketing'
  | 'Compliance'
  | 'Investment Team'
  | 'FP Team'
  | 'FIG Team'
  | 'Biz Ops'
  | 'RIA Leadership'
  | 'Advisor'
;

export interface Task {
  id: string;          // Unique identifier (e.g. "p0_mark_signed")
  label: string;       // Task description
  phase: Phase;
  owner: Owner;
  timing: string;      // Human-readable timing (e.g. "Day 0", "Within 24 hrs")
  is_hard_gate: boolean; // Must complete before advancing (● in PDF)
  resources?: string;  // Links or resource descriptions
}

export interface PhaseInfo {
  label: string;       // e.g. "Phase 0 — Sales Handoff"
  timeline: string;    // e.g. "Day 0 → +2 days"
  primary_owner: Owner;
  description: string;
}

// ────────────────────────────────────────────────────────────────────────────
// PHASE METADATA
// ────────────────────────────────────────────────────────────────────────────

export const PHASES: Record<Phase, PhaseInfo> = {
  phase_0: {
    label: 'Phase 0 — Sales Handoff',
    timeline: 'Day 0 → +2 days',
    primary_owner: 'Recruiter',
    description: 'Transition from recruiting to onboarding team',
  },
  phase_1: {
    label: 'Phase 1 — Post-Signing Prep',
    timeline: 'Day 0 → Day 7-10',
    primary_owner: 'AXM',
    description: 'Systems setup, intake forms, and scoping',
  },
  phase_2: {
    label: 'Phase 2 — Onboarding Kick-Off',
    timeline: 'Day 7-10 (single meeting)',
    primary_owner: 'AXM',
    description: 'Transition blueprint and advisor deliverables',
  },
  phase_3: {
    label: 'Phase 3 — Pre-Launch Build',
    timeline: 'Post-Kick-Off → T-7',
    primary_owner: 'AXA',
    description: 'Department intros, compliance, and preparation',
  },
  phase_4: {
    label: 'Phase 4 — T-7 Final Countdown',
    timeline: 'T-7 → Launch Day',
    primary_owner: 'AXM',
    description: 'Pre-launch sync and final verifications',
  },
  phase_5: {
    label: 'Phase 5 — Launch Day',
    timeline: 'Day 1',
    primary_owner: 'AXM',
    description: 'Go-live, system access, and Day 1 meetings',
  },
  phase_6: {
    label: 'Phase 6 — Active Transition',
    timeline: 'Day 1 → Day 60',
    primary_owner: 'CTM',
    description: 'Client migration and ongoing support',
  },
  phase_7: {
    label: 'Phase 7 — Graduation & Handoff',
    timeline: 'Day 60 → Day 90',
    primary_owner: 'Director',
    description: 'Transition to ongoing support model',
  },
};

export const PHASE_ORDER: Phase[] = [
  'phase_0',
  'phase_1',
  'phase_2',
  'phase_3',
  'phase_4',
  'phase_5',
  'phase_6',
  'phase_7',
];

// ────────────────────────────────────────────────────────────────────────────
// TASK DEFINITIONS
// ────────────────────────────────────────────────────────────────────────────

export const TASKS: Task[] = [

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 0: SALES HANDOFF (5 tasks)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'p0_mark_signed',
    label: 'Mark deal "Signed" in HubSpot with complete data',
    phase: 'phase_0',
    owner: 'Recruiter',
    timing: 'Day 0',
    is_hard_gate: true,
    resources: 'https://app.hubspot.com/contacts/deals',
  },
  {
    id: 'p0_recruiter_axm_sync',
    label: 'Schedule Recruiter/AXM Prep Sync',
    phase: 'phase_0',
    owner: 'Recruiter',
    timing: 'Within 2 days',
    is_hard_gate: true,
  },
  {
    id: 'p0_kickoff_call',
    label: 'Schedule Recruiter/AXM/Advisor Kickoff Call (30 min)',
    phase: 'phase_0',
    owner: 'Recruiter',
    timing: 'Within 2 days',
    is_hard_gate: true,
  },
  {
    id: 'p0_create_profile',
    label: 'Create Advisor Profile and Onboarding Tracker',
    phase: 'phase_0',
    owner: 'AXA',
    timing: 'Within 4 hrs',
    is_hard_gate: false,
    resources: 'https://drive.google.com/drive/folders/new-advisor-onboarding',
  },
  {
    id: 'p0_assign_axm',
    label: 'Assign AXM and AXA to advisor in Portal',
    phase: 'phase_0',
    owner: 'Director',
    timing: 'Within 6 hrs',
    is_hard_gate: true,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 1: POST-SIGNING PREP (20 tasks)
  // ──────────────────────────────────────────────────────────────────────────

  // Systems & Infrastructure Setup
  {
    id: 'p1_create_folder',
    label: 'Create Advisor Folder in shared drive',
    phase: 'phase_1',
    owner: 'AXA',
    timing: 'Within 24 hrs',
    is_hard_gate: true,
    resources: 'https://drive.google.com/drive/folders/new-advisor-onboarding',
  },
  {
    id: 'p1_transition_sheet',
    label: 'Create Transition Google Sheet',
    phase: 'phase_1',
    owner: 'AXA',
    timing: 'Within 24 hrs',
    is_hard_gate: true,
    resources: 'https://drive.google.com/drive/folders/transition-templates',
  },
  {
    id: 'p1_slack_channel',
    label: 'Create #lastname-onboarding Slack channel',
    phase: 'phase_1',
    owner: 'AXA',
    timing: 'Within 24 hrs',
    is_hard_gate: true,
  },

  // Advisor Communications
  {
    id: 'p1_kickoff_email',
    label: 'Send Kickoff Email (Welcome to Farther)',
    phase: 'phase_1',
    owner: 'AXM',
    timing: 'Within 24 hrs',
    is_hard_gate: true,
    resources: 'https://app.hubspot.com/email/templates/pre-meeting-email',
  },
  {
    id: 'p1_advisor_decks',
    label: 'Send Advisor Decks & Intake Forms',
    phase: 'phase_1',
    owner: 'AXM',
    timing: 'With kickoff',
    is_hard_gate: true,
    resources: 'https://drive.google.com/drive/folders/advisor-decks',
  },
  {
    id: 'p1_schedule_kickoff',
    label: 'Schedule Onboarding Kick-Off Call (30 Minutes)',
    phase: 'phase_1',
    owner: 'AXA',
    timing: 'Within 2 days',
    is_hard_gate: true,
  },
  {
    id: 'p1_weekly_checkins',
    label: 'Schedule Weekly Onboarding Check-Ins',
    phase: 'phase_1',
    owner: 'AXA',
    timing: 'With kick-off',
    is_hard_gate: true,
  },

  // Intake Form Reviews
  {
    id: 'p1_u4_2b_intake',
    label: 'Advisor completes U4/2B intake form',
    phase: 'phase_1',
    owner: 'Advisor',
    timing: 'Within 3 days',
    is_hard_gate: true,
    resources: 'https://docs.google.com/forms/u4-2b-intake',
  },
  {
    id: 'p1_u4_2b_review',
    label: 'Review U4/2B Upload and Check for Errors',
    phase: 'phase_1',
    owner: 'AXA',
    timing: 'Upon receipt',
    is_hard_gate: true,
  },
  {
    id: 'p1_u4_2b_submit',
    label: 'Submit U4/2B to Compliance',
    phase: 'phase_1',
    owner: 'AXM',
    timing: 'After verification',
    is_hard_gate: true,
  },
  {
    id: 'p1_book_analysis',
    label: 'Review Book Analysis Form (all sections)',
    phase: 'phase_1',
    owner: 'AXA',
    timing: 'Within 3 days',
    is_hard_gate: true,
    resources: 'https://docs.google.com/spreadsheets/blueprint-data-checklist',
  },
  {
    id: 'p1_tech_procurement',
    label: 'Check Tech Procurement Form submitted',
    phase: 'phase_1',
    owner: 'AXA',
    timing: 'Within 3 days',
    is_hard_gate: true,
  },
  {
    id: 'p1_marketing_intake',
    label: 'Check Marketing Intake Form',
    phase: 'phase_1',
    owner: 'AXA',
    timing: 'Within 3 days',
    is_hard_gate: true,
  },
  {
    id: 'p1_sma_alts',
    label: 'Review SMA/Alternatives Form',
    phase: 'phase_1',
    owner: 'AXA',
    timing: 'Within 3 days',
    is_hard_gate: true,
  },
  {
    id: 'p1_insurance',
    label: 'Check Insurance/Annuities Form',
    phase: 'phase_1',
    owner: 'AXA',
    timing: 'Within 3 days',
    is_hard_gate: true,
  },

  // Scoping & Notifications
  {
    id: 'p1_billing_cadence',
    label: 'Scope billing cadence',
    phase: 'phase_1',
    owner: 'AXM',
    timing: 'Within 3 days',
    is_hard_gate: false,
  },
  {
    id: 'p1_perf_migration',
    label: 'Scope performance data migration',
    phase: 'phase_1',
    owner: 'AXM',
    timing: 'Within 3 days',
    is_hard_gate: false,
  },
  {
    id: 'p1_crm_migration',
    label: 'Scope CRM migration',
    phase: 'phase_1',
    owner: 'IT',
    timing: 'Within 3 days',
    is_hard_gate: false,
  },
  {
    id: 'p1_branding',
    label: 'Scope branding requirements',
    phase: 'phase_1',
    owner: 'Marketing',
    timing: 'Within 3 days',
    is_hard_gate: false,
  },
  {
    id: 'p1_it_notify',
    label: 'Notify IT of email/phone domain needs',
    phase: 'phase_1',
    owner: 'AXA',
    timing: 'If custom',
    is_hard_gate: false,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 2: ONBOARDING KICK-OFF (12 tasks)
  // ──────────────────────────────────────────────────────────────────────────

  {
    id: 'p2_kickoff_call',
    label: 'Hold Kick-off Call (1.5 hrs)',
    phase: 'phase_2',
    owner: 'AXM',
    timing: 'Day 7-10',
    is_hard_gate: true,
  },
  {
    id: 'p2_recruiter_intro',
    label: 'Recruiter introduces AXM (5 min)',
    phase: 'phase_2',
    owner: 'Recruiter',
    timing: 'During mtg',
    is_hard_gate: false,
  },
  {
    id: 'p2_process_overview',
    label: 'Present transition process overview',
    phase: 'phase_2',
    owner: 'AXM',
    timing: 'During mtg',
    is_hard_gate: false,
  },
  {
    id: 'p2_gather_blueprint',
    label: 'Gather Transition Blueprint data',
    phase: 'phase_2',
    owner: 'AXA',
    timing: 'During mtg',
    is_hard_gate: false,
  },
  {
    id: 'p2_discuss_details',
    label: 'Discuss billing, performance, CRM, branding',
    phase: 'phase_2',
    owner: 'CTM',
    timing: 'During mtg',
    is_hard_gate: false,
  },
  {
    id: 'p2_assign_deliverables',
    label: 'Assign advisor deliverables with deadlines',
    phase: 'phase_2',
    owner: 'AXM',
    timing: 'During mtg',
    is_hard_gate: false,
  },
  {
    id: 'p2_create_blueprint',
    label: 'Create Transition Blueprint (from notes)',
    phase: 'phase_2',
    owner: 'AXA',
    timing: 'Within 4 hrs',
    is_hard_gate: true,
    resources: 'https://docs.google.com/spreadsheets/blueprint-data-checklist',
  },
  {
    id: 'p2_followup_email',
    label: 'Send follow-up email with all deliverables',
    phase: 'phase_2',
    owner: 'AXA',
    timing: 'EOD same day',
    is_hard_gate: true,
    resources: 'https://app.hubspot.com/email/templates/kickoff-followup',
  },
  {
    id: 'p2_advisor_signoff',
    label: 'Advisor signs off on Blueprint',
    phase: 'phase_2',
    owner: 'Advisor',
    timing: 'Within 2 days',
    is_hard_gate: true,
  },
  {
    id: 'p2_master_merge_notice',
    label: 'Submit Master Merge notice to custodian',
    phase: 'phase_2',
    owner: 'CTM',
    timing: 'By T-35',
    is_hard_gate: true,
  },
  {
    id: 'p2_ncl',
    label: 'Prepare & Send Client Communication (NCL)',
    phase: 'phase_2',
    owner: 'AXM',
    timing: 'By T-30',
    is_hard_gate: true,
  },
  {
    id: 'p2_send_iaa',
    label: 'Send copy of IAA',
    phase: 'phase_2',
    owner: 'AXM',
    timing: 'Post-meeting',
    is_hard_gate: false,
    resources: 'https://app.docusign.com/templates',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 3: PRE-LAUNCH BUILD (20 tasks)
  // ──────────────────────────────────────────────────────────────────────────

  // Monitoring & Check-Ins
  {
    id: 'p3_monitoring_cadence',
    label: 'Establish weekly monitoring cadence',
    phase: 'phase_3',
    owner: 'AXA',
    timing: 'Start of Phase 3',
    is_hard_gate: false,
  },
  {
    id: 'p3_weekly_checkins',
    label: 'Weekly Onboarding Check-Ins with Advisor',
    phase: 'phase_3',
    owner: 'AXM',
    timing: 'Weekly',
    is_hard_gate: false,
  },
  {
    id: 'p3_status_updates',
    label: 'Post weekly status to #transitions-onboarding',
    phase: 'phase_3',
    owner: 'AXA',
    timing: 'Fridays 4pm',
    is_hard_gate: false,
  },

  // Compliance & Registration
  {
    id: 'p3_file_u4_2b',
    label: 'File U4/2B amendments',
    phase: 'phase_3',
    owner: 'Compliance',
    timing: 'By T-21',
    is_hard_gate: true,
  },
  {
    id: 'p3_dual_reg',
    label: 'Confirm dual registration status',
    phase: 'phase_3',
    owner: 'Compliance',
    timing: 'By T-21',
    is_hard_gate: true,
  },

  // Department Introductions
  {
    id: 'p3_intro_compliance',
    label: 'Introduce to Compliance Team',
    phase: 'phase_3',
    owner: 'AXA',
    timing: 'Phase 3',
    is_hard_gate: true,
  },
  {
    id: 'p3_intro_investments',
    label: 'Introduce to Investments Team',
    phase: 'phase_3',
    owner: 'AXA',
    timing: 'Phase 3',
    is_hard_gate: true,
  },
  {
    id: 'p3_intro_marketing',
    label: 'Introduce to Marketing Team',
    phase: 'phase_3',
    owner: 'AXA',
    timing: 'Phase 3',
    is_hard_gate: true,
  },
  {
    id: 'p3_intro_pinnacle',
    label: 'Introduce to Pinnacle/DPL Team',
    phase: 'phase_3',
    owner: 'AXA',
    timing: 'Phase 3',
    is_hard_gate: true,
  },
  {
    id: 'p3_intro_it',
    label: 'Introduce to IT Team',
    phase: 'phase_3',
    owner: 'AXA',
    timing: 'Phase 3',
    is_hard_gate: true,
  },
  {
    id: 'p3_intro_fp',
    label: 'Introduce to Financial Planning Team',
    phase: 'phase_3',
    owner: 'AXA',
    timing: 'Phase 3',
    is_hard_gate: true,
  },
  {
    id: 'p3_intro_hr',
    label: 'Introduce to HR Team',
    phase: 'phase_3',
    owner: 'AXA',
    timing: 'Phase 3',
    is_hard_gate: true,
  },

  // Custodian & Client Communications
  {
    id: 'p3_receive_ncl',
    label: 'Receive copy of NCL when sent to clients',
    phase: 'phase_3',
    owner: 'AXA',
    timing: 'When sent',
    is_hard_gate: true,
  },
  {
    id: 'p3_marketing_approval',
    label: 'Review & approve marketing materials',
    phase: 'phase_3',
    owner: 'Compliance',
    timing: 'By T-14',
    is_hard_gate: true,
  },

  // Transition Preparation
  {
    id: 'p3_transition_docs',
    label: 'Prepare client transition documentation',
    phase: 'phase_3',
    owner: 'CTM',
    timing: 'By T-7',
    is_hard_gate: true,
    resources: 'https://drive.google.com/drive/folders/transition-docs',
  },
  {
    id: 'p3_assign_cx_pod',
    label: 'Assign CX pod to advisor',
    phase: 'phase_3',
    owner: 'CXM',
    timing: 'By T-14',
    is_hard_gate: true,
  },
  {
    id: 'p3_cx_training',
    label: 'Schedule & complete CX staff training',
    phase: 'phase_3',
    owner: 'CXM',
    timing: 'By T-10',
    is_hard_gate: false,
  },
  {
    id: 'p3_brand_assets',
    label: 'Prepare brand assets & PR announcement',
    phase: 'phase_3',
    owner: 'Marketing',
    timing: 'By T-14',
    is_hard_gate: true,
    resources: 'https://drive.google.com/drive/folders/marketing-brand-assets',
  },
  {
    id: 'p3_tech_order',
    label: 'Place tech order (laptop, Zoom, etc.)',
    phase: 'phase_3',
    owner: 'IT',
    timing: 'By T-10',
    is_hard_gate: true,
  },
  {
    id: 'p3_bd_billing',
    label: 'Verify Black Diamond billing setup',
    phase: 'phase_3',
    owner: 'Finance',
    timing: 'By T-14',
    is_hard_gate: true,
    resources: 'https://blackdiamond.advent.com',
  },
  {
    id: 'p3_employment_paperwork',
    label: 'Complete employment paperwork',
    phase: 'phase_3',
    owner: 'HR',
    timing: 'By T-14',
    is_hard_gate: true,
  },
  {
    id: 'p3_schedule_prelaunch',
    label: 'Schedule Pre-Launch Sync (T-7)',
    phase: 'phase_3',
    owner: 'AXA',
    timing: 'When ready',
    is_hard_gate: true,
  },
  {
    id: 'p3_verify_custodian',
    label: 'Verify Custodian Master # / G#',
    phase: 'phase_3',
    owner: 'AXA',
    timing: 'By T-7',
    is_hard_gate: true,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 4: T-7 FINAL COUNTDOWN (7 tasks)
  // ──────────────────────────────────────────────────────────────────────────

  {
    id: 'p4_prelaunch_sync',
    label: 'Hold Pre-Launch Sync meeting (1.5 hrs)',
    phase: 'phase_4',
    owner: 'AXM',
    timing: 'T-7',
    is_hard_gate: true,
  },
  {
    id: 'p4_day1_guide',
    label: 'Send Day 1 Guide to advisor',
    phase: 'phase_4',
    owner: 'AXM',
    timing: 'By T-6',
    is_hard_gate: true,
    resources: 'https://drive.google.com/drive/folders/day-1-guide',
  },
  {
    id: 'p4_verify_meetings',
    label: 'Verify all first-week meetings scheduled',
    phase: 'phase_4',
    owner: 'AXA',
    timing: 'T-5 to T-3',
    is_hard_gate: true,
  },
  {
    id: 'p4_tech_shipment',
    label: 'Confirm Tech Shipment delivered',
    phase: 'phase_4',
    owner: 'AXA',
    timing: 'By T-2',
    is_hard_gate: true,
  },
  {
    id: 'p4_test_access',
    label: 'Test all system access',
    phase: 'phase_4',
    owner: 'AXA',
    timing: 'T-3 to T-1',
    is_hard_gate: true,
  },
  {
    id: 'p4_crm_migration',
    label: 'Initiate CRM migration',
    phase: 'phase_4',
    owner: 'IT',
    timing: 'T-1',
    is_hard_gate: true,
  },
  {
    id: 'p4_go_nogo',
    label: 'Final "Go/No-Go" decision',
    phase: 'phase_4',
    owner: 'Director',
    timing: 'T-1',
    is_hard_gate: true,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 5: LAUNCH DAY (13 tasks)
  // ──────────────────────────────────────────────────────────────────────────

  // Morning Setup
  {
    id: 'p5_slack_add',
    label: 'Add advisor to #lastname-onboarding Slack',
    phase: 'phase_5',
    owner: 'AXA',
    timing: 'Morning',
    is_hard_gate: false,
  },
  {
    id: 'p5_welcome_message',
    label: 'Send "Welcome to Day 1" message',
    phase: 'phase_5',
    owner: 'AXM',
    timing: 'Morning',
    is_hard_gate: false,
  },
  {
    id: 'p5_provision_access',
    label: 'Access & Provisioning (Slack, HubSpot, Zoom, Gmail)',
    phase: 'phase_5',
    owner: 'IT',
    timing: 'Morning',
    is_hard_gate: true,
  },

  // Day 1 Meetings
  {
    id: 'p5_day1_call',
    label: 'Hold Day 1 Call (intro to teams, training calendar)',
    phase: 'phase_5',
    owner: 'AXA',
    timing: 'Day 1',
    is_hard_gate: true,
  },
  {
    id: 'p5_systems_overview',
    label: 'Systems Overview call (1 hr)',
    phase: 'phase_5',
    owner: 'IT',
    timing: 'Day 1',
    is_hard_gate: true,
  },
  {
    id: 'p5_ria_intro',
    label: 'Introduce to RIA Manager',
    phase: 'phase_5',
    owner: 'RIA Leadership',
    timing: 'Day 1',
    is_hard_gate: true,
  },
  {
    id: 'p5_cx_demo',
    label: 'CX Intro & Portal Demo (30 min)',
    phase: 'phase_5',
    owner: 'CXM',
    timing: 'Day 1',
    is_hard_gate: true,
  },
  {
    id: 'p5_hr_grid',
    label: 'HR Grid/Payout review (30 min)',
    phase: 'phase_5',
    owner: 'HR',
    timing: 'Day 1',
    is_hard_gate: true,
  },

  // Client Communications
  {
    id: 'p5_client_announcement',
    label: 'Prepare Client Announcement letter',
    phase: 'phase_5',
    owner: 'AXA',
    timing: 'Day 1',
    is_hard_gate: true,
  },
  {
    id: 'p5_advisor_approval',
    label: 'Get advisor approval on announcement',
    phase: 'phase_5',
    owner: 'AXM',
    timing: 'Day 1',
    is_hard_gate: true,
  },
  {
    id: 'p5_send_announcement',
    label: 'Send Client Announcement via HubSpot',
    phase: 'phase_5',
    owner: 'AXA',
    timing: 'Day 1',
    is_hard_gate: true,
    resources: 'https://app.hubspot.com/email/templates/client-announcement',
  },
  {
    id: 'p5_verify_access',
    label: 'Confirm all systems access working',
    phase: 'phase_5',
    owner: 'AXA',
    timing: 'Day 1',
    is_hard_gate: true,
  },
  {
    id: 'p5_weekly_transition_checkins',
    label: 'Schedule Weekly Transition Check-In calls',
    phase: 'phase_5',
    owner: 'CTM',
    timing: 'Day 1',
    is_hard_gate: true,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 6: ACTIVE TRANSITION (20 tasks)
  // ──────────────────────────────────────────────────────────────────────────

  // Week 1 Department Meetings
  {
    id: 'p6_investment_intro',
    label: 'Investment Strategy intro (1 hr)',
    phase: 'phase_6',
    owner: 'Investment Team',
    timing: 'Week 1',
    is_hard_gate: false,
  },
  {
    id: 'p6_fp_intro',
    label: 'Financial Planning intro (1 hr)',
    phase: 'phase_6',
    owner: 'FP Team',
    timing: 'Week 1',
    is_hard_gate: false,
  },
  {
    id: 'p6_fig_intro',
    label: 'FIG intro (1 hr)',
    phase: 'phase_6',
    owner: 'FIG Team',
    timing: 'Week 1',
    is_hard_gate: false,
  },
  {
    id: 'p6_marketing_strategy',
    label: 'Marketing strategy call (1 hr)',
    phase: 'phase_6',
    owner: 'Marketing',
    timing: 'Week 1',
    is_hard_gate: false,
  },
  {
    id: 'p6_hr_orientation',
    label: 'HR Orientation & Intro to Farther Learning',
    phase: 'phase_6',
    owner: 'HR',
    timing: 'Week 1',
    is_hard_gate: true,
  },
  {
    id: 'p6_cx_pod_intro',
    label: 'Introduce to CX Pod (service team)',
    phase: 'phase_6',
    owner: 'CXM',
    timing: 'Week 1',
    is_hard_gate: true,
  },

  // Weekly Cadence
  {
    id: 'p6_transition_checkins',
    label: 'Weekly Transition Check-Ins with Advisor',
    phase: 'phase_6',
    owner: 'CTM',
    timing: 'Weekly',
    is_hard_gate: false,
  },
  {
    id: 'p6_axm_checkins',
    label: '2x weekly AXM/Advisor check-ins',
    phase: 'phase_6',
    owner: 'AXM',
    timing: 'Ongoing',
    is_hard_gate: false,
  },

  // Client Transition Work
  {
    id: 'p6_transfer_docs',
    label: 'Send Account Transfer Documents',
    phase: 'phase_6',
    owner: 'CTM',
    timing: 'T+2',
    is_hard_gate: false,
  },
  {
    id: 'p6_docusign',
    label: 'Deploy DocuSign packages to clients',
    phase: 'phase_6',
    owner: 'CTM',
    timing: 'T+2',
    is_hard_gate: false,
    resources: 'https://app.docusign.com/templates',
  },
  {
    id: 'p6_crm_import',
    label: 'CRM Import / Migration (upload contacts)',
    phase: 'phase_6',
    owner: 'IT',
    timing: 'Week 1-2',
    is_hard_gate: true,
    resources: 'https://app.hubspot.com/contacts/import',
  },
  {
    id: 'p6_client_portals',
    label: 'Create Client Portals with PII (bulk upload)',
    phase: 'phase_6',
    owner: 'CTM',
    timing: 'Weekly',
    is_hard_gate: true,
  },
  {
    id: 'p6_monitor_progress',
    label: 'Monitor client transition progress',
    phase: 'phase_6',
    owner: 'CTM',
    timing: 'Ongoing',
    is_hard_gate: false,
  },

  // Billing & Performance
  {
    id: 'p6_bd_householding',
    label: 'BlackDiamond Householding and Billing setup',
    phase: 'phase_6',
    owner: 'Finance',
    timing: 'Week 2-3',
    is_hard_gate: true,
    resources: 'https://blackdiamond.advent.com',
  },
  {
    id: 'p6_first_billing',
    label: 'Monitor first billing cycle (48-hr review)',
    phase: 'phase_6',
    owner: 'Finance',
    timing: 'After first bill',
    is_hard_gate: true,
  },
  {
    id: 'p6_perf_migration',
    label: 'Performance Migration (after bulk assets)',
    phase: 'phase_6',
    owner: 'Biz Ops',
    timing: 'Week 3-4+',
    is_hard_gate: true,
  },

  // Insurance & Ongoing
  {
    id: 'p6_insurance_progress',
    label: 'Check on Insurance/Annuities Progress',
    phase: 'phase_6',
    owner: 'AXA',
    timing: 'Week 2+',
    is_hard_gate: false,
  },
  {
    id: 'p6_escalate_pinnacle',
    label: 'Escalate Pinnacle/DPL issues if needed',
    phase: 'phase_6',
    owner: 'AXA',
    timing: 'As needed',
    is_hard_gate: false,
  },
  {
    id: 'p6_gift_boxes',
    label: 'Farther Client Gift Boxes (add to list)',
    phase: 'phase_6',
    owner: 'CXM',
    timing: 'After assets arrive',
    is_hard_gate: false,
  },

  // Milestones
  {
    id: 'p6_dept_intros_complete',
    label: 'Complete department introductions',
    phase: 'phase_6',
    owner: 'AXA',
    timing: 'By Day 30',
    is_hard_gate: true,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 7: GRADUATION & HANDOFF (7 tasks)
  // ──────────────────────────────────────────────────────────────────────────

  {
    id: 'p7_weekly_checkins',
    label: 'Transition AXM check-ins to weekly',
    phase: 'phase_7',
    owner: 'AXM',
    timing: 'Day 60',
    is_hard_gate: false,
  },
  {
    id: 'p7_compliance_review',
    label: 'Complete 90-day compliance review',
    phase: 'phase_7',
    owner: 'Compliance',
    timing: 'Day 90',
    is_hard_gate: true,
  },
  {
    id: 'p7_graduation_call',
    label: 'Graduation to CX (final call with CX team)',
    phase: 'phase_7',
    owner: 'CXM',
    timing: 'Day 90',
    is_hard_gate: true,
  },
  {
    id: 'p7_handoff',
    label: 'Hand off to ongoing support model',
    phase: 'phase_7',
    owner: 'Director',
    timing: 'Day 90',
    is_hard_gate: true,
  },
  {
    id: 'p7_close_slack',
    label: 'Close onboarding Slack channel',
    phase: 'phase_7',
    owner: 'AXA',
    timing: 'Day 90',
    is_hard_gate: false,
  },
  {
    id: 'p7_archive',
    label: 'Archive onboarding documentation',
    phase: 'phase_7',
    owner: 'AXA',
    timing: 'Day 90',
    is_hard_gate: false,
  },
  {
    id: 'p7_lessons_learned',
    label: 'Conduct lessons learned review',
    phase: 'phase_7',
    owner: 'AXA',
    timing: 'Day 90',
    is_hard_gate: false,
  },
];

// ────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Get all tasks for a specific phase
 */
export function getTasksByPhase(phase: Phase): Task[] {
  return TASKS.filter(t => t.phase === phase);
}

/**
 * Get total count of tasks
 */
export function getTotalTaskCount(): number {
  return TASKS.length;
}

/**
 * Get count of hard gates (critical tasks)
 */
export function getHardGateCount(): number {
  return TASKS.filter(t => t.is_hard_gate).length;
}

/**
 * Get phase statistics
 */
export function getPhaseStats() {
  return PHASE_ORDER.map(phase => ({
    phase,
    label: PHASES[phase].label,
    total: getTasksByPhase(phase).length,
    hard_gates: getTasksByPhase(phase).filter(t => t.is_hard_gate).length,
  }));
}
