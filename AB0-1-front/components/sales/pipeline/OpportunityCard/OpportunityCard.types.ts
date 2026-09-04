export interface PipelineCardTag {
  id: number;
  name: string;
  color?: string;
}

export interface PipelineCardAccount {
  id: number;
  name: string;
}

export interface PipelineCardContact {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface PipelineCardOwner {
  id: number;
  name: string;
  email?: string;
  avatar_url?: string;
}

export interface PipelineCardStage {
  id: number;
  key: string;
  name: string;
  position: number;
  probability: number;
}

export interface PipelineCardQualification {
  score: number;
  bant_summary?: string;
  spin_summary?: string;
}

export interface PipelineCardLastActivity {
  id: number;
  type: string;
  description: string;
  occurred_at: string;
}

export interface PipelineCardNextAction {
  id: number;
  type: string;
  title: string;
  due_at?: string;
  overdue: boolean;
}

export interface PipelineCardAging {
  days_in_stage: number;
  stage_entered_at: string;
  stale: boolean;
}

export interface PipelineCardFlags {
  overdue: boolean;
  due_today: boolean;
  stale: boolean;
  hot: boolean;
  no_contact: boolean;
  no_owner: boolean;
}

export interface PipelineCardDTO {
  id: number;
  name: string;
  status: string;
  account?: PipelineCardAccount | null;
  primary_contact?: PipelineCardContact | null;
  owner?: PipelineCardOwner | null;
  stage?: PipelineCardStage | null;
  value_cents: number;
  currency: string;
  probability: number;
  weighted_value_cents: number;
  priority: string;
  temperature: 'cold' | 'warm' | 'hot' | string;
  source?: string | null;
  qualification?: PipelineCardQualification | null;
  last_activity?: PipelineCardLastActivity | null;
  next_action?: PipelineCardNextAction | null;
  aging: PipelineCardAging;
  flags: PipelineCardFlags;
  tags: PipelineCardTag[];
}

export interface PipelineStageDTO {
  id: number;
  key: string;
  name: string;
  position: number;
  probability: number;
  total_cards: number;
  total_value_cents: number;
}

export interface PipelineBoardDTO {
  pipeline: {
    id: number;
    name: string;
    key: string;
  };
  stages: PipelineStageDTO[];
  cards: PipelineCardDTO[];
  totals: {
    total_cards: number;
    total_value_cents: number;
    total_weighted_value_cents: number;
  };
}
