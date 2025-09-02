import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/services/api';
import { NotificationStatus, NotificationSettings, ApiError } from '@/types';
import { toast } from 'sonner';

// Query Keys
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (status?: NotificationStatus, limit?: number) => 
    [...notificationKeys.lists(), { status, limit }] as const,
  pending: () => [...notificationKeys.all, 'pending'] as const,
  settings: () => [...notificationKeys.all, 'settings'] as const,
  stats: () => [...notificationKeys.all, 'stats'] as const,
};

// Queries
export function useNotifications(status?: NotificationStatus, limit?: number) {
  return useQuery({
    queryKey: notificationKeys.list(status, limit),
    queryFn: () => notificationsApi.getAll(status, limit).then(res => res.data),
    refetchInterval: 30000, // 30초마다 자동 갱신
  });
}

export function usePendingNotifications() {
  return useQuery({
    queryKey: notificationKeys.pending(),
    queryFn: () => notificationsApi.getPending().then(res => res.data),
    refetchInterval: 15000, // 15초마다 자동 갱신
  });
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: notificationKeys.settings(),
    queryFn: () => notificationsApi.getSettings().then(res => res.data),
  });
}

export function useNotificationStats() {
  return useQuery({
    queryKey: notificationKeys.stats(),
    queryFn: () => notificationsApi.getStats().then(res => res.data),
    refetchInterval: 60000, // 1분마다 자동 갱신
  });
}

// Mutations
export function useGenerateNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.generate().then(res => res.data),
    onSuccess: (data) => {
      // 모든 알림 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success(data.message);
    },
    onError: (error: unknown) => {
      const errorMessage = ((error as ApiError)?.response?.data?.detail) || '알림 생성에 실패했습니다';
      toast.error(errorMessage);
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id).then(res => res.data),
    onSuccess: () => {
      // 알림 관련 쿼리들 무효화
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error: unknown) => {
      const errorMessage = ((error as ApiError)?.response?.data?.detail) || '알림 처리에 실패했습니다';
      toast.error(errorMessage);
    },
  });
}

export function useDismissNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationsApi.dismiss(id).then(res => res.data),
    onSuccess: () => {
      // 알림 관련 쿼리들 무효화
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error: unknown) => {
      const errorMessage = ((error as ApiError)?.response?.data?.detail) || '알림 해제에 실패했습니다';
      toast.error(errorMessage);
    },
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<NotificationSettings>) => notificationsApi.updateSettings(settings).then(res => res.data),
    onSuccess: (data) => {
      // 설정 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: notificationKeys.settings() });
      toast.success(data.message);
    },
    onError: (error: unknown) => {
      const errorMessage = ((error as ApiError)?.response?.data?.detail) || '설정 업데이트에 실패했습니다';
      toast.error(errorMessage);
    },
  });
}