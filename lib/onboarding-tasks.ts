// ── Types ────────────────────────────────────────────────────────────────────

export type Phase = 'phase_0' | 'phase_1' | 'phase_2' | 'phase_3' | 'phase_4' | 'phase_5' | 'phase_6' | 'phase_7';

export type DueAnchor = 'day0' | 'launch' | 'post_launch';

export type TaskRole =
  | 'AXM' | 'AXA' | 'CTM' | 'CTA' | 'CXM'
  | 'Recruiter' | 'Director' | 'IT' | 'HR' | 'Finance'
  | 'Marketing' | 'Compliance' | 'Investment Team' | 'FP Team'
  | 'Advisor' | 'RIA Leadership';

export interface OnboardingTask {
  key: string;
  label: string;
  phase: Phase;
  owner: TaskRole;
  timing: string;
  is_hard_gate: boolean;
  due_offset_days: number;
  due_anchor: DueAnchor;
  resource_link?: string;
}

export interface PhaseMeta {
  label: string;
  description: string;
  timing: string;
}

// ── Phase Metadata ──────────────────────────────────────────────────────────

export const PHASE_META: Record<Phase, PhaseMeta> = {
  phase_0: { label: 'Phase 0 — Sales Handoff',       description: 'Close-to-onboarding handoff from recruiting',  timing: 'Day 0' },
  phase_1: { label: 'Phase 1 — Post-Signing Prep',    description: 'Folder creation, scoping, intake forms',        timing: 'Day 0 → Day 14' },
  phase_2: { label: 'Phase 2 — Onboarding Kick-Off',  description: 'Kick-off call, transition blueprint, deliverables', timing: 'Day 14 → Day 21' },
  phase_3: { label: 'Phase 3 — Pre-Launch Build',     description: 'Compliance, department intros, NCL, marketing',  timing: 'Day 21 → T-14' },
  phase_4: { label: 'Phase 4 — T-7 Final Countdown',  description: 'Pre-launch sync, Go/No-Go, final verifications', timing: 'T-7 → T-1' },
  phase_5: { label: 'Phase 5 — Launch Day',           description: 'Day 1 welcome, access, systems, introductions',  timing: 'Launch Day' },
  phase_6: { label: 'Phase 6 — Active Transition',    description: 'Department meetings, DocuSign, CRM import',      timing: 'T+1 → T+30' },
  phase_7: { label: 'Phase 7 — Graduation & Handoff', description: '90-day review, graduation, archive',             timing: 'T+30 → T+90' },
};

export const PHASE_ORDER: Phase[] = [
  'phase_0', 'phase_1', 'phase_2', 'phase_3',
  'phase_4', 'phase_5', 'phase_6', 'phase_7',
];

// ── Due Date Calculator ─────────────────────────────────────────────────────

export function calculateDueDate(
  task: OnboardingTask,
  dates: { day0_date?: string | null; launch_date?: string | null }
): string | null {
  const { day0_date, launch_date } = dates;

  let anchor: string | null | undefined = null;
  if (task.due_anchor === 'day0') anchor = day0_date;
  else if (task.due_anchor === 'launch' || task.due_anchor === 'post_launch') anchor = launch_date;

  if (!anchor) return null;

  const d = new Date(anchor);
  if (isNaN(d.getTime())) return null;

  d.setDate(d.getDate() + task.due_offset_days);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// ── Role Display Config ─────────────────────────────────────────────────────

export const ROLE_LABELS: Record<TaskRole, string> = {
  AXM: 'Advisor Experience Manager',
  AXA: 'Advisor Experience Associate',
  CTM: 'Client Transition Manager',
  CTA: 'Client Transition Associate',
  CXM: 'Client Experience Manager',
  Recruiter: 'Recruiter',
  Director: 'Director',
  IT: 'IT',
  HR: 'HR',
  Finance: 'Finance',
  Marketing: 'Marketing',
  Compliance: 'Compliance',
  'Investment Team': 'Investment Team',
  'FP Team': 'Financial Planning Team',
  Advisor: 'Advisor',
  'RIA Leadership': 'RIA Leadership',
};

// ── ~93 Task Definitions ────────────────────────────────────────────────────

export const ONBOARDING_TASKS: OnboardingTask[] = [

  // ── Phase 0: Sales Handoff (5 tasks) ─────────────────────────────────────
  { key: 'p0_mark_signed',         label: 'Mark deal as signed in HubSpot',                        phase: 'phase_0', owner: 'Recruiter',      timing: 'Day 0',       is_hard_gate: true,  due_offset_days: 0,   due_anchor: 'day0' },
  { key: 'p0_recruiter_axm_sync',  label: 'Recruiter / AXM prep sync call',                        phase: 'phase_0', owner: 'Recruiter',      timing: 'Day 0',       is_hard_gate: false, due_offset_days: 0,   due_anchor: 'day0' },
  { key: 'p0_create_profile',      label: 'Create advisor profile in system',                      phase: 'phase_0', owner: 'AXA',            timing: 'Day 0',       is_hard_gate: false, due_offset_days: 1,   due_anchor: 'day0' },
  { key: 'p0_assign_axm',          label: 'Assign AXM to advisor',                                 phase: 'phase_0', owner: 'Director',        timing: 'Day 0',       is_hard_gate: true,  due_offset_days: 1,   due_anchor: 'day0' },
  { key: 'p0_handoff_doc',         label: 'Complete sales-to-onboarding handoff document',          phase: 'phase_0', owner: 'Recruiter',      timing: 'Day 0–1',     is_hard_gate: true,  due_offset_days: 1,   due_anchor: 'day0' },

  // ── Phase 1: Post-Signing Prep (22 tasks) ────────────────────────────────
  { key: 'p1_create_folder',       label: 'Create advisor Google Drive folder',                     phase: 'phase_1', owner: 'AXA',            timing: 'Day 1',       is_hard_gate: false, due_offset_days: 1,   due_anchor: 'day0' },
  { key: 'p1_transition_sheet',    label: 'Populate transition tracking sheet',                     phase: 'phase_1', owner: 'CTM',            timing: 'Day 1–2',     is_hard_gate: false, due_offset_days: 2,   due_anchor: 'day0' },
  { key: 'p1_slack_channel',       label: 'Create advisor Slack channel',                           phase: 'phase_1', owner: 'AXA',            timing: 'Day 1',       is_hard_gate: false, due_offset_days: 1,   due_anchor: 'day0' },
  { key: 'p1_kickoff_email',       label: 'Send kickoff email to advisor',                          phase: 'phase_1', owner: 'AXM',            timing: 'Day 1–2',     is_hard_gate: true,  due_offset_days: 2,   due_anchor: 'day0' },
  { key: 'p1_send_iaas',           label: 'Send IAAs for signature',                                phase: 'phase_1', owner: 'AXM',            timing: 'Day 2–3',     is_hard_gate: true,  due_offset_days: 3,   due_anchor: 'day0' },
  { key: 'p1_intake_form_ax',      label: 'Send AX intake form',                                    phase: 'phase_1', owner: 'AXA',            timing: 'Day 2',       is_hard_gate: false, due_offset_days: 2,   due_anchor: 'day0' },
  { key: 'p1_intake_form_ct',      label: 'Send transition intake form',                            phase: 'phase_1', owner: 'CTM',            timing: 'Day 2',       is_hard_gate: false, due_offset_days: 2,   due_anchor: 'day0' },
  { key: 'p1_tech_procurement',    label: 'Submit tech procurement form',                           phase: 'phase_1', owner: 'AXA',            timing: 'Day 2–3',     is_hard_gate: false, due_offset_days: 3,   due_anchor: 'day0' },
  { key: 'p1_marketing_intake',    label: 'Submit marketing intake form',                           phase: 'phase_1', owner: 'AXA',            timing: 'Day 3',       is_hard_gate: false, due_offset_days: 3,   due_anchor: 'day0' },
  { key: 'p1_scoping_call',        label: 'Hold scoping call (AXM + CTM + Advisor)',                phase: 'phase_1', owner: 'AXM',            timing: 'Day 3–5',     is_hard_gate: true,  due_offset_days: 5,   due_anchor: 'day0' },
  { key: 'p1_book_analysis',       label: 'Request book analysis from transitions',                 phase: 'phase_1', owner: 'CTM',            timing: 'Day 3–5',     is_hard_gate: false, due_offset_days: 5,   due_anchor: 'day0' },
  { key: 'p1_holiday_client_list', label: 'Prepare holiday/client list',                            phase: 'phase_1', owner: 'AXA',            timing: 'Day 3',       is_hard_gate: false, due_offset_days: 3,   due_anchor: 'day0' },
  { key: 'p1_schedule_merger',     label: 'Schedule custodian merger analysis meeting',              phase: 'phase_1', owner: 'CTM',            timing: 'Day 5–7',     is_hard_gate: false, due_offset_days: 7,   due_anchor: 'day0' },
  { key: 'p1_sma_alts_form',       label: 'Review SMA/Alts form with advisor',                      phase: 'phase_1', owner: 'AXM',            timing: 'Day 5–7',     is_hard_gate: false, due_offset_days: 7,   due_anchor: 'day0' },
  { key: 'p1_insurance_form',      label: 'Collect insurance/annuities form',                       phase: 'phase_1', owner: 'CTA',            timing: 'Day 5–7',     is_hard_gate: false, due_offset_days: 7,   due_anchor: 'day0' },
  { key: 'p1_verify_npi_loi',      label: 'Verify NPI/LOI documentation',                           phase: 'phase_1', owner: 'CTA',            timing: 'Day 5',       is_hard_gate: false, due_offset_days: 5,   due_anchor: 'day0' },
  { key: 'p1_weekly_checkin_1',    label: 'Weekly check-in #1 with advisor',                        phase: 'phase_1', owner: 'AXM',            timing: 'Day 7',       is_hard_gate: false, due_offset_days: 7,   due_anchor: 'day0' },
  { key: 'p1_u4_2b_upload',        label: 'Review U4/2B upload',                                    phase: 'phase_1', owner: 'AXA',            timing: 'Day 7–10',    is_hard_gate: false, due_offset_days: 10,  due_anchor: 'day0' },
  { key: 'p1_hold_merger_analysis',label: 'Hold custodian merger analysis meeting',                  phase: 'phase_1', owner: 'CTM',            timing: 'Day 10–12',   is_hard_gate: false, due_offset_days: 12,  due_anchor: 'day0' },
  { key: 'p1_client_communication',label: 'Prepare client communication plan',                      phase: 'phase_1', owner: 'CTM',            timing: 'Day 10–14',   is_hard_gate: false, due_offset_days: 14,  due_anchor: 'day0' },
  { key: 'p1_dual_register',       label: 'Initiate dual registration',                             phase: 'phase_1', owner: 'CTA',            timing: 'Day 7–10',    is_hard_gate: true,  due_offset_days: 10,  due_anchor: 'day0' },
  { key: 'p1_weekly_checkin_2',    label: 'Weekly check-in #2 with advisor',                        phase: 'phase_1', owner: 'AXM',            timing: 'Day 14',      is_hard_gate: false, due_offset_days: 14,  due_anchor: 'day0' },

  // ── Phase 2: Onboarding Kick-Off (10 tasks) ──────────────────────────────
  { key: 'p2_kickoff_call',        label: 'Hold onboarding kick-off call',                          phase: 'phase_2', owner: 'AXM',            timing: 'Day 14–16',   is_hard_gate: true,  due_offset_days: 16,  due_anchor: 'day0' },
  { key: 'p2_transition_blueprint',label: 'Finalize transition blueprint',                           phase: 'phase_2', owner: 'CTM',            timing: 'Day 14–16',   is_hard_gate: true,  due_offset_days: 16,  due_anchor: 'day0' },
  { key: 'p2_deliverables_email',  label: 'Send deliverables recap email',                           phase: 'phase_2', owner: 'AXM',            timing: 'Day 16',      is_hard_gate: false, due_offset_days: 16,  due_anchor: 'day0' },
  { key: 'p2_ncl_submission',      label: 'Submit NCL (Notice to Current Custodian)',                phase: 'phase_2', owner: 'CTM',            timing: 'Day 15–17',   is_hard_gate: true,  due_offset_days: 17,  due_anchor: 'day0' },
  { key: 'p2_master_merge_notice', label: 'Send master merge notice (if applicable)',                phase: 'phase_2', owner: 'CTM',            timing: 'Day 16–18',   is_hard_gate: false, due_offset_days: 18,  due_anchor: 'day0' },
  { key: 'p2_confirm_launch_date', label: 'Confirm target launch date with advisor',                 phase: 'phase_2', owner: 'AXM',            timing: 'Day 16–18',   is_hard_gate: true,  due_offset_days: 18,  due_anchor: 'day0' },
  { key: 'p2_update_hubspot',      label: 'Update HubSpot with confirmed launch date',               phase: 'phase_2', owner: 'AXA',            timing: 'Day 18',      is_hard_gate: false, due_offset_days: 18,  due_anchor: 'day0' },
  { key: 'p2_custodian_creds',     label: 'Create custodian credentials',                            phase: 'phase_2', owner: 'CTA',            timing: 'Day 16–20',   is_hard_gate: false, due_offset_days: 20,  due_anchor: 'day0' },
  { key: 'p2_advisor_portal',      label: 'Create advisor portal (if applicable)',                   phase: 'phase_2', owner: 'AXA',            timing: 'Day 18–21',   is_hard_gate: false, due_offset_days: 21,  due_anchor: 'day0' },
  { key: 'p2_weekly_checkin_3',    label: 'Weekly check-in #3 with advisor',                        phase: 'phase_2', owner: 'AXM',            timing: 'Day 21',      is_hard_gate: false, due_offset_days: 21,  due_anchor: 'day0' },

  // ── Phase 3: Pre-Launch Build (18 tasks) ──────────────────────────────────
  { key: 'p3_compliance_reg',      label: 'Complete compliance registration',                        phase: 'phase_3', owner: 'Compliance',     timing: 'T-30 → T-14', is_hard_gate: true,  due_offset_days: -14, due_anchor: 'launch' },
  { key: 'p3_intro_compliance',    label: 'Department intro: Compliance',                            phase: 'phase_3', owner: 'AXM',            timing: 'T-28 → T-14', is_hard_gate: false, due_offset_days: -14, due_anchor: 'launch' },
  { key: 'p3_intro_investments',   label: 'Department intro: Investments',                           phase: 'phase_3', owner: 'AXM',            timing: 'T-28 → T-14', is_hard_gate: false, due_offset_days: -14, due_anchor: 'launch' },
  { key: 'p3_intro_fp',            label: 'Department intro: Financial Planning',                    phase: 'phase_3', owner: 'AXM',            timing: 'T-28 → T-14', is_hard_gate: false, due_offset_days: -14, due_anchor: 'launch' },
  { key: 'p3_intro_marketing',     label: 'Department intro: Marketing',                             phase: 'phase_3', owner: 'AXM',            timing: 'T-28 → T-14', is_hard_gate: false, due_offset_days: -14, due_anchor: 'launch' },
  { key: 'p3_intro_it',            label: 'Department intro: IT',                                    phase: 'phase_3', owner: 'AXA',            timing: 'T-28 → T-14', is_hard_gate: false, due_offset_days: -14, due_anchor: 'launch' },
  { key: 'p3_intro_hr',            label: 'Department intro: HR',                                    phase: 'phase_3', owner: 'AXA',            timing: 'T-28 → T-14', is_hard_gate: false, due_offset_days: -14, due_anchor: 'launch' },
  { key: 'p3_intro_pinnacle',      label: 'Department intro: Pinnacle/DPL',                          phase: 'phase_3', owner: 'AXM',            timing: 'T-28 → T-14', is_hard_gate: false, due_offset_days: -14, due_anchor: 'launch' },
  { key: 'p3_ncl_receipt',         label: 'Confirm NCL receipt by custodian',                        phase: 'phase_3', owner: 'CTM',            timing: 'T-21 → T-14', is_hard_gate: true,  due_offset_days: -14, due_anchor: 'launch' },
  { key: 'p3_marketing_materials', label: 'Finalize marketing materials & website',                  phase: 'phase_3', owner: 'Marketing',      timing: 'T-21 → T-10', is_hard_gate: false, due_offset_days: -10, due_anchor: 'launch' },
  { key: 'p3_tech_setup',          label: 'Complete tech provisioning & setup',                      phase: 'phase_3', owner: 'IT',             timing: 'T-21 → T-10', is_hard_gate: false, due_offset_days: -10, due_anchor: 'launch' },
  { key: 'p3_bd_billing_setup',    label: 'Set up BlackDiamond billing',                             phase: 'phase_3', owner: 'CTA',            timing: 'T-14 → T-10', is_hard_gate: false, due_offset_days: -10, due_anchor: 'launch' },
  { key: 'p3_hr_paperwork',        label: 'Complete HR onboarding paperwork',                        phase: 'phase_3', owner: 'HR',             timing: 'T-14 → T-7',  is_hard_gate: true,  due_offset_days: -7,  due_anchor: 'launch' },
  { key: 'p3_notice_custodian',    label: 'Submit notice to custodian (formal)',                     phase: 'phase_3', owner: 'CTM',            timing: 'T-14 → T-7',  is_hard_gate: true,  due_offset_days: -7,  due_anchor: 'launch' },
  { key: 'p3_client_comms_ready',  label: 'Client communications ready for launch',                  phase: 'phase_3', owner: 'CTM',            timing: 'T-10 → T-7',  is_hard_gate: false, due_offset_days: -7,  due_anchor: 'launch' },
  { key: 'p3_finance_setup',       label: 'Finance: advisor compensation setup',                     phase: 'phase_3', owner: 'Finance',        timing: 'T-14 → T-7',  is_hard_gate: false, due_offset_days: -7,  due_anchor: 'launch' },
  { key: 'p3_access_provisioning', label: 'Access provisioning (email, systems)',                    phase: 'phase_3', owner: 'AXA',            timing: 'T-10 → T-7',  is_hard_gate: false, due_offset_days: -7,  due_anchor: 'launch' },
  { key: 'p3_weekly_checkin_4',    label: 'Weekly check-in #4 with advisor',                        phase: 'phase_3', owner: 'AXM',            timing: 'T-14',        is_hard_gate: false, due_offset_days: -14, due_anchor: 'launch' },

  // ── Phase 4: T-7 Final Countdown (8 tasks) ───────────────────────────────
  { key: 'p4_prelaunch_sync',      label: 'Pre-launch sync (AXM + CTM + Director)',                 phase: 'phase_4', owner: 'AXM',            timing: 'T-7',         is_hard_gate: true,  due_offset_days: -7,  due_anchor: 'launch' },
  { key: 'p4_day1_guide',          label: 'Prepare Day 1 guide for advisor',                        phase: 'phase_4', owner: 'AXA',            timing: 'T-5',         is_hard_gate: false, due_offset_days: -5,  due_anchor: 'launch' },
  { key: 'p4_verify_meetings',     label: 'Verify all Day 1 meetings scheduled',                    phase: 'phase_4', owner: 'AXA',            timing: 'T-5',         is_hard_gate: false, due_offset_days: -5,  due_anchor: 'launch' },
  { key: 'p4_tech_shipment',       label: 'Confirm tech shipment received',                         phase: 'phase_4', owner: 'AXA',            timing: 'T-3',         is_hard_gate: true,  due_offset_days: -3,  due_anchor: 'launch' },
  { key: 'p4_system_access',       label: 'Verify all system access is active',                     phase: 'phase_4', owner: 'IT',             timing: 'T-3',         is_hard_gate: true,  due_offset_days: -3,  due_anchor: 'launch' },
  { key: 'p4_compliance_cleared',  label: 'Compliance clearance confirmed',                         phase: 'phase_4', owner: 'Compliance',     timing: 'T-2',         is_hard_gate: true,  due_offset_days: -2,  due_anchor: 'launch' },
  { key: 'p4_go_no_go',            label: 'Go / No-Go decision call',                               phase: 'phase_4', owner: 'Director',       timing: 'T-1',         is_hard_gate: true,  due_offset_days: -1,  due_anchor: 'launch' },
  { key: 'p4_final_advisor_call',  label: 'Final pre-launch call with advisor',                     phase: 'phase_4', owner: 'AXM',            timing: 'T-1',         is_hard_gate: false, due_offset_days: -1,  due_anchor: 'launch' },

  // ── Phase 5: Launch Day (12 tasks) ────────────────────────────────────────
  { key: 'p5_day1_welcome',        label: 'Day 1 welcome message / email',                          phase: 'phase_5', owner: 'AXM',            timing: 'Launch Day',  is_hard_gate: false, due_offset_days: 0,   due_anchor: 'launch' },
  { key: 'p5_access_verify',       label: 'Verify all system access on Day 1',                      phase: 'phase_5', owner: 'AXA',            timing: 'Launch Day',  is_hard_gate: true,  due_offset_days: 0,   due_anchor: 'launch' },
  { key: 'p5_day1_call',           label: 'Hold Day 1 orientation call',                            phase: 'phase_5', owner: 'AXM',            timing: 'Launch Day',  is_hard_gate: true,  due_offset_days: 0,   due_anchor: 'launch' },
  { key: 'p5_systems_overview',    label: 'Systems & tools overview session',                        phase: 'phase_5', owner: 'AXA',            timing: 'Launch Day',  is_hard_gate: false, due_offset_days: 0,   due_anchor: 'launch' },
  { key: 'p5_ria_intro',           label: 'Introduce advisor to RIA Manager',                       phase: 'phase_5', owner: 'AXM',            timing: 'Launch Day',  is_hard_gate: false, due_offset_days: 0,   due_anchor: 'launch' },
  { key: 'p5_cx_demo',             label: 'CX pod introduction & demo',                             phase: 'phase_5', owner: 'CXM',            timing: 'Launch Day',  is_hard_gate: false, due_offset_days: 0,   due_anchor: 'launch' },
  { key: 'p5_client_announcement', label: 'Client announcement sent',                               phase: 'phase_5', owner: 'CTM',            timing: 'Launch Day',  is_hard_gate: true,  due_offset_days: 0,   due_anchor: 'launch' },
  { key: 'p5_migration_start',     label: 'Custodian migration sequence initiated',                 phase: 'phase_5', owner: 'CTM',            timing: 'Launch Day',  is_hard_gate: true,  due_offset_days: 0,   due_anchor: 'launch' },
  { key: 'p5_hubspot_launched',    label: 'Update HubSpot to Launched stage',                       phase: 'phase_5', owner: 'AXA',            timing: 'Launch Day',  is_hard_gate: false, due_offset_days: 0,   due_anchor: 'launch' },
  { key: 'p5_slack_announce',      label: 'Post launch announcement in Slack',                      phase: 'phase_5', owner: 'AXM',            timing: 'Launch Day',  is_hard_gate: false, due_offset_days: 0,   due_anchor: 'launch' },
  { key: 'p5_gift_welcome',        label: 'Send welcome gift / swag box',                           phase: 'phase_5', owner: 'AXA',            timing: 'Launch Day',  is_hard_gate: false, due_offset_days: 0,   due_anchor: 'launch' },
  { key: 'p5_weekly_transition',   label: 'Begin weekly transition check-ins',                      phase: 'phase_5', owner: 'CTM',            timing: 'Launch Day',  is_hard_gate: false, due_offset_days: 0,   due_anchor: 'launch' },

  // ── Phase 6: Active Transition (12 tasks) ─────────────────────────────────
  { key: 'p6_week1_compliance',    label: 'Week 1 meeting: Compliance',                             phase: 'phase_6', owner: 'AXM',            timing: 'T+1 → T+5',  is_hard_gate: false, due_offset_days: 5,   due_anchor: 'post_launch' },
  { key: 'p6_week1_investments',   label: 'Week 1 meeting: Investments',                            phase: 'phase_6', owner: 'AXM',            timing: 'T+1 → T+5',  is_hard_gate: false, due_offset_days: 5,   due_anchor: 'post_launch' },
  { key: 'p6_week1_fp',            label: 'Week 1 meeting: Financial Planning',                     phase: 'phase_6', owner: 'AXM',            timing: 'T+1 → T+5',  is_hard_gate: false, due_offset_days: 5,   due_anchor: 'post_launch' },
  { key: 'p6_docusign_packages',   label: 'Send DocuSign client packages',                          phase: 'phase_6', owner: 'CTA',            timing: 'T+1 → T+7',  is_hard_gate: true,  due_offset_days: 7,   due_anchor: 'post_launch' },
  { key: 'p6_crm_import',          label: 'CRM import / migration',                                 phase: 'phase_6', owner: 'CTA',            timing: 'T+3 → T+10', is_hard_gate: false, due_offset_days: 10,  due_anchor: 'post_launch' },
  { key: 'p6_shell_portals',       label: 'Create client shell portals',                            phase: 'phase_6', owner: 'AXA',            timing: 'T+5 → T+10', is_hard_gate: false, due_offset_days: 10,  due_anchor: 'post_launch' },
  { key: 'p6_bd_householding',     label: 'BlackDiamond householding & billing',                    phase: 'phase_6', owner: 'CTA',            timing: 'T+7 → T+14', is_hard_gate: false, due_offset_days: 14,  due_anchor: 'post_launch' },
  { key: 'p6_performance_migrate', label: 'Performance data migration',                             phase: 'phase_6', owner: 'CTA',            timing: 'T+7 → T+21', is_hard_gate: false, due_offset_days: 21,  due_anchor: 'post_launch' },
  { key: 'p6_client_gifts',        label: 'Farther client gift boxes',                              phase: 'phase_6', owner: 'AXA',            timing: 'T+7 → T+14', is_hard_gate: false, due_offset_days: 14,  due_anchor: 'post_launch' },
  { key: 'p6_hr_orientation',      label: 'HR orientation',                                          phase: 'phase_6', owner: 'HR',             timing: 'T+3 → T+7',  is_hard_gate: false, due_offset_days: 7,   due_anchor: 'post_launch' },
  { key: 'p6_insurance_progress',  label: 'Check insurance/annuities transfer progress',            phase: 'phase_6', owner: 'CTA',            timing: 'T+14 → T+21',is_hard_gate: false, due_offset_days: 21,  due_anchor: 'post_launch' },
  { key: 'p6_intro_cx_pod',        label: 'Full CX pod introduction & handoff',                     phase: 'phase_6', owner: 'CXM',            timing: 'T+7 → T+14', is_hard_gate: false, due_offset_days: 14,  due_anchor: 'post_launch' },

  // ── Phase 7: Graduation & Handoff (6 tasks) ──────────────────────────────
  { key: 'p7_transition_weekly',   label: 'Transition to weekly RIA check-ins',                     phase: 'phase_7', owner: 'AXM',            timing: 'T+30',        is_hard_gate: false, due_offset_days: 30,  due_anchor: 'post_launch' },
  { key: 'p7_90day_compliance',    label: '90-day compliance review',                               phase: 'phase_7', owner: 'Compliance',     timing: 'T+90',        is_hard_gate: true,  due_offset_days: 90,  due_anchor: 'post_launch' },
  { key: 'p7_graduation_call',     label: 'Graduation call with advisor',                           phase: 'phase_7', owner: 'AXM',            timing: 'T+90',        is_hard_gate: true,  due_offset_days: 90,  due_anchor: 'post_launch' },
  { key: 'p7_handoff_ria',         label: 'Handoff to RIA Manager',                                 phase: 'phase_7', owner: 'RIA Leadership', timing: 'T+90',        is_hard_gate: false, due_offset_days: 90,  due_anchor: 'post_launch' },
  { key: 'p7_archive_folder',      label: 'Archive onboarding folder',                              phase: 'phase_7', owner: 'AXA',            timing: 'T+90',        is_hard_gate: false, due_offset_days: 90,  due_anchor: 'post_launch' },
  { key: 'p7_lessons_learned',     label: 'Complete lessons learned retrospective',                 phase: 'phase_7', owner: 'AXM',            timing: 'T+90',        is_hard_gate: false, due_offset_days: 90,  due_anchor: 'post_launch' },
];

export const TASKS_BY_PHASE: Record<Phase, OnboardingTask[]> = PHASE_ORDER.reduce((acc, phase) => {
  acc[phase] = ONBOARDING_TASKS.filter(t => t.phase === phase);
  return acc;
}, {} as Record<Phase, OnboardingTask[]>);

// ── Pipeline Stage Labels (preserved from legacy) ───────────────────────────

export const STAGE_LABELS: Record<string, string> = {
  '2496931':  'Step 1 – First Meeting',
  '2496932':  'Step 2 – Financial Model',
  '2496934':  'Step 3 – Advisor Demo',
  '100409509':'Step 4 – Discovery Day',
  '2496935':  'Step 5 – Offer Review',
  '2496936':  'Step 6 – Offer Accepted',
  '100411705':'Step 7 – Launched',
  '31214941': 'Holding Pattern',
  '2496937':  'Prospect Passed',
  '26572965': 'Farther Passed',
};

export const ACTIVE_STAGE_IDS = ['2496931','2496932','2496934','100409509','2496935','2496936','100411705'];
export const ONBOARDING_STAGE_IDS = ['2496936','100411705'];
