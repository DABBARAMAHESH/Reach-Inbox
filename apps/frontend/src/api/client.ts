import axios from 'axios';
import { toast } from 'sonner';

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.error?.message || error.message || 'An error occurred';

    if (status === 401) {
      // Unauthenticated, clear cached user session if needed
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else if (status === 403) {
      toast.error('Access Denied', { description: message });
    } else if (status === 429) {
      toast.error('Rate Limit Reached', { description: message });
    } else if (status >= 500) {
      toast.error('Server Error', { description: message });
    }

    return Promise.reject(error);
  }
);
