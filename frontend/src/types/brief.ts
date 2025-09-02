export interface Brief {
  id: number;
  task_id: number;
  purpose: string;
  success_criteria: string;
  constraints: string;
  priority: string;
  validation: string;
  created_at: string;
}

export type BriefCreate = Omit<Brief, "id" | "created_at">;
export type BriefUpdate = Partial<Omit<BriefCreate, "task_id">>;