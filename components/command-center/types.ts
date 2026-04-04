export interface Deal {
  id: string;
  dealname: string;
  transferable_aum: string | null;
  current_value: string | null;
  t12_revenue: string | null;
  fee_based_revenue: string | null;
  dealstage: string;
  current_firm__cloned_: string | null;
  custodian__cloned_: string | null;
  transition_type: string | null;
  firm_type: string | null;
  onboarder: string | null;
  transition_owner: string | null;
  desired_start_date: string | null;
  actual_launch_date: string | null;
  client_households: string | null;
  ownerName: string | null;
  daysSinceLaunch: number | null;
}

export interface AcquisitionsDeal extends Deal {
  stageLabel: string;
  stageOrder: number;
  isTerminal?: boolean;
}

export interface AcquisitionsStage {
  id: string;
  label: string;
  count: number;
  isTerminal: boolean;
}

export interface ComplexityScore {
  score: number;
  tier: string;
  tierColor: string;
}

export interface SentimentScore {
  score: number;
  tier: string;
  color: string;
}

export interface TeamAssignment {
  [role: string]: string;
}

export interface GraduationEntry {
  deal_id: string;
  graduated_at: string;
  graduated_by: string | null;
}

export interface GraduationsResponse {
  dealIds: string[];
  graduations: GraduationEntry[];
}
