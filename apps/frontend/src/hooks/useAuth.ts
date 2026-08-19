import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { User } from '../types';
import { toast } from 'sonner';

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, isError } = useQuery<User | null>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/auth/me');
        return res.data.data;
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await apiClient.post('/auth/login', { email, password });
      return res.data;
    },
    onSuccess: (res) => {
      if (res.success && res.data?.user) {
        queryClient.setQueryData(['currentUser'], res.data.user);
        toast.success(`Welcome back, ${res.data.user.name}!`);
        window.location.href = '/dashboard';
      }
    },
    onError: (err: any) => {
      const responseData = err.response?.data;
      if (responseData && responseData.error === 'EMAIL_NOT_VERIFIED') {
        // Let the component handle verification
        return responseData;
      }
      throw new Error(responseData?.error || 'Invalid email or password');
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      email: string;
      password: string;
    }) => {
      const res = await apiClient.post('/auth/register', payload);
      return res.data;
    },
    onError: (err: any) => {
      throw new Error(err.response?.data?.error || 'Registration failed');
    }
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
      const res = await apiClient.post('/auth/verify-otp', { email, otp });
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data.user);
      toast.success(`Account verified! Welcome, ${data.user.name}!`);
      window.location.href = '/dashboard';
    },
    onError: (err: any) => {
      throw new Error(err.response?.data?.error || 'Invalid OTP verification code');
    }
  });

  const resendOtpMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiClient.post('/auth/resend-otp', { email });
      return res.data;
    },
    onSuccess: (res) => {
      toast.success('Verification code resent successfully!');
      if (res.data?.etherealLink) {
        console.log('Ethereal OTP Link:', res.data.etherealLink);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to resend code');
    }
  });

  const devLoginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/auth/dev-login');
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data.user);
      toast.success('Logged in successfully (Dev Mode)');
      window.location.href = '/dashboard';
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Login failed');
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout');
    },
    onSuccess: () => {
      queryClient.setQueryData(['currentUser'], null);
      queryClient.clear();
      toast.success('Logged out');
      window.location.href = '/login';
    }
  });

  const isPending =
    loginMutation.isPending ||
    registerMutation.isPending ||
    verifyOtpMutation.isPending ||
    resendOtpMutation.isPending ||
    devLoginMutation.isPending;

  return {
    user,
    isLoading,
    isError,
    isAuthenticated: Boolean(user),
    login: (email: string, password: string) =>
      loginMutation.mutateAsync({ email, password }),
    register: (payload: Parameters<typeof registerMutation.mutateAsync>[0]) =>
      registerMutation.mutateAsync(payload),
    verifyOtp: (email: string, otp: string) =>
      verifyOtpMutation.mutateAsync({ email, otp }),
    resendOtp: (email: string) =>
      resendOtpMutation.mutateAsync(email),
    devLogin: devLoginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    isLoggingIn: devLoginMutation.isPending,
    isPending
  };
}
