export interface ReviewerSummary {
  reviews_total: number;
  reviews_published: number;
  reviews_pending: number;
  proposals_total: number;
  proposals_open: number;
}

export interface ReviewerActivity {
  type: string;
  title: string;
  created_at: string | null;
  review_id?: number;
  company_id?: number;
}

export interface ReviewerGreenScore { score: number; components: Record<string, number>; version: number; explainable: boolean; }

export interface ReviewerAchievement { code: string; name: string; description: string; unlocked: boolean; }

export interface ReviewerJourney { id: string; title: string; progress: number; steps: Array<{ id: string; completed: boolean }>; next_step?: string; }

export interface ReviewerDashboard {
  summary: ReviewerSummary;
  green_score: ReviewerGreenScore;
  achievements: ReviewerAchievement[];
  journeys: ReviewerJourney[];
  recent_activity: ReviewerActivity[];
  profile: { completion_percent: number; missing_fields: string[] };
  next_best_action: { type: string; label: string; href: string };
}
