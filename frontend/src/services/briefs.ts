import api from "./api";
import { Brief, BriefCreate, BriefUpdate } from "@/types/brief";

// 409(이미 존재)도 정상 흐름으로 취급하도록 처리
export const createBrief = async (data: BriefCreate): Promise<Brief | null> => {
  try {
    const res = await api.post<Brief>("/briefs", data, {
      // 200/201: 생성 성공, 409: 이미 존재 (예외 던지지 않음)
      validateStatus: (s) => s === 200 || s === 201 || s === 409,
    });
    // 409면 UI에서 안내만 하고 null 반환
    return res.status === 409 ? null : res.data;
  } catch {
    // 네트워크/타임아웃 등은 조용히 null
    return null;
  }
};

export const getBriefByTask = async (taskId: number): Promise<Brief | null> => {
  try {
    const res = await api.get<Brief>(`/briefs/task/${taskId}`, {
      // 200: 존재, 404: 없음 — 둘 다 예외 던지지 않음
      validateStatus: (s) => s === 200 || s === 404,
    });
    return res.status === 200 ? res.data : null; // 404면 null
  } catch {
    // 네트워크/타임아웃 등만 조용히 null
    return null;
  }
};

export const updateBrief = (id: number, data: BriefUpdate) =>
  api.patch<Brief>(`/briefs/${id}`, data).then(r => r.data);

export const deleteBrief = (id: number) =>
  api.delete(`/briefs/${id}`).then(r => r.data);