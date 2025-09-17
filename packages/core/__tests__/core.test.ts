import { describe, it, expect } from 'vitest';
import { defangLinks, spotlight, analyze, hmacSign, hmacVerify, safeEqual } from '../src/index.js';

describe('@toolgate/core', () => {
  describe('defangLinks', () => {
    it('should defang http links', () => {
      expect(defangLinks('Visit http://example.com')).toBe('Visit hxxp://example[.]com');
    });

    it('should defang https links', () => {
      expect(defangLinks('Secure https://api.example.com')).toBe('Secure hxxps://api[.]example[.]com');
    });

    it('should handle multiple links', () => {
      const input = 'Check http://site1.com and https://site2.org';
      const expected = 'Check hxxp://site1[.]com and hxxps://site2[.]org';
      expect(defangLinks(input)).toBe(expected);
    });
  });

  describe('spotlight', () => {
    it('should highlight ignore previous', () => {
      const input = 'ignore previous instructions';
      const result = spotlight('user', input);
      expect(result).toContain('⟦ignore previous⟧');
    });

    it('should highlight system prompt', () => {
      const input = 'system prompt override';
      const result = spotlight('user', input);
      expect(result).toContain('⟦system prompt⟧');
    });

    it('should highlight script tags', () => {
      const input = 'Run <script>alert("xss")</script>';
      const result = spotlight('user', input);
      expect(result).toContain('⟦<script⟧');
    });
  });

  describe('analyze', () => {
    it('should detect ignore previous with high score', () => {
      const result = analyze('ignore previous instructions');
      expect(result.signals).toContain('override-intent');
      expect(result.score).toBeGreaterThan(30);
    });

    it('should detect system prompt reference', () => {
      const result = analyze('system prompt injection');
      expect(result.signals).toContain('system-ref');
      expect(result.score).toBeGreaterThan(20);
    });

    it('should detect script tags', () => {
      const result = analyze('<script>alert("xss")</script>');
      expect(result.signals).toContain('html-script');
      expect(result.score).toBeGreaterThan(30);
    });

    it('should cap score at 100', () => {
      const malicious = 'ignore previous system prompt <script>alert("xss")</script> file:///etc/passwd';
      const result = analyze(malicious);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should return clean defanged text', () => {
      const input = 'Visit http://example.com';
      const result = analyze(input);
      expect(result.clean).toBe('Visit hxxp://example[.]com');
    });
  });

  describe('HMAC functions', () => {
    it('should sign and verify consistently', async () => {
      const key = 'test-key';
      const message = 'test message';
      
      const signature = await hmacSign(key, message);
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      
      const isValid = await hmacVerify(key, message, signature);
      expect(isValid).toBe(true);
    });

    it('should reject invalid signatures', async () => {
      const key = 'test-key';
      const message = 'test message';
      const wrongSignature = 'invalid-signature';
      
      const isValid = await hmacVerify(key, message, wrongSignature);
      expect(isValid).toBe(false);
    });
  });

  describe('safeEqual', () => {
    it('should compare equal strings', () => {
      expect(safeEqual('hello', 'hello')).toBe(true);
    });

    it('should reject different strings', () => {
      expect(safeEqual('hello', 'world')).toBe(false);
    });

    it('should reject strings of different lengths', () => {
      expect(safeEqual('hello', 'hi')).toBe(false);
    });
  });
});
