import api from "./api";
import { DecisionLog, DecisionLogCreate, DecisionLogReviewUpdate } from "@/types/decision";

export const createDecision = async (data: DecisionLogCreate): Promise<DecisionLog | null> => {
  try {
    await api.post<{id: number}>("/decisions", data);
    
    // 생성 후 해당 task의 모든 decision을 가져와서 방금 생성된 것을 찾아 반환
    const decisionsRes = await api.get<DecisionLog[]>(`/decisions/task/${data.task_id}`);
    const latestDecision = decisionsRes.data
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    
    return latestDecision || null;
  } catch {
    return null;
  }
};

export const getDecisionsByTask = async (taskId: number): Promise<DecisionLog[]> => {
  try {
    await api.get<DecisionLog[]>(`/decisions/task/${taskId}`);
    return res.data;
  } catch {
    return [];
  }
};

export const getAllDecisions = async (): Promise<DecisionLog[]> => {
  try {
    await api.get<DecisionLog[]>("/decisions");
    return res.data;
  } catch {
    return [];
  }
};

export const updateDecisionD7Review = (id: number, data: DecisionLogReviewUpdate) =>
  api.patch<DecisionLog>(`/decisions/${id}/dplus7`, data).then(r => r.data);

export const deleteDecision = (id: number) =>
  api.delete(`/decisions/${id}`).then(r => r.data);