import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { DashboardStats, QueueStats } from '../types';

export function useDashboard() {
  const statsQuery = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/stats');
      return res.data.data;
    },
    refetchInterval: 5000 // Poll stats every 5 seconds for real-time dashboard updates
  });

  const queueQuery = useQuery<QueueStats>({
    queryKey: ['queueStats'],
    queryFn: async () => {
      const res = await apiClient.get('/queue/stats');
      return res.data.data;
    },
    refetchInterval: 5000
  });

  return {
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
    queueStats: queueQuery.data,
    isLoadingQueue: queueQuery.isLoading,
    refetch: () => {
      statsQuery.refetch();
      queueQuery.refetch();
    }
  };
}
