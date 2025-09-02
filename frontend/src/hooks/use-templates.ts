import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templatesApi } from '@/services/api';
import { TemplateCategory, TemplateType, ApiError } from '@/types';
import { toast } from 'sonner';

// Query Keys
export const templateKeys = {
  all: ['templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: (category?: TemplateCategory, templateType?: TemplateType, includeSystem?: boolean, includeAI?: boolean, limit?: number) => 
    [...templateKeys.lists(), { category, templateType, includeSystem, includeAI, limit }] as const,
  detail: (id: number) => [...templateKeys.all, 'detail', id] as const,
  recommended: (keywords: string, limit?: number) => 
    [...templateKeys.all, 'recommended', { keywords, limit }] as const,
  categories: () => [...templateKeys.all, 'categories'] as const,
  bestPractices: (category?: TemplateCategory, limit?: number) => 
    [...templateKeys.all, 'bestPractices', { category, limit }] as const,
  stats: () => [...templateKeys.all, 'stats'] as const,
};

// Queries
export function useTemplates(
  category?: TemplateCategory, 
  templateType?: TemplateType,
  includeSystem?: boolean,
  includeAI?: boolean,
  limit?: number
) {
  return useQuery({
    queryKey: templateKeys.list(category, templateType, includeSystem, includeAI, limit),
    queryFn: () => templatesApi.getAll(category, templateType, includeSystem, includeAI, limit).then(res => res.data),
    staleTime: 10 * 60 * 1000, // 10분 동안 데이터 유지
  });
}

export function useTemplate(id: number, enabled: boolean = true) {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: () => templatesApi.getById(id).then(res => res.data),
    enabled: enabled && id > 0,
    staleTime: 15 * 60 * 1000, // 15분 동안 데이터 유지
  });
}

export function useRecommendedTemplates(keywords: string, limit?: number, enabled: boolean = true) {
  return useQuery({
    queryKey: templateKeys.recommended(keywords, limit),
    queryFn: () => templatesApi.getRecommended(keywords, limit).then(res => res.data),
    enabled: enabled && keywords.length >= 2,
    staleTime: 5 * 60 * 1000, // 5분 동안 데이터 유지
  });
}

export function useTemplateCategories() {
  return useQuery({
    queryKey: templateKeys.categories(),
    queryFn: () => templatesApi.getCategories().then(res => res.data),
    staleTime: 60 * 60 * 1000, // 1시간 동안 데이터 유지
  });
}

export function useBestPractices(category?: TemplateCategory, limit?: number) {
  return useQuery({
    queryKey: templateKeys.bestPractices(category, limit),
    queryFn: () => templatesApi.getBestPractices(category, limit).then(res => res.data),
    staleTime: 30 * 60 * 1000, // 30분 동안 데이터 유지
  });
}

export function useTemplateStats() {
  return useQuery({
    queryKey: templateKeys.stats(),
    queryFn: () => templatesApi.getStats().then(res => res.data),
    staleTime: 15 * 60 * 1000, // 15분 동안 데이터 유지
  });
}

// Mutations
export function useGenerateTemplateFromProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: number) => templatesApi.generateFromProject(projectId).then(res => res.data),
    onSuccess: (data) => {
      // 템플릿 관련 쿼리들 무효화
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
      toast.success(data.message);
    },
    onError: (error: unknown) => {
      const errorMessage = ((error as ApiError)?.response?.data?.detail) || '템플릿 생성에 실패했습니다';
      toast.error(errorMessage);
    },
  });
}

export function useRecordTemplateUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, usageData }: { templateId: number; usageData: {used_for: string; was_helpful?: boolean; feedback_notes?: string} }) => 
      templatesApi.recordUsage(templateId, usageData).then(res => res.data),
    onSuccess: () => {
      // 템플릿 사용 통계 업데이트를 위해 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: templateKeys.stats() });
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
    },
    onError: (error: unknown) => {
      console.error('Template usage recording failed:', error);
    },
  });
}

export function useInitSystemTemplates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => templatesApi.initSystemTemplates().then(res => res.data),
    onSuccess: (data) => {
      // 모든 템플릿 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
      toast.success(data.message);
    },
    onError: (error: unknown) => {
      const errorMessage = ((error as ApiError)?.response?.data?.detail) || '시스템 템플릿 초기화에 실패했습니다';
      toast.error(errorMessage);
    },
  });
}

// Utility hooks
export function useClearTemplateCache() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: templateKeys.all });
  };
}