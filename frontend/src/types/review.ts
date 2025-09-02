export enum ReviewType {
  PREMORTEM = "PREMORTEM",
  MIDMORTEM = "MIDMORTEM", 
  RETRO = "RETRO"
}

export interface Review {
  id: number;
  task_id: number;
  review_type: ReviewType;
  positives: string;
  negatives: string;
  changes_next: string;
  created_at: string;
}

export interface ReviewCreate {
  task_id: number;
  review_type: ReviewType;
  positives: string;
  negatives: string;
  changes_next: string;
}

export interface ReviewUpdate {
  review_type?: ReviewType;
  positives?: string;
  negatives?: string;
  changes_next?: string;
}