import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/api';

// Query Keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  kpis: () => [...dashboardKeys.all, 'kpis'] as const,
};

// Queries
export function useKPIs() {
  return useQuery({
    queryKey: dashboardKeys.kpis(),
    queryFn: () => dashboardApi.getKPIs().then(res => res.data),
    refetchInterval: 30000, // 30초마다 자동 갱신
  });
}