export type Phase = 'pre_launch' | 'launch_day' | 'post_launch';
export type TaskRole = 'AXM' | 'AXA' | 'CTM' | 'CTA';

export interface OnboardingTask {
  key: string;
  label: string;
  phase: Phase;
  role: TaskRole;
  optional?: boolean;
}

export const ONBOARDING_TASKS: OnboardingTask[] = [
  // Pre-Launch (30 tasks)
  { key: 'pre_01_create_folder',            label: 'Create Advisor Folder',                      phase: 'pre_launch', role: 'AXA' },
  { key: 'pre_02_send_iaas',                label: 'Send IAAs',                                   phase: 'pre_launch', role: 'AXM' },
  { key: 'pre_03_schedule_merger_analysis', label: 'Schedule Custodian Merger Analysis Meeting',  phase: 'pre_launch', role: 'CTM' },
  { key: 'pre_04_tech_procurement_form',    label: 'Check Tech Procurement Form',                 phase: 'pre_launch', role: 'AXA' },
  { key: 'pre_05_kickoff_email',            label: 'Kickoff Email',                               phase: 'pre_launch', role: 'AXM' },
  { key: 'pre_06_holiday_client_list',      label: 'Prepare Holiday/Client List',                 phase: 'pre_launch', role: 'AXA' },
  { key: 'pre_07_intro_marketing',          label: 'Introduce to Marketing Team',                 phase: 'pre_launch', role: 'AXM' },
  { key: 'pre_08_intro_it',                 label: 'Introduce to IT Team',                        phase: 'pre_launch', role: 'AXA' },
  { key: 'pre_09_client_communication',     label: 'Prepare Client Communication',                phase: 'pre_launch', role: 'CTM' },
  { key: 'pre_10_dual_register',            label: 'Dual Register',                               phase: 'pre_launch', role: 'CTA' },
  { key: 'pre_11_verify_npi_loi',           label: 'Verify NPI/LOI',                              phase: 'pre_launch', role: 'CTA' },
  { key: 'pre_12_transition_sheet',         label: 'Populate Transition Sheet',                   phase: 'pre_launch', role: 'CTM' },
  { key: 'pre_13_intro_compliance',         label: 'Introduce to Compliance Team',                phase: 'pre_launch', role: 'AXM' },
  { key: 'pre_14_intro_financial_planning', label: 'Introduce to Financial Planning Team',        phase: 'pre_launch', role: 'AXM' },
  { key: 'pre_15_confirm_tech_shipment',    label: 'Confirm Tech Shipment',                       phase: 'pre_launch', role: 'AXA' },
  { key: 'pre_16_weekly_checkin',           label: 'Weekly Check-In',                             phase: 'pre_launch', role: 'AXM' },
  { key: 'pre_17_notice_to_custodian',      label: 'Submit Notice to Custodian',                  phase: 'pre_launch', role: 'CTM' },
  { key: 'pre_18_intro_hr',                 label: 'Introduce to HR Team',                        phase: 'pre_launch', role: 'AXA' },
  { key: 'pre_19_marketing_intake_form',    label: 'Check Marketing Intake Form',                 phase: 'pre_launch', role: 'AXA' },
  { key: 'pre_20_custodian_credentials',    label: 'Create Custodian Credentials',                phase: 'pre_launch', role: 'CTA', optional: true },
  { key: 'pre_21_book_analysis',            label: 'Review Book Analysis',                        phase: 'pre_launch', role: 'CTM' },
  { key: 'pre_22_intro_pinnacle_dpl',       label: 'Introduce to Pinnacle/DPL Team',              phase: 'pre_launch', role: 'AXM' },
  { key: 'pre_23_access_provisioning',      label: 'Access & Provisioning',                       phase: 'pre_launch', role: 'AXA', optional: true },
  { key: 'pre_24_sma_alts_form',            label: 'Review SMA/Alts Form',                        phase: 'pre_launch', role: 'AXM' },
  { key: 'pre_25_intro_investments',        label: 'Introduce to Investments Team',               phase: 'pre_launch', role: 'AXM' },
  { key: 'pre_26_hold_merger_analysis',     label: 'Hold Custodian Merger Analysis Meeting',      phase: 'pre_launch', role: 'CTM' },
  { key: 'pre_27_insurance_annuities_form', label: 'Check Insurance/Annuities Form',              phase: 'pre_launch', role: 'CTA' },
  { key: 'pre_28_u4_2b_upload',             label: 'Review U4/2B Upload',                         phase: 'pre_launch', role: 'AXA' },
  { key: 'pre_29_advisor_portal',           label: 'Create Advisor Portal',                       phase: 'pre_launch', role: 'AXA', optional: true },
  { key: 'pre_30_kickoff_call',             label: 'Hold Kick-off Call',                          phase: 'pre_launch', role: 'AXM' },

  // Launch Day (4 tasks)
  { key: 'launch_01_migration_sequence',    label: 'Custodian 3-day Migration Sequence',          phase: 'launch_day', role: 'CTM' },
  { key: 'launch_02_weekly_transition',     label: 'Weekly Transition Check-In',                  phase: 'launch_day', role: 'CTM' },
  { key: 'launch_03_day1_call_tech',        label: 'Hold Day 1 Call & Tech Setup',                phase: 'launch_day', role: 'AXM' },
  { key: 'launch_04_intro_ria_manager',     label: 'Introduce to RIA Manager',                    phase: 'launch_day', role: 'AXM' },

  // Post-Launch (9 tasks)
  { key: 'post_01_gift_boxes',              label: 'Farther Client Gift Boxes',                   phase: 'post_launch', role: 'AXA' },
  { key: 'post_02_intro_cx_pod',            label: 'Introduction to CX Pod',                      phase: 'post_launch', role: 'AXM' },
  { key: 'post_03_bd_householding',         label: 'BlackDiamond Householding & Billing',         phase: 'post_launch', role: 'CTA' },
  { key: 'post_04_graduation_handoff',      label: 'Graduation/RIA Handoff',                      phase: 'post_launch', role: 'AXM' },
  { key: 'post_05_hr_orientation',          label: 'HR Orientation',                              phase: 'post_launch', role: 'AXA' },
  { key: 'post_06_performance_migration',   label: 'Performance Migration',                       phase: 'post_launch', role: 'CTA' },
  { key: 'post_07_insurance_progress',      label: 'Check Insurance/Annuities Progress',          phase: 'post_launch', role: 'CTA' },
  { key: 'post_08_shell_portals',           label: 'Create Shell Portals',                        phase: 'post_launch', role: 'AXA' },
  { key: 'post_09_crm_import',              label: 'CRM Import/Migration',                        phase: 'post_launch', role: 'CTA' },
];

export const TASKS_BY_PHASE = {
  pre_launch:  ONBOARDING_TASKS.filter(t => t.phase === 'pre_launch'),
  launch_day:  ONBOARDING_TASKS.filter(t => t.phase === 'launch_day'),
  post_launch: ONBOARDING_TASKS.filter(t => t.phase === 'post_launch'),
};

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
