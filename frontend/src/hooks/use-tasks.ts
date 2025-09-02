import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/services/api';
import type { CreateTaskForm, Task, UpdateTaskStateForm } from '@/types';
import { projectKeys } from './use-projects';
import { dashboardKeys } from './use-dashboard';

// Query Keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: string) => [...taskKeys.lists(), { filters }] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: number) => [...taskKeys.details(), id] as const,
};

// Queries
export function useTasks() {
  return useQuery({
    queryKey: taskKeys.lists(),
    queryFn: () => tasksApi.getAll().then(res => res.data),
  });
}

export function useTask(id: number) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => tasksApi.getById(id).then(res => res.data),
    enabled: !!id,
  });
}

// Mutations
export function useCreateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateTaskForm) =>
      tasksApi.create(data).then(res => res.data),
    onSuccess: () => {
      // 작업 목록 무효화
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      // 프로젝트 목록도 무효화 (작업 수 업데이트)
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      // KPI 대시보드도 무효화
      queryClient.invalidateQueries({ queryKey: dashboardKeys.kpis() });
    },
  });
}

export function useUpdateTaskState() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTaskStateForm }) =>
      tasksApi.updateState(id, data).then(res => res.data),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.setQueryData(
        taskKeys.detail(updatedTask.id!), 
        updatedTask
      );
      // KPI 대시보드 무효화 (상태 변경이 KPI에 영향)
      queryClient.invalidateQueries({ queryKey: dashboardKeys.kpis() });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Task> }) =>
      tasksApi.update(id, data).then(res => res.data),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.setQueryData(
        taskKeys.detail(updatedTask.id!), 
        updatedTask
      );
      // KPI 대시보드 무효화
      queryClient.invalidateQueries({ queryKey: dashboardKeys.kpis() });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => tasksApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.removeQueries({ queryKey: taskKeys.detail(id) });
      // 프로젝트 목록과 KPI 무효화
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.kpis() });
    },
  });
}