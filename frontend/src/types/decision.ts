export interface DecisionLog {
  id: number;
  task_id: number;
  date: string;
  problem: string;
  options: string;
  decision_reason: string;
  assumptions_risks: string;
  d_plus_7_review?: string;
  created_at: string;
}

export interface DecisionLogCreate {
  task_id: number;
  date: string;
  problem: string;
  options: string;
  decision_reason: string;
  assumptions_risks: string;
}

export interface DecisionLogUpdate {
  date?: string;
  problem?: string;
  options?: string;
  decision_reason?: string;
  assumptions_risks?: string;
}

export interface DecisionLogReviewUpdate {
  d_plus_7_review: string;
}