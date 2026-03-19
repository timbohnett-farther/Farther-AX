// ══════════════════════════════════════════════════════════════════════════════
// TRANSITION COMPLEXITY SCORING SYSTEM
// ══════════════════════════════════════════════════════════════════════════════
// Scores range 0–105. Computed from deal properties, team data, and notes.
// Recalculate on stage change, property update, or note addition.
//
// Tiers:
//   0–25  → Low        (Green)   — Standard transition, minimal complexity
//  26–50  → Moderate   (Amber)   — Some complexities, plan accordingly
//  51–75  → High       (Red)     — Significant complexity, senior staffing recommended
//  76–100 → Critical   (Purple)  — Maximum complexity, dedicated team + extended timeline
// ══════════════════════════════════════════════════════════════════════════════

export interface ScoreFactor {
  category: string;
  factor: string;
  points: number;
  maxPoints: number;
  detail: string;
}

export interface ComplexityResult {
  score: number;
  tier: 'Low' | 'Moderate' | 'High' | 'Critical';
  tierColor: string;
  factors: ScoreFactor[];
  staffingRec: string;
  estimatedDays: number; // Recommended graduation timeline
}

// Helper: parse a numeric value from HubSpot string fields
function num(val: string | null | undefined): number {
  if (!val) return 0;
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

// Helper: check if text contains complexity keywords
function hasComplexitySignals(text: string): string[] {
  const lower = text.toLowerCase();
  const signals: string[] = [];
  const keywords: [string, string][] = [
    ['complex', 'Complexity mentioned'],
    ['complicated', 'Complicated scenario noted'],
    ['high-touch', 'High-touch client'],
    ['high touch', 'High-touch client'],
    ['vip', 'VIP client'],
    ['sensitive', 'Sensitive situation'],
    ['litigation', 'Litigation involvement'],
    ['divorce', 'Divorce-related transition'],
    ['estate', 'Estate planning complexity'],
    ['trust', 'Trust account involvement'],
    ['multiple custodian', 'Multiple custodians'],
    ['multi-custodian', 'Multiple custodians'],
    ['held away', 'Held-away assets'],
    ['held-away', 'Held-away assets'],
    ['outside business', 'Outside business activities'],
    ['non-compete', 'Non-compete clause'],
    ['restrictive covenant', 'Restrictive covenants'],
    ['protocol', 'Protocol considerations'],
    ['non-protocol', 'Non-protocol firm'],
    ['manual', 'Manual processing required'],
    ['custom', 'Custom requirements'],
    ['529', '529 plan assets'],
    ['alternative', 'Alternative investments'],
    ['annuit', 'Annuity assets'],
    ['insurance', 'Insurance products'],
    ['illiquid', 'Illiquid assets'],
    ['option', 'Options/derivatives'],
    ['private placement', 'Private placements'],
    ['reit', 'REIT holdings'],
    ['limited partner', 'Limited partnerships'],
  ];
  for (const [kw, label] of keywords) {
    if (lower.includes(kw) && !signals.includes(label)) {
      signals.push(label);
    }
  }
  return signals;
}

export function computeComplexityScore(
  deal: Record<string, string | null | undefined>,
  team: Record<string, string | null | undefined> | null,
  notes: Array<{ properties?: Record<string, string | null> }>,
): ComplexityResult {
  const factors: ScoreFactor[] = [];

  // ════════════════════════════════════════════════════════════════════════════
  // 1. TRANSITION TYPE (0–15 points)
  // ════════════════════════════════════════════════════════════════════════════
  const transType = (deal.transition_type ?? team?.transition_type ?? '').toLowerCase();
  let transPoints = 0;
  let transDetail = 'Not set';

  if (transType.includes('lpoa')) {
    transPoints = 5; transDetail = 'LPOA — Limited power of attorney, straightforward';
  } else if (transType.includes('acat')) {
    transPoints = 10; transDetail = 'ACAT — Automated transfer, moderate complexity';
  } else if (transType.includes('master') || transType.includes('merge')) {
    transPoints = 15; transDetail = 'Master Merge — Full custodian merger, highest complexity';
  } else if (transType.includes('repaper')) {
    transPoints = 12; transDetail = 'Repaper — Account re-documentation required';
  } else if (transType) {
    transPoints = 8; transDetail = `${deal.transition_type} — Non-standard type`;
  }

  factors.push({ category: 'Transition', factor: 'Transition Type', points: transPoints, maxPoints: 15, detail: transDetail });

  // ════════════════════════════════════════════════════════════════════════════
  // 2. AUM SIZE (0–20 points)
  // ════════════════════════════════════════════════════════════════════════════
  const aum = num(deal.transferable_aum) || num(team?.transferable_aum) || num(deal.aum);
  let aumPoints = 0;
  let aumDetail = 'No AUM data';

  if (aum > 0) {
    if (aum >= 250_000_000) { aumPoints = 20; aumDetail = `$${(aum/1e6).toFixed(0)}M — Very large book, dedicated resources needed`; }
    else if (aum >= 100_000_000) { aumPoints = 15; aumDetail = `$${(aum/1e6).toFixed(0)}M — Large book, senior staff recommended`; }
    else if (aum >= 50_000_000) { aumPoints = 10; aumDetail = `$${(aum/1e6).toFixed(0)}M — Mid-size book`; }
    else if (aum >= 10_000_000) { aumPoints = 5; aumDetail = `$${(aum/1e6).toFixed(0)}M — Standard size`; }
    else { aumPoints = 2; aumDetail = `$${(aum/1e6).toFixed(1)}M — Smaller book`; }
  }

  factors.push({ category: 'Scale', factor: 'Transferable AUM', points: aumPoints, maxPoints: 20, detail: aumDetail });

  // ════════════════════════════════════════════════════════════════════════════
  // 3. HOUSEHOLD COUNT (0–15 points)
  // ════════════════════════════════════════════════════════════════════════════
  const households = num(deal.client_households) || num(deal.transferable_households) || num(team?.client_households);
  let hhPoints = 0;
  let hhDetail = 'No household data';

  if (households > 0) {
    if (households >= 150) { hhPoints = 15; hhDetail = `${households} households — Very high volume, extended timeline likely`; }
    else if (households >= 75) { hhPoints = 10; hhDetail = `${households} households — High volume`; }
    else if (households >= 25) { hhPoints = 5; hhDetail = `${households} households — Moderate volume`; }
    else { hhPoints = 2; hhDetail = `${households} households — Low volume`; }
  }

  factors.push({ category: 'Scale', factor: 'Households', points: hhPoints, maxPoints: 15, detail: hhDetail });

  // ════════════════════════════════════════════════════════════════════════════
  // 4. COMPLEX ASSET TYPES (0–20 points, additive)
  // ════════════════════════════════════════════════════════════════════════════
  let assetPoints = 0;
  const assetDetails: string[] = [];

  const n401k = num(deal.n401k_aum) || num(team?.n401k_aum) || num(team?.transferable_401k_aum);
  if (n401k > 0) {
    assetPoints += 5;
    assetDetails.push(`401(k): $${(n401k/1e6).toFixed(1)}M — Requires plan-level coordination`);
  }

  const insurance = num(deal.insurance_annuity_revenue) || num(team?.insurance_annuity_revenue);
  if (insurance > 0) {
    assetPoints += 5;
    assetDetails.push(`Insurance/Annuities: $${(insurance/1e3).toFixed(0)}K rev — Carrier transfers, surrender schedules`);
  }

  const brokerDealer = num(deal.broker_dealer_revenue) || num(team?.broker_dealer_revenue);
  if (brokerDealer > 0) {
    assetPoints += 5;
    assetDetails.push(`Broker-Dealer: $${(brokerDealer/1e3).toFixed(0)}K rev — BD licensing and transfer complexities`);
  }

  const altAssets = team?.alternative_assets__ ?? '';
  const investProducts = team?.investment_products ?? '';
  if (altAssets || (investProducts && investProducts.toLowerCase().includes('alternative'))) {
    assetPoints += 5;
    assetDetails.push('Alternative assets — Illiquid holdings, special transfer procedures');
  }

  // Cap at 20
  assetPoints = Math.min(assetPoints, 20);

  factors.push({
    category: 'Assets',
    factor: 'Complex Asset Types',
    points: assetPoints,
    maxPoints: 20,
    detail: assetDetails.length > 0 ? assetDetails.join('; ') : 'No complex asset types detected',
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 5. FIRM TYPE & DEPARTURE COMPLEXITY (0–10 points)
  // ════════════════════════════════════════════════════════════════════════════
  const firmType = (deal.firm_type ?? team?.firm_type ?? '').toLowerCase();
  let firmPoints = 0;
  let firmDetail = 'Not set';

  if (firmType.includes('wirehouse')) {
    firmPoints = 10; firmDetail = 'Wirehouse — Non-compete risk, protocol considerations, longest timeline';
  } else if (firmType.includes('ibd') || firmType.includes('independent broker')) {
    firmPoints = 7; firmDetail = 'IBD — BD transfer complexities, licensing transitions';
  } else if (firmType.includes('ria') && firmType.includes('owner')) {
    firmPoints = 5; firmDetail = 'RIA Owner — Business dissolution/sale complexity';
  } else if (firmType.includes('ria') && firmType.includes('employee')) {
    firmPoints = 3; firmDetail = 'RIA Employee — Generally straightforward departure';
  } else if (firmType) {
    firmPoints = 5; firmDetail = `${deal.firm_type} — Evaluated as moderate`;
  }

  // Restrictive covenants add extra points
  const covenants = team?.restrictive_covenants ?? '';
  if (covenants && covenants.toLowerCase() !== 'none' && covenants.toLowerCase() !== 'no') {
    firmPoints = Math.min(firmPoints + 3, 10);
    firmDetail += ` + Restrictive covenants: ${covenants}`;
  }

  factors.push({ category: 'Firm', factor: 'Firm Type & Covenants', points: firmPoints, maxPoints: 10, detail: firmDetail });

  // ════════════════════════════════════════════════════════════════════════════
  // 6. TEAM COMPLEXITY (0–10 points)
  // ════════════════════════════════════════════════════════════════════════════
  const people = num(team?.people) || num(deal.people);
  const partners = num(team?.total_number_of_owners_or_partners);
  const supportStaff = num(team?.support_staff);
  const totalTeam = people + supportStaff;
  let teamPoints = 0;
  let teamDetail = 'Solo advisor';

  if (partners >= 3 || totalTeam >= 6) {
    teamPoints = 10; teamDetail = `${partners} partners, ${totalTeam} total — Large multi-advisor team`;
  } else if (partners >= 2 || totalTeam >= 3) {
    teamPoints = 7; teamDetail = `${partners} partners, ${totalTeam} total — Multi-advisor team`;
  } else if (totalTeam >= 2) {
    teamPoints = 3; teamDetail = `${totalTeam} team members — Small team`;
  }

  // OBAs add complexity
  const obas = team?.obas__yes_no ?? '';
  if (obas.toLowerCase() === 'yes' || obas.toLowerCase() === 'true') {
    teamPoints = Math.min(teamPoints + 3, 10);
    const obaDetail = team?.outside_business_activities ? `: ${team.outside_business_activities}` : '';
    teamDetail += ` + OBAs${obaDetail}`;
  }

  factors.push({ category: 'Team', factor: 'Team Size & OBAs', points: teamPoints, maxPoints: 10, detail: teamDetail });

  // ════════════════════════════════════════════════════════════════════════════
  // 7. TECH STACK COMPLEXITY (0–5 points)
  // ════════════════════════════════════════════════════════════════════════════
  let techPoints = 0;
  const techPlatforms: string[] = [];

  const crm = deal.crm_platform__cloned_ ?? team?.crm_platform ?? '';
  const fp = deal.financial_planning_platform__cloned_ ?? team?.financial_planning_platform ?? '';
  const perf = deal.performance_platform__cloned_ ?? team?.performance_platform ?? '';
  const other = deal.technology_platforms_being_used__cloned_ ?? team?.technology_platforms_being_used ?? '';
  const tamp = team?.tamp ?? '';

  if (crm) techPlatforms.push(`CRM: ${crm}`);
  if (fp) techPlatforms.push(`FP: ${fp}`);
  if (perf) techPlatforms.push(`Perf: ${perf}`);
  if (tamp) techPlatforms.push(`TAMP: ${tamp}`);
  if (other) techPlatforms.push(`Other: ${other}`);

  if (techPlatforms.length >= 4) { techPoints = 5; }
  else if (techPlatforms.length >= 2) { techPoints = 3; }
  else if (techPlatforms.length >= 1) { techPoints = 1; }

  factors.push({
    category: 'Tech',
    factor: 'Tech Stack',
    points: techPoints,
    maxPoints: 5,
    detail: techPlatforms.length > 0 ? techPlatforms.join(', ') : 'No tech platforms listed',
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 8. DEAL VELOCITY — Time in Pipeline (0–5 points)
  // Longer deals signal hesitation, complexity, or advisor anxiety
  // ════════════════════════════════════════════════════════════════════════════
  const createDate = deal.createdate ? new Date(deal.createdate) : null;
  let velocityPoints = 0;
  let velocityDetail = 'No create date';

  if (createDate) {
    const daysInPipeline = Math.floor((Date.now() - createDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysInPipeline >= 365) {
      velocityPoints = 5; velocityDetail = `${daysInPipeline} days in pipeline — Very long cycle, possible advisor hesitation or deep complexity`;
    } else if (daysInPipeline >= 180) {
      velocityPoints = 3; velocityDetail = `${daysInPipeline} days — Extended timeline, may need extra attention/reassurance`;
    } else if (daysInPipeline >= 90) {
      velocityPoints = 1; velocityDetail = `${daysInPipeline} days — Moderate timeline`;
    } else {
      velocityPoints = 0; velocityDetail = `${daysInPipeline} days — Moving at healthy pace`;
    }
  }

  factors.push({ category: 'Velocity', factor: 'Time in Pipeline', points: velocityPoints, maxPoints: 5, detail: velocityDetail });

  // ════════════════════════════════════════════════════════════════════════════
  // 9. NOTES & QUALITATIVE SIGNALS (0–5 points)
  // ════════════════════════════════════════════════════════════════════════════
  const allNoteText = notes
    .map(n => n.properties?.hs_note_body ?? '')
    .join(' ')
    .replace(/<[^>]*>/g, ' '); // strip HTML

  const transNotes = deal.transition_notes ?? '';
  const priorTransNotes = deal.prior_transitions_notes ?? '';
  const description = deal.description ?? '';

  const combinedText = [allNoteText, transNotes, priorTransNotes, description].join(' ');
  const signals = hasComplexitySignals(combinedText);

  let notePoints = 0;
  if (signals.length >= 4) notePoints = 5;
  else if (signals.length >= 2) notePoints = 3;
  else if (signals.length >= 1) notePoints = 1;

  // Prior transitions add complexity awareness
  const priorTransitions = deal.prior_transitions ?? '';
  if (priorTransitions && priorTransitions !== '0' && priorTransitions.toLowerCase() !== 'no') {
    notePoints = Math.min(notePoints + 2, 5);
    signals.push(`Prior transitions: ${priorTransitions}`);
  }

  factors.push({
    category: 'Qualitative',
    factor: 'Notes & Signals',
    points: notePoints,
    maxPoints: 5,
    detail: signals.length > 0 ? signals.join(', ') : 'No complexity signals detected in notes',
  });

  // ════════════════════════════════════════════════════════════════════════════
  // TOTAL SCORE & TIER
  // ════════════════════════════════════════════════════════════════════════════
  const score = factors.reduce((sum, f) => sum + f.points, 0);

  let tier: ComplexityResult['tier'];
  let tierColor: string;
  let staffingRec: string;
  let estimatedDays: number;

  if (score >= 76) {
    tier = 'Critical';
    tierColor = '#8e44ad'; // purple
    staffingRec = 'Dedicated senior AXM + AXA pair, CTM lead, extended weekly check-ins. Consider dual-CTM for asset transfer.';
    estimatedDays = 75;
  } else if (score >= 51) {
    tier = 'High';
    tierColor = '#c0392b'; // red
    staffingRec = 'Senior AXM recommended, dedicated CTM, bi-weekly progress reviews. Flag for leadership visibility.';
    estimatedDays = 60;
  } else if (score >= 26) {
    tier = 'Moderate';
    tierColor = '#b27d2e'; // amber
    staffingRec = 'Standard AXM assignment, CTM support. Monitor for escalation triggers.';
    estimatedDays = 45;
  } else {
    tier = 'Low';
    tierColor = '#27ae60'; // green
    staffingRec = 'Any available AXM. Standard process, standard timeline.';
    estimatedDays = 45;
  }

  return { score, tier, tierColor, factors, staffingRec, estimatedDays };
}
