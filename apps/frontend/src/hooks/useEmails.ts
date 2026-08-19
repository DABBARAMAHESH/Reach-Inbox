import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Email, PaginatedResponse } from '../types';
import { toast } from 'sonner';

export function useEmails(type: 'scheduled' | 'sent' | 'failed', page = 1, limit = 10, search = '') {
  const queryClient = useQueryClient();

  const emailsQuery = useQuery<PaginatedResponse<Email>>({
    queryKey: ['emails', type, page, limit, search],
    queryFn: async () => {
      const res = await apiClient.get(`/emails/${type}`, {
        params: { page, limit, search }
      });
      return res.data;
    },
    refetchInterval: 5000
  });

  const retryEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/emails/${id}/retry`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['queueStats'] });
      toast.success('Email retry scheduled');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Retry failed');
    }
  });

  const cancelEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/emails/${id}/cancel`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Email cancelled');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Cancellation failed');
    }
  });

  return {
    data: emailsQuery.data,
    isLoading: emailsQuery.isLoading,
    retryEmail: retryEmailMutation.mutate,
    isRetrying: retryEmailMutation.isPending,
    cancelEmail: cancelEmailMutation.mutate,
    isCancelling: cancelEmailMutation.isPending
  };
}
