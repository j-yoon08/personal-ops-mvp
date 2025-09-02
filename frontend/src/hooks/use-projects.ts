import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/services/api';
import type { CreateProjectForm, Project } from '@/types';
import { dashboardKeys } from './use-dashboard';

// Query Keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: string) => [...projectKeys.lists(), { filters }] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: number) => [...projectKeys.details(), id] as const,
};

// Queries
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: () => projectsApi.getAll().then(res => res.data),
  });
}

export function useProject(id: number) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectsApi.getById(id).then(res => res.data),
    enabled: !!id,
  });
}

// Mutations
export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateProjectForm) =>
      projectsApi.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      // KPI 대시보드도 무효화
      queryClient.invalidateQueries({ queryKey: dashboardKeys.kpis() });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Project> }) =>
      projectsApi.update(id, data).then(res => res.data),
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.setQueryData(
        projectKeys.detail(updatedProject.id!), 
        updatedProject
      );
      queryClient.invalidateQueries({ queryKey: dashboardKeys.kpis() });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => projectsApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.kpis() });
    },
  });
}