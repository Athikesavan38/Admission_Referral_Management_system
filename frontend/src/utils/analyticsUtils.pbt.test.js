/**
 * Property-based tests for analyticsUtils.js using fast-check.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  deriveRejectionRate,
  buildProjection,
  applyDateFilter,
  buildStatusDonut,
} from './analyticsUtils.js';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ---------------------------------------------------------------------------
// 2.1 Property test: deriveRejectionRate always returns [0, 100]
// Validates: Requirements 2.1
// ---------------------------------------------------------------------------
describe('PBT: deriveRejectionRate always returns [0, 100]', () => {
  it('result is always in [0, 100] for any valid total/rejected pair', () => {
    fc.assert(
      fc.property(
        // Generate total as integer in [0, 1000]
        fc.integer({ min: 0, max: 1000 }),
        (total) =>
          // Generate rejected as integer in [0, total]
          fc.assert(
            fc.property(
              fc.integer({ min: 0, max: total }),
              (rejected) => {
                const rate = deriveRejectionRate({ total, rejected });
                return rate >= 0 && rate <= 100;
              }
            )
          )
      )
    );
  });

  it('result is always in [0, 100] using combined arbitrary', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }).chain((total) =>
          fc.tuple(
            fc.constant(total),
            fc.integer({ min: 0, max: total })
          )
        ),
        ([total, rejected]) => {
          const rate = deriveRejectionRate({ total, rejected });
          return rate >= 0 && rate <= 100;
        }
      )
    );
  });
});

// ---------------------------------------------------------------------------
// 2.2 Property test: buildProjection bounds invariant
// Validates: Requirements 2.2
// ---------------------------------------------------------------------------
describe('PBT: buildProjection bounds invariant', () => {
  // Arbitrary for a single trend entry
  const trendEntryArb = fc.record({
    month: fc.constantFrom(...MONTH_NAMES),
    referrals: fc.integer({ min: 0, max: 100 }),
    approved: fc.integer({ min: 0, max: 50 }),
  });

  it('returns exactly 12 points where lower <= projected <= upper and all values >= 0', () => {
    fc.assert(
      fc.property(
        // Array of 3–12 trend entries
        fc.array(trendEntryArb, { minLength: 3, maxLength: 12 }),
        (trend) => {
          const projection = buildProjection(trend);

          // Must return exactly 12 points
          if (projection.length !== 12) return false;

          // Each point must satisfy bounds invariant and non-negativity
          return projection.every(({ projected, lower, upper }) => {
            return (
              lower >= 0 &&
              projected >= 0 &&
              upper >= 0 &&
              lower <= projected &&
              projected <= upper
            );
          });
        }
      )
    );
  });
});

// ---------------------------------------------------------------------------
// 2.3 Property test: applyDateFilter subset + no mutation
// Validates: Requirements 2.3
// ---------------------------------------------------------------------------
describe('PBT: applyDateFilter subset + no mutation', () => {
  // Arbitrary for a single trend item
  const trendItemArb = fc.record({
    month: fc.constantFrom(...MONTH_NAMES),
    referrals: fc.integer({ min: 0, max: 100 }),
    approved: fc.integer({ min: 0, max: 50 }),
  });

  // Arbitrary for a valid ISO date string (years 2020–2026)
  const isoDateArb = fc.date({
    min: new Date('2020-01-01'),
    max: new Date('2026-12-31'),
  }).map((d) => d.toISOString().slice(0, 10));

  // Arbitrary for dateRange: either null or { start, end } with valid ISO strings
  const dateRangeArb = fc.oneof(
    fc.constant(null),
    fc.record({
      start: isoDateArb,
      end: isoDateArb,
    })
  );

  it('result.length <= trend.length for any trend and dateRange', () => {
    fc.assert(
      fc.property(
        fc.array(trendItemArb, { minLength: 0, maxLength: 10 }),
        dateRangeArb,
        (trend, dateRange) => {
          const result = applyDateFilter(trend, dateRange);
          return result.length <= trend.length;
        }
      )
    );
  });

  it('input array is not mutated after applyDateFilter', () => {
    fc.assert(
      fc.property(
        fc.array(trendItemArb, { minLength: 0, maxLength: 10 }),
        dateRangeArb,
        (trend, dateRange) => {
          // Deep-copy the original for comparison
          const originalSnapshot = JSON.parse(JSON.stringify(trend));
          const originalLength = trend.length;

          applyDateFilter(trend, dateRange);

          // Array length must be unchanged
          if (trend.length !== originalLength) return false;

          // Each element must be deep-equal to the original
          return trend.every((item, i) => {
            return JSON.stringify(item) === JSON.stringify(originalSnapshot[i]);
          });
        }
      )
    );
  });
});

// ---------------------------------------------------------------------------
// 2.4 Property test: buildStatusDonut always returns 4 non-negative slices
// Validates: Requirements 2.4
// ---------------------------------------------------------------------------
describe('PBT: buildStatusDonut always returns 4 non-negative slices', () => {
  // Each field is independently either absent or a non-negative integer in [0, 500]
  const optionalNonNegInt = fc.oneof(
    fc.constant(undefined),
    fc.integer({ min: 0, max: 500 })
  );

  const partialSummaryArb = fc.record(
    {
      total: optionalNonNegInt,
      pending: optionalNonNegInt,
      approved: optionalNonNegInt,
      rejected: optionalNonNegInt,
      underReview: optionalNonNegInt,
    },
    { requiredKeys: [] } // all keys are optional
  );

  it('returns exactly 4 slices each with a non-negative numeric value', () => {
    fc.assert(
      fc.property(
        partialSummaryArb,
        (summary) => {
          const slices = buildStatusDonut(summary);

          // Must return exactly 4 slices
          if (slices.length !== 4) return false;

          // Each slice must have a non-negative numeric value
          return slices.every(
            ({ value }) => typeof value === 'number' && value >= 0
          );
        }
      )
    );
  });
});
