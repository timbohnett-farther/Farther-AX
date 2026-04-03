/**
 * Security Tests: DocuSign Webhook HMAC Verification
 *
 * Verifies that the DocuSign webhook properly validates HMAC signatures
 * and rejects unauthorized requests.
 *
 * Security requirements:
 * - MUST reject requests with invalid HMAC signatures
 * - MUST use constant-time comparison (timing-safe)
 * - MUST reject requests with missing signature header
 * - MUST reject replay attacks (different payload, same signature)
 * - MUST handle signature tampering attempts
 */

import { verifyWebhookHMAC, parseWebhookPayload } from '@/lib/docusign-client';
import * as crypto from 'crypto';

// Store original env var
const originalHMACSecret = process.env.DOCUSIGN_HMAC_SECRET;

// Test HMAC secret (32 random bytes)
const TEST_SECRET = 'test-docusign-hmac-secret-key-123';

// Sample valid webhook payload from DocuSign
const SAMPLE_PAYLOAD = JSON.stringify({
  event: 'envelope-completed',
  apiVersion: 'v2.1',
  uri: '/restapi/v2.1/accounts/123/envelopes/abc-123',
  retryCount: 0,
  configurationId: '1',
  generatedDateTime: '2024-01-01T12:00:00Z',
  data: {
    accountId: '123',
    userId: 'user-123',
    envelopeId: 'abc-123',
    status: 'completed',
    emailSubject: 'Please sign: IAA Agreement',
    recipients: {
      signers: [
        {
          name: 'John Doe',
          email: 'john@example.com',
          status: 'completed',
          signedDateTime: '2024-01-01T12:00:00Z',
        },
      ],
    },
  },
});

/**
 * Generate valid HMAC signature for testing
 */
function generateValidSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64');
}

describe('[SECURITY] DocuSign Webhook HMAC Verification', () => {
  beforeAll(() => {
    // Set test HMAC secret
    process.env.DOCUSIGN_HMAC_SECRET = TEST_SECRET;
  });

  afterAll(() => {
    // Restore original env var
    process.env.DOCUSIGN_HMAC_SECRET = originalHMACSecret;
  });

  describe('Valid Signatures', () => {
    it('should accept requests with valid HMAC signature', () => {
      const validSignature = generateValidSignature(SAMPLE_PAYLOAD, TEST_SECRET);
      const result = verifyWebhookHMAC(SAMPLE_PAYLOAD, validSignature);

      expect(result).toBe(true);
    });

    it('should accept valid signature with Buffer payload', () => {
      const payloadBuffer = Buffer.from(SAMPLE_PAYLOAD, 'utf8');
      const validSignature = generateValidSignature(SAMPLE_PAYLOAD, TEST_SECRET);
      const result = verifyWebhookHMAC(payloadBuffer, validSignature);

      expect(result).toBe(true);
    });

    it('should parse valid webhook payload correctly', () => {
      const parsed = parseWebhookPayload(SAMPLE_PAYLOAD);

      expect(parsed).toBeDefined();
      expect(parsed?.event).toBe('envelope-completed');
      expect(parsed?.data.envelopeId).toBe('abc-123');
      expect(parsed?.data.status).toBe('completed');
      expect(parsed?.data.recipients?.signers?.[0]?.email).toBe('john@example.com');
    });
  });

  describe('Invalid Signatures - Must Reject', () => {
    it('should reject request with completely wrong signature', () => {
      const wrongSignature = 'aW52YWxpZC1zaWduYXR1cmUtZGF0YQ=='; // random base64
      const result = verifyWebhookHMAC(SAMPLE_PAYLOAD, wrongSignature);

      expect(result).toBe(false);
    });

    it('should reject request with signature signed with wrong secret', () => {
      const wrongSecret = 'different-secret-key';
      const wrongSignature = generateValidSignature(SAMPLE_PAYLOAD, wrongSecret);
      const result = verifyWebhookHMAC(SAMPLE_PAYLOAD, wrongSignature);

      expect(result).toBe(false);
    });

    it('should reject request with empty signature', () => {
      const result = verifyWebhookHMAC(SAMPLE_PAYLOAD, '');

      expect(result).toBe(false);
    });

    it('should reject request with missing signature header', () => {
      const result = verifyWebhookHMAC(SAMPLE_PAYLOAD, '');

      expect(result).toBe(false);
    });

    it('should reject replay attack (same signature, different payload)', () => {
      // Generate valid signature for original payload
      const validSignature = generateValidSignature(SAMPLE_PAYLOAD, TEST_SECRET);

      // Modify payload (attacker trying to change envelope ID)
      const tamperedPayload = SAMPLE_PAYLOAD.replace(
        '"envelopeId":"abc-123"',
        '"envelopeId":"malicious-envelope-456"'
      );

      // Try to verify tampered payload with original signature
      const result = verifyWebhookHMAC(tamperedPayload, validSignature);

      expect(result).toBe(false);
    });

    it('should reject signature with extra whitespace padding', () => {
      const validSignature = generateValidSignature(SAMPLE_PAYLOAD, TEST_SECRET);
      const paddedSignature = `  ${validSignature}  `;
      const result = verifyWebhookHMAC(SAMPLE_PAYLOAD, paddedSignature);

      expect(result).toBe(false);
    });

    it('should reject signature with wrong encoding (hex instead of base64)', () => {
      const hexSignature = crypto
        .createHmac('sha256', TEST_SECRET)
        .update(SAMPLE_PAYLOAD)
        .digest('hex'); // Wrong encoding (should be base64)

      const result = verifyWebhookHMAC(SAMPLE_PAYLOAD, hexSignature);

      expect(result).toBe(false);
    });

    it('should reject signature with wrong hash algorithm (SHA1 instead of SHA256)', () => {
      const sha1Signature = crypto
        .createHmac('sha1', TEST_SECRET) // Wrong algorithm
        .update(SAMPLE_PAYLOAD)
        .digest('base64');

      const result = verifyWebhookHMAC(SAMPLE_PAYLOAD, sha1Signature);

      expect(result).toBe(false);
    });
  });

  describe('Payload Parsing Security', () => {
    it('should reject malformed JSON payload', () => {
      const malformedPayload = '{ "event": "test", invalid json }';
      const parsed = parseWebhookPayload(malformedPayload);

      expect(parsed).toBeNull();
    });

    it('should handle payload with missing required fields', () => {
      const incompletePayload = JSON.stringify({
        event: 'envelope-sent',
        // Missing data field
      });

      const parsed = parseWebhookPayload(incompletePayload);

      // Should parse but return incomplete data
      expect(parsed).toBeDefined();
      expect(parsed?.data).toBeUndefined();
    });

    it('should handle payload with XSS injection attempt', () => {
      const xssPayload = JSON.stringify({
        event: 'envelope-completed',
        apiVersion: 'v2.1',
        uri: '/restapi/v2.1/accounts/123/envelopes/abc-123',
        retryCount: 0,
        configurationId: '1',
        generatedDateTime: '2024-01-01T12:00:00Z',
        data: {
          accountId: '123',
          userId: 'user-123',
          envelopeId: 'abc-123',
          status: 'completed',
          emailSubject: '<script>alert("XSS")</script>',
          recipients: {
            signers: [
              {
                name: '<img src=x onerror=alert(1)>',
                email: 'john@example.com',
                status: 'completed',
              },
            ],
          },
        },
      });

      const parsed = parseWebhookPayload(xssPayload);

      // Should parse without executing malicious code
      expect(parsed).toBeDefined();
      expect(parsed?.data.emailSubject).toContain('<script>');
      expect(parsed?.data.recipients?.signers?.[0]?.name).toContain('<img');

      // Important: Application must sanitize these values before rendering
    });
  });

  describe('Timing-Safe Comparison', () => {
    it('should use constant-time comparison (timing-safe)', () => {
      // This test verifies that verification doesn't leak timing info
      const validSignature = generateValidSignature(SAMPLE_PAYLOAD, TEST_SECRET);

      // Create signature that differs only in last character
      const almostValidSignature = validSignature.slice(0, -1) + 'X';

      const start1 = process.hrtime.bigint();
      verifyWebhookHMAC(SAMPLE_PAYLOAD, validSignature);
      const duration1 = process.hrtime.bigint() - start1;

      const start2 = process.hrtime.bigint();
      verifyWebhookHMAC(SAMPLE_PAYLOAD, almostValidSignature);
      const duration2 = process.hrtime.bigint() - start2;

      // Timing should be similar (within 10x) for constant-time comparison
      // Note: This is not a perfect test but catches obvious timing leaks
      const ratio = Number(duration1) / Number(duration2);
      expect(ratio).toBeGreaterThan(0.1);
      expect(ratio).toBeLessThan(10);
    });
  });

  describe('Configuration Security', () => {
    it('should fail gracefully when HMAC_SECRET is not configured', () => {
      // Temporarily remove secret
      const original = process.env.DOCUSIGN_HMAC_SECRET;
      delete process.env.DOCUSIGN_HMAC_SECRET;

      const validSignature = generateValidSignature(SAMPLE_PAYLOAD, TEST_SECRET);
      const result = verifyWebhookHMAC(SAMPLE_PAYLOAD, validSignature);

      // Should reject all requests when secret is missing
      expect(result).toBe(false);

      // Restore secret
      process.env.DOCUSIGN_HMAC_SECRET = original;
    });
  });
});
