import { describe, it, expect } from 'vitest';
import { hashBody } from '../approval.js';

describe('hashBody determinism', () => {
  it('should generate same hash for identical objects with different key order', () => {
    const obj1 = { a: 1, b: 2, c: 3 };
    const obj2 = { c: 3, a: 1, b: 2 };
    
    expect(hashBody(obj1)).toBe(hashBody(obj2));
  });

  it('should generate same hash for nested objects with different key order', () => {
    const obj1 = { 
      user: { name: 'John', age: 30 }, 
      action: { type: 'read', resource: 'file' } 
    };
    const obj2 = { 
      action: { resource: 'file', type: 'read' }, 
      user: { age: 30, name: 'John' } 
    };
    
    expect(hashBody(obj1)).toBe(hashBody(obj2));
  });

  it('should generate different hashes for different content', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 3 };
    
    expect(hashBody(obj1)).not.toBe(hashBody(obj2));
  });

  it('should handle null and undefined consistently', () => {
    expect(hashBody(null)).toBe('empty');
    expect(hashBody(undefined)).toBe('empty');
    expect(hashBody({})).not.toBe('empty');
  });

  it('should handle arrays consistently', () => {
    const arr1 = [1, 2, 3];
    const arr2 = [1, 2, 3];
    
    expect(hashBody(arr1)).toBe(hashBody(arr2));
  });

  it('should handle complex nested structures', () => {
    const obj1 = {
      traceId: 'test-123',
      type: 'tool.invocation',
      ts: '2024-01-01T00:00:00Z',
      attrs: {
        tool: 'shell.execute',
        url: 'https://example.com',
        params: { timeout: 30, retries: 3 }
      }
    };
    
    const obj2 = {
      ts: '2024-01-01T00:00:00Z',
      attrs: {
        params: { retries: 3, timeout: 30 },
        url: 'https://example.com',
        tool: 'shell.execute'
      },
      type: 'tool.invocation',
      traceId: 'test-123'
    };
    
    expect(hashBody(obj1)).toBe(hashBody(obj2));
  });
});
