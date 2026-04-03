import { prisma } from '@/lib/prisma';

// ── Types ────────────────────────────────────────────────────────────────────

export interface TransitionAccount {
  id: number;
  household_name: string;
  account_type: string | null;
  primary_first_name: string | null;
  primary_last_name: string | null;
  primary_email: string | null;
  status_of_iaa: string | null;
  status_of_account_paperwork: string | null;
  portal_status: string | null;
  document_readiness: string | null;
  docusign_iaa_status: string | null;
  docusign_paperwork_status: string | null;
  fee_schedule: string | null;
}

export interface HouseholdGroup {
  household_name: string;
  advisor_name: string;
  accounts: TransitionAccount[];
  account_count: number;
  household_status: string;
  completion_pct: number;
  iaa_complete: number;
  paperwork_complete: number;
  portal_complete: number;
}

// ── Status progression (ordered worst → best) ───────────────────────────────

const STATUS_ORDER = [
  'Not Ready',
  'Ready',
  'IAA Sent',
  'Pending Signature',
  'IAA Signed',
  'Paperwork Complete',
  'Portal',
  'Complete',
] as const;

type HouseholdStatus = (typeof STATUS_ORDER)[number];

// ── Determine individual account status ─────────────────────────────────────

function getAccountStatus(account: TransitionAccount): HouseholdStatus {
  const iaaComplete =
    account.status_of_iaa === 'Completed' ||
    account.docusign_iaa_status?.toLowerCase() === 'completed';

  const paperworkComplete =
    account.status_of_account_paperwork === 'Completed' ||
    account.docusign_paperwork_status?.toLowerCase() === 'completed';

  const portalComplete =
    account.portal_status === 'Complete' ||
    account.portal_status === 'Active' ||
    account.portal_status === 'Portal Created';

  // All three done → Complete
  if (iaaComplete && paperworkComplete && portalComplete) return 'Complete';

  // Portal active
  if (portalComplete) return 'Portal';

  // Paperwork done
  if (paperworkComplete) return 'Paperwork Complete';

  // IAA signed
  if (iaaComplete) return 'IAA Signed';

  // Pending signature (delivered but not completed)
  if (account.docusign_iaa_status?.toLowerCase() === 'delivered') {
    return 'Pending Signature';
  }

  // IAA sent
  const iaaStatus = account.status_of_iaa?.toLowerCase() ?? '';
  const docusignIaa = account.docusign_iaa_status?.toLowerCase() ?? '';
  if (
    iaaStatus.includes('sent') ||
    docusignIaa === 'sent' ||
    docusignIaa === 'delivered'
  ) {
    return 'IAA Sent';
  }

  // Ready to send
  if (account.document_readiness === 'Ready to Send Documents') {
    return 'Ready';
  }

  return 'Not Ready';
}

// ── Compute worst-case household status ─────────────────────────────────────

export function computeHouseholdStatus(accounts: TransitionAccount[]): {
  household_status: HouseholdStatus;
  completion_pct: number;
  iaa_complete: number;
  paperwork_complete: number;
  portal_complete: number;
} {
  if (accounts.length === 0) {
    return {
      household_status: 'Not Ready',
      completion_pct: 0,
      iaa_complete: 0,
      paperwork_complete: 0,
      portal_complete: 0,
    };
  }

  let worstStatusIndex = STATUS_ORDER.length - 1; // Start with best
  let totalSteps = 0;
  let completedSteps = 0;
  let iaa_complete = 0;
  let paperwork_complete = 0;
  let portal_complete = 0;

  for (const account of accounts) {
    const status = getAccountStatus(account);
    const statusIndex = STATUS_ORDER.indexOf(status);
    if (statusIndex < worstStatusIndex) {
      worstStatusIndex = statusIndex;
    }

    // Count completion steps per account (3 steps: IAA, Paperwork, Portal)
    totalSteps += 3;

    const isIaaComplete =
      account.status_of_iaa === 'Completed' ||
      account.docusign_iaa_status?.toLowerCase() === 'completed';
    if (isIaaComplete) {
      completedSteps++;
      iaa_complete++;
    }

    const isPaperworkComplete =
      account.status_of_account_paperwork === 'Completed' ||
      account.docusign_paperwork_status?.toLowerCase() === 'completed';
    if (isPaperworkComplete) {
      completedSteps++;
      paperwork_complete++;
    }

    const isPortalComplete =
      account.portal_status === 'Complete' ||
      account.portal_status === 'Active' ||
      account.portal_status === 'Portal Created';
    if (isPortalComplete) {
      completedSteps++;
      portal_complete++;
    }
  }

  const completion_pct =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return {
    household_status: STATUS_ORDER[worstStatusIndex],
    completion_pct,
    iaa_complete,
    paperwork_complete,
    portal_complete,
  };
}

// ── Query DB and group by household ─────────────────────────────────────────

export async function getHouseholdsByAdvisor(
  advisorName?: string,
): Promise<HouseholdGroup[]> {
  let result: Array<TransitionAccount & { advisor_name: string }>;

  if (advisorName) {
    result = await prisma.$queryRaw`
      SELECT
        id,
        advisor_name,
        household_name,
        account_type,
        primary_first_name,
        primary_last_name,
        primary_email,
        status_of_iaa,
        status_of_account_paperwork,
        portal_status,
        document_readiness,
        docusign_iaa_status,
        docusign_paperwork_status,
        fee_schedule
      FROM transition_clients
      WHERE advisor_name = ${advisorName}
      ORDER BY advisor_name ASC, household_name ASC, id ASC
    `;
  } else {
    result = await prisma.$queryRaw`
      SELECT
        id,
        advisor_name,
        household_name,
        account_type,
        primary_first_name,
        primary_last_name,
        primary_email,
        status_of_iaa,
        status_of_account_paperwork,
        portal_status,
        document_readiness,
        docusign_iaa_status,
        docusign_paperwork_status,
        fee_schedule
      FROM transition_clients
      WHERE advisor_name IS NOT NULL
      ORDER BY advisor_name ASC, household_name ASC, id ASC
    `;
  }

  // Group by (advisor_name, household_name)
  const groupKey = (row: { advisor_name: string; household_name: string }) =>
    `${row.advisor_name}|||${row.household_name ?? 'Unknown'}`;

  const groupMap = new Map<
    string,
    { advisor_name: string; household_name: string; accounts: TransitionAccount[] }
  >();

  for (const row of result) {
    const key = groupKey(row);
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        advisor_name: row.advisor_name,
        household_name: row.household_name ?? 'Unknown',
        accounts: [],
      });
    }
    groupMap.get(key)!.accounts.push({
      id: row.id,
      household_name: row.household_name ?? 'Unknown',
      account_type: row.account_type,
      primary_first_name: row.primary_first_name,
      primary_last_name: row.primary_last_name,
      primary_email: row.primary_email,
      status_of_iaa: row.status_of_iaa,
      status_of_account_paperwork: row.status_of_account_paperwork,
      portal_status: row.portal_status,
      document_readiness: row.document_readiness,
      docusign_iaa_status: row.docusign_iaa_status,
      docusign_paperwork_status: row.docusign_paperwork_status,
      fee_schedule: row.fee_schedule,
    });
  }

  const households: HouseholdGroup[] = [];

  for (const [, group] of Array.from(groupMap)) {
    const computed = computeHouseholdStatus(group.accounts);
    households.push({
      household_name: group.household_name,
      advisor_name: group.advisor_name,
      accounts: group.accounts,
      account_count: group.accounts.length,
      ...computed,
    });
  }

  return households;
}
