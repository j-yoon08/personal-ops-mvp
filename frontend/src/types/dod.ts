export interface DoD {
  id: number;
  task_id: number;
  deliverable_formats: string;
  mandatory_checks: string[];
  quality_bar: string;
  verification: string;
  deadline?: string;
  version_tag: string;
  created_at: string;
}

export interface DoDCreate {
  task_id: number;
  deliverable_formats: string;
  mandatory_checks: string[];
  quality_bar: string;
  verification: string;
  deadline?: string;
  version_tag: string;
}

export interface DoDUpdate {
  deliverable_formats?: string;
  mandatory_checks?: string[];
  quality_bar?: string;
  verification?: string;
  deadline?: string;
  version_tag?: string;
}