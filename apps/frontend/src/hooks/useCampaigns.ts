import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Campaign, PaginatedResponse } from '../types';
import { toast } from 'sonner';

export function useCampaigns(page = 1, limit = 10, search = '', status = '') {
  const queryClient = useQueryClient();

  const campaignsQuery = useQuery<PaginatedResponse<Campaign>>({
    queryKey: ['campaigns', page, limit, search, status],
    queryFn: async () => {
      const res = await apiClient.get('/campaigns', {
        params: { page, limit, search, status }
      });
      return res.data;
    },
    refetchInterval: 5000
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (payload: {
      subject: string;
      body: string;
      senderId: string;
      startTime: string;
      delayBetweenEmails: number;
      hourlyLimit: number;
      recipients: { email: string; name?: string }[];
      attachments?: { filename: string; content: string; contentType: string }[];
    }) => {
      const res = await apiClient.post('/campaigns', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['queueStats'] });
      toast.success('Campaign scheduled successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to schedule campaign');
    }
  });

  const pauseCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/campaigns/${id}/pause`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign paused');
    }
  });

  const resumeCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/campaigns/${id}/resume`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign resumed');
    }
  });

  const cancelCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/campaigns/${id}/cancel`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['scheduledEmails'] });
      toast.success('Campaign cancelled');
    }
  });

  return {
    data: campaignsQuery.data,
    isLoading: campaignsQuery.isLoading,
    createCampaign: createCampaignMutation.mutateAsync,
    isCreating: createCampaignMutation.isPending,
    pauseCampaign: pauseCampaignMutation.mutate,
    resumeCampaign: resumeCampaignMutation.mutate,
    cancelCampaign: cancelCampaignMutation.mutate
  };
}
