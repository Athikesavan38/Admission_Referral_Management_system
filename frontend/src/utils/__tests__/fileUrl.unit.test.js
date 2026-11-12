/**
 * Unit tests for getFileUrl helper
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 3.1
 */
import { describe, it, expect, afterEach } from 'vitest';
import { vi } from 'vitest';
import { getFileUrl } from '../fileUrl.js';

describe('getFileUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // Null / empty guard tests (Requirements 3.1)
  it('returns null for null input', () => {
    expect(getFileUrl(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(getFileUrl(undefined)).toBeNull();
  });

  it('returns null for empty string input', () => {
    expect(getFileUrl('')).toBeNull();
  });

  // Absolute base URL — origin extraction (Requirements 2.1, 2.2)
  it('prepends backend origin when VITE_API_BASE_URL is http://localhost:5000/api', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:5000/api');
    expect(getFileUrl('/uploads/photos/abc.jpg')).toBe(
      'http://localhost:5000/uploads/photos/abc.jpg'
    );
  });

  it('prepends backend origin when VITE_API_BASE_URL is https://api.example.com/api', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/api');
    expect(getFileUrl('/uploads/documents/file.pdf')).toBe(
      'https://api.example.com/uploads/documents/file.pdf'
    );
  });

  // Relative base URL — dev proxy passthrough (Requirements 2.3, 2.4)
  it('returns path unchanged when VITE_API_BASE_URL is a relative path (/api)', () => {
    vi.stubEnv('VITE_API_BASE_URL', '/api');
    expect(getFileUrl('/uploads/photos/abc.jpg')).toBe('/uploads/photos/abc.jpg');
  });
});
