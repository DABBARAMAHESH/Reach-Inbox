import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Sender } from '../types';
import { toast } from 'sonner';

export function useSenders() {
  const queryClient = useQueryClient();

  const sendersQuery = useQuery<Sender[]>({
    queryKey: ['senders'],
    queryFn: async () => {
      const res = await apiClient.get('/senders');
      return res.data.data;
    }
  });

  const createSenderMutation = useMutation({
    mutationFn: async (payload: {
      displayName: string;
      email: string;
      smtpHost?: string;
      smtpPort?: number;
      smtpUser?: string;
      smtpPassword?: string;
    }) => {
      const res = await apiClient.post('/senders', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['senders'] });
      toast.success('Sender added successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to add sender');
    }
  });

  const updateSenderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Sender> }) => {
      const res = await apiClient.put(`/senders/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['senders'] });
      toast.success('Sender updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to update sender');
    }
  });

  const deleteSenderMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/senders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['senders'] });
      toast.success('Sender deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to delete sender');
    }
  });

  const testSenderMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/senders/${id}/test`);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('SMTP Connection Verified!', {
        description: 'Server responded successfully to handshake test.'
      });
    },
    onError: (err: any) => {
      toast.error('SMTP Connection Test Failed', {
        description: err.response?.data?.error?.message || 'Verification error'
      });
    }
  });

  return {
    senders: sendersQuery.data || [],
    isLoading: sendersQuery.isLoading,
    createSender: createSenderMutation.mutate,
    isCreating: createSenderMutation.isPending,
    updateSender: updateSenderMutation.mutate,
    deleteSender: deleteSenderMutation.mutate,
    testSender: testSenderMutation.mutate,
    isTesting: testSenderMutation.isPending
  };
}
