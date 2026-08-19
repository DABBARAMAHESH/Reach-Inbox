import { z } from 'zod';

export const createSenderSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').trim(),
  email: z.string().email('Invalid sender email address').trim().toLowerCase(),
  smtpHost: z.string().default('smtp.ethereal.email'),
  smtpPort: z.coerce.number().int().default(587),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional()
});

export const updateSenderSchema = createSenderSchema.partial();

export const recipientSchema = z.object({
  email: z.string().email('Invalid recipient email address').trim().toLowerCase(),
  name: z.string().optional()
});

export const createCampaignSchema = z.object({
  subject: z.string().min(1, 'Subject is required').trim(),
  body: z.string().optional(),
  senderId: z.string().uuid('Valid senderId UUID required'),
  startTime: z.string().datetime().or(z.date()).transform((val) => new Date(val)),
  delayBetweenEmails: z.coerce.number().int().min(0).default(2000),
  hourlyLimit: z.coerce.number().int().min(1).max(10000).default(200),
  recipients: z.array(recipientSchema).min(1, 'At least one recipient is required'),
  attachments: z.array(z.object({
    filename: z.string().min(1),
    content: z.string().min(1), // base64 encoded content
    contentType: z.string().min(1)
  })).optional()
}).refine(data => {
  const hasBody = data.body && data.body.trim().length > 0;
  const hasAttachments = data.attachments && data.attachments.length > 0;
  return hasBody || hasAttachments;
}, {
  message: 'Either email body content or at least one attachment is required',
  path: ['body']
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID parameter')
});
