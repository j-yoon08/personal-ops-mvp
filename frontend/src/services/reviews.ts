import api from "./api";
import { Review, ReviewCreate } from "@/types/review";

export const createReview = async (data: ReviewCreate): Promise<Review | null> => {
  try {
    await api.post<{id: number}>("/reviews", data);
    
    // 생성 후 해당 task의 모든 review를 가져와서 방금 생성된 것을 찾아 반환
    const reviewsRes = await api.get<Review[]>(`/reviews/task/${data.task_id}`);
    const latestReview = reviewsRes.data
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    
    return latestReview || null;
  } catch {
    return null;
  }
};

export const getReviewsByTask = async (taskId: number): Promise<Review[]> => {
  try {
    await api.get<Review[]>(`/reviews/task/${taskId}`);
    return res.data;
  } catch {
    return [];
  }
};

export const getAllReviews = async (): Promise<Review[]> => {
  try {
    await api.get<Review[]>("/reviews");
    return res.data;
  } catch {
    return [];
  }
};

export const updateReview = (id: number, data: ReviewCreate) =>
  api.patch<Review>(`/reviews/${id}`, data).then(r => r.data);

export const deleteReview = (id: number) =>
  api.delete(`/reviews/${id}`).then(r => r.data);