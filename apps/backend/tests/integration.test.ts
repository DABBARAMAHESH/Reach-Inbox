import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { UserRepository } from '../src/repositories/UserRepository';
import { SenderRepository } from '../src/repositories/SenderRepository';

describe('Integration Tests: API Endpoints', () => {
  it('GET /health should return 200 OK with service info', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('reachinbox-backend');
  });

  it('GET /api/auth/me without authentication should return 401 Unauthorized', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/auth/dev-login should log in dev test user and set HTTP-only cookie', async () => {
    vi.spyOn(UserRepository, 'upsertGoogleUser').mockResolvedValue({
      id: 'mock-dev-user-id',
      googleId: 'dev-google-id-12345',
      email: 'demo.user@reachinbox.test',
      name: 'Demo Engineer',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    vi.spyOn(SenderRepository, 'findByUserId').mockResolvedValue([
      {
        id: 'mock-sender-id',
        userId: 'mock-dev-user-id',
        email: 'sender@ethereal.email',
        displayName: 'Demo Sender',
        etherealUser: 'sender@ethereal.email',
        etherealPassword: 'password',
        smtpHost: 'smtp.ethereal.email',
        smtpPort: 587,
        smtpUser: 'sender@ethereal.email',
        smtpPassEncrypted: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    const res = await request(app).post('/api/auth/dev-login');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('demo.user@reachinbox.test');
    expect(res.headers['set-cookie']).toBeDefined();
  });
});
