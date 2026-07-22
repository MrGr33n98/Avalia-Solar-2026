export interface IcpProfile {
  id?: number;
  company_id?: number;
  min_monthly_bill: number;
  max_monthly_bill?: number | null;
  min_system_kwp: number;
  max_system_kwp?: number | null;
  min_ev_chargers_count: number;
  min_ev_vehicles_count?: number | null;
  ev_timeframe?: string | null;
  ev_budget?: string | null;
  ev_active?: boolean;
  strictness_level: 'flexible' | 'balanced' | 'strict';
  auto_reject_out_of_icp: boolean;
  notify_only_high_match: boolean;
  nationwide: boolean;
  target_audiences: string[];
  preferred_roof_types: string[];
  ev_charger_types: string[];
  ev_applications?: string[];
  target_cities: string[];
  target_states: string[];
  target_regions?: string[];
  decision_profiles?: string[];
  motivations?: string[];
  price_sensitivity?: string | null;
  urgency?: string | null;
  min_ticket?: number | null;
  max_ticket?: number | null;
  updated_at?: string;
}

export interface IcpPreviewScore {
  score: number;
  quality: 'Alta' | 'Média' | 'Baixa';
  volume: 'Alto' | 'Médio' | 'Baixo';
  conversion: string;
  active_criteria_count: number;
  total_criteria_count: number;
}
