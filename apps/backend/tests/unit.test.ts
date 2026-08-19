import { describe, it, expect } from 'vitest';
import { CsvParserService } from '../src/services/CsvParserService';
import { RateLimiterService } from '../src/services/RateLimiterService';
import { encryptText, decryptText } from '../src/lib/crypto';

describe('Unit Tests: CSV Parser Service', () => {
  it('should parse valid email CSV content with trim, lowercase, and deduplication', () => {
    const csvContent = `email,name
      TEST1@EXAMPLE.COM, Alice
      test2@example.com, Bob
      test1@example.com, Alice Duplicate
      invalid-email-address, Charlie
    `;

    const result = CsvParserService.parseCsvContent(csvContent);

    expect(result.totalRows).toBe(4);
    expect(result.validCount).toBe(2);
    expect(result.duplicateCount).toBe(1);
    expect(result.invalidCount).toBe(1);
    expect(result.validRecipients).toEqual([
      { email: 'test1@example.com', name: 'Alice' },
      { email: 'test2@example.com', name: 'Bob' }
    ]);
  });
});

describe('Unit Tests: AES-256 Crypto Utilities', () => {
  it('should encrypt and decrypt sensitive SMTP passwords correctly', () => {
    const secretPassword = 'MySuperSecretSMTPPassword123!';
    const encrypted = encryptText(secretPassword);
    expect(encrypted).not.toBe(secretPassword);
    expect(encrypted).toContain(':');

    const decrypted = decryptText(encrypted);
    expect(decrypted).toBe(secretPassword);
  });
});

describe('Unit Tests: Rate Limiter Reset Window', () => {
  it('should calculate positive remaining milliseconds until next hour', () => {
    const ms = RateLimiterService.getMsUntilNextHour();
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(3600000);
  });
});
