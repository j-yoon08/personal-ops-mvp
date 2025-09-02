import { useQuery, useQueryClient } from '@tanstack/react-query';
import { searchApi } from '@/services/api';

// Query Keys
export const searchKeys = {
  all: ['search'] as const,
  unified: (query: string, types?: string[], limit?: number) => 
    [...searchKeys.all, 'unified', { query, types, limit }] as const,
  similarProjects: (projectId: number, limit?: number) => 
    [...searchKeys.all, 'similar', projectId, { limit }] as const,
  decisionPatterns: (query: string, limit?: number) => 
    [...searchKeys.all, 'patterns', { query, limit }] as const,
  suggestions: (projectId: number) => 
    [...searchKeys.all, 'suggestions', projectId] as const,
  stats: () => [...searchKeys.all, 'stats'] as const,
};

// Custom hook for unified search with debouncing
export function useUnifiedSearch(
  query: string, 
  types?: string[], 
  limit?: number,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: searchKeys.unified(query, types, limit),
    queryFn: () => searchApi.unified(query, types, limit).then(res => res.data),
    enabled: enabled && query.length >= 2, // 최소 2글자 이상일 때만 검색
    staleTime: 5 * 60 * 1000, // 5분 동안 데이터 유지
  });
}

export function useSimilarProjects(projectId: number, limit?: number, enabled: boolean = true) {
  return useQuery({
    queryKey: searchKeys.similarProjects(projectId, limit),
    queryFn: () => searchApi.similarProjects(projectId, limit).then(res => res.data),
    enabled: enabled && projectId > 0,
    staleTime: 10 * 60 * 1000, // 10분 동안 데이터 유지
  });
}

export function useDecisionPatterns(query: string, limit?: number, enabled: boolean = true) {
  return useQuery({
    queryKey: searchKeys.decisionPatterns(query, limit),
    queryFn: () => searchApi.decisionPatterns(query, limit).then(res => res.data),
    enabled: enabled && query.length >= 3, // 최소 3글자 이상일 때만 검색
    staleTime: 5 * 60 * 1000,
  });
}

export function useProjectSuggestions(projectId: number, enabled: boolean = true) {
  return useQuery({
    queryKey: searchKeys.suggestions(projectId),
    queryFn: () => searchApi.projectSuggestions(projectId).then(res => res.data),
    enabled: enabled && projectId > 0,
    staleTime: 15 * 60 * 1000, // 15분 동안 데이터 유지
  });
}

export function useSearchStats() {
  return useQuery({
    queryKey: searchKeys.stats(),
    queryFn: () => searchApi.stats().then(res => res.data),
    staleTime: 60 * 60 * 1000, // 1시간 동안 데이터 유지
  });
}

// Utility hook to clear search cache
export function useClearSearchCache() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: searchKeys.all });
  };
}