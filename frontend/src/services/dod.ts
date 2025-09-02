import api from "./api";
import { DoD, DoDCreate, DoDUpdate } from "@/types/dod";

export const createDoD = async (data: DoDCreate): Promise<DoD | null> => {
  try {
    const res = await api.post<{id: number}>("/dod", data, {
      validateStatus: (s) => s === 200 || s === 201 || s === 409,
    });
    if (res.status === 409) return null;
    
    // 생성 후 다시 조회해서 반환
    const dodRes = await api.get<DoD>(`/dod/task/${data.task_id}`);
    return dodRes.data;
  } catch {
    return null;
  }
};

export const getDoDByTask = async (taskId: number): Promise<DoD | null> => {
  try {
    const res = await api.get<DoD>(`/dod/task/${taskId}`, {
      validateStatus: (s) => s === 200 || s === 404,
    });
    return res.status === 200 ? res.data : null;
  } catch {
    return null;
  }
};

export const updateDoD = (id: number, data: DoDUpdate) =>
  api.patch<DoD>(`/dod/${id}`, data).then(r => r.data);

export const deleteDoD = (id: number) =>
  api.delete(`/dod/${id}`).then(r => r.data);