/**
 * Bug Condition Exploration Test — Property 1: File URLs Resolve to Backend Origin
 *
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 *
 * ORIGINAL STATE: This test was EXPECTED TO FAIL on unfixed code.
 * Failure confirmed the bug existed: file paths were constructed without the
 * backend origin prefix, causing them to resolve to the frontend server in
 * production.
 *
 * CURRENT STATE (post-fix): This test now calls `getFileUrl` and asserts the
 * CORRECT behavior — that for all `/uploads/` paths, the returned URL starts
 * with the backend origin. The test PASSES, confirming the bug is fixed.
 *
 * Bug Condition (isBugCondition):
 *   path is non-null, non-empty, starts with "/uploads/", AND
 *   the constructed URL does NOT start with "http://localhost:5000"
 *
 * The unfixed code used either:
 *   - bare r.photo  (AdminDashboard.jsx)
 *   - "" + r.photo  (ReferralStatus.jsx, BACKEND = "")
 *
 * Both produced a bare relative path that never started with the backend origin.
 * The fix: getFileUrl(path) always prepends the backend origin when
 * VITE_API_BASE_URL is an absolute URL.
 */

import { describe, it, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { vi } from 'vitest';
import { getFileUrl } from '../fileUrl.js';

// ---------------------------------------------------------------------------
// Environment setup: simulate production-like absolute VITE_API_BASE_URL
// ---------------------------------------------------------------------------
const BACKEND_ORIGIN = 'http://localhost:5000';
const API_BASE_URL = 'http://localhost:5000/api';

// ---------------------------------------------------------------------------
// Property 1: Expected Behavior — File URLs Resolve to Backend Origin
//
// For ALL paths starting with "/uploads/", getFileUrl(path) must return a URL
// that starts with the backend origin. This confirms the bug is fixed.
// ---------------------------------------------------------------------------
describe('Property 1: Expected Behavior — File URLs Resolve to Backend Origin', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', API_BASE_URL);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // Arbitrary: any string path starting with "/uploads/"
  const uploadsPathArb = fc
    .string({ minLength: 0, maxLength: 50 })
    .map((s) => '/uploads/' + s);

  it(
    'getFileUrl(path) should start with backend origin for all /uploads/ paths',
    () => {
      fc.assert(
        fc.property(uploadsPathArb, (path) => {
          const constructed = getFileUrl(path);
          // Assert the CORRECT behavior — fixed code must satisfy this
          return constructed !== null && constructed.startsWith(BACKEND_ORIGIN);
        })
      );
    }
  );
});
