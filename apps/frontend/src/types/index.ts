export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface Sender {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser?: string;
  etherealUser?: string;
  hasPassword?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  userId: string;
  senderId: string;
  subject: string;
  body: string;
  startTime: string;
  delayBetweenEmails: number;
  hourlyLimit: number;
  totalRecipients: number;
  status: 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled' | 'failed';
  sentCount?: number;
  failedCount?: number;
  scheduledCount?: number;
  processingCount?: number;
  cancelledCount?: number;
  sender?: {
    id: string;
    displayName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Email {
  id: string;
  campaignId: string;
  userId: string;
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt?: string;
  status: 'scheduled' | 'processing' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  lastError?: string;
  bullJobId?: string;
  idempotencyKey: string;
  etherealPreviewUrl?: string;
  sender?: {
    id: string;
    displayName: string;
    email: string;
  };
  campaign?: {
    id: string;
    subject: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalEmails: number;
  scheduled: number;
  processing: number;
  sent: number;
  failed: number;
  cancelled: number;
  sentThisHour: number;
  remainingHourlyCapacity: number;
  hourlyLimit: number;
  successRate: number;
}

export interface QueueStats {
  waiting: number;
  delayed: number;
  active: number;
  completed: number;
  failed: number;
  totalJobs: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}
