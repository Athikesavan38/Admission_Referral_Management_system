import { describe, it, expect } from 'vitest';
import {
  buildStatusDonut,
  buildProjection,
  applyDateFilter,
  deriveRejectionRate,
} from './analyticsUtils.js';

// ---------------------------------------------------------------------------
// buildStatusDonut
// ---------------------------------------------------------------------------
describe('buildStatusDonut', () => {
  it('returns exactly 4 slices', () => {
    const result = buildStatusDonut({ total: 10, pending: 3, approved: 5, rejected: 2 });
    expect(result).toHaveLength(4);
  });

  it('maps correct names and colors for a normal summary', () => {
    const result = buildStatusDonut({ total: 10, pending: 3, approved: 5, rejected: 2 });
    const names  = result.map((s) => s.name);
    expect(names).toEqual(['Pending', 'Approved', 'Rejected', 'Under Review']);

    const colors = result.map((s) => s.color);
    expect(colors).toEqual(['#f59e0b', '#10b981', '#ef4444', '#6366f1']);
  });

  it('maps correct values for a normal summary', () => {
    const result = buildStatusDonut({ total: 10, pending: 3, approved: 5, rejected: 2 });
    expect(result[0].value).toBe(3); // Pending
    expect(result[1].value).toBe(5); // Approved
    expect(result[2].value).toBe(2); // Rejected
    expect(result[3].value).toBe(0); // Under Review = 10 - 5 - 3 - 2 = 0
  });

  it('defaults all missing fields to 0 for an empty summary {}', () => {
    const result = buildStatusDonut({});
    result.forEach((slice) => {
      expect(slice.value).toBe(0);
    });
  });

  it('handles partial summary (only approved provided)', () => {
    const result = buildStatusDonut({ total: 8, approved: 6 });
    expect(result[0].value).toBe(0); // pending defaults to 0
    expect(result[1].value).toBe(6); // approved
    expect(result[2].value).toBe(0); // rejected defaults to 0
    expect(result[3].value).toBe(2); // underReview = 8 - 6 - 0 - 0
  });

  it('handles all-zero summary', () => {
    const result = buildStatusDonut({ total: 0, pending: 0, approved: 0, rejected: 0 });
    result.forEach((slice) => {
      expect(slice.value).toBe(0);
    });
  });

  it('uses explicit underReview field when provided', () => {
    const result = buildStatusDonut({ total: 10, pending: 2, approved: 4, rejected: 1, underReview: 3 });
    expect(result[3].value).toBe(3);
  });

  it('clamps underReview to 0 when derived value would be negative', () => {
    // approved + pending + rejected > total — underReview should not go negative
    const result = buildStatusDonut({ total: 5, pending: 3, approved: 3, rejected: 2 });
    expect(result[3].value).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// buildProjection
// ---------------------------------------------------------------------------
describe('buildProjection', () => {
  const makeTrend = (approvedValues) =>
    approvedValues.map((approved, i) => ({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i % 12],
      referrals: approved + 5,
      approved,
    }));

  it('returns [] for an empty array', () => {
    expect(buildProjection([])).toEqual([]);
  });

  it('returns [] for a trend with 2 entries', () => {
    expect(buildProjection(makeTrend([10, 12]))).toEqual([]);
  });

  it('returns [] for a trend with 1 entry', () => {
    expect(buildProjection(makeTrend([10]))).toEqual([]);
  });

  it('returns exactly 12 points for a trend with 3 entries', () => {
    const result = buildProjection(makeTrend([10, 12, 14]));
    expect(result).toHaveLength(12);
  });

  it('returns exactly 12 points for a trend with more than 3 entries', () => {
    const result = buildProjection(makeTrend([5, 8, 10, 13, 15, 18]));
    expect(result).toHaveLength(12);
  });

  it('satisfies lower <= projected <= upper for all points', () => {
    const result = buildProjection(makeTrend([10, 12, 14]));
    result.forEach(({ projected, lower, upper }) => {
      expect(lower).toBeLessThanOrEqual(projected);
      expect(projected).toBeLessThanOrEqual(upper);
    });
  });

  it('all projected, lower, upper values are >= 0', () => {
    // Declining trend that could produce negative projections without clamping
    const result = buildProjection(makeTrend([20, 10, 0]));
    result.forEach(({ projected, lower, upper }) => {
      expect(projected).toBeGreaterThanOrEqual(0);
      expect(lower).toBeGreaterThanOrEqual(0);
      expect(upper).toBeGreaterThanOrEqual(0);
    });
  });

  it('each point has a month label string', () => {
    const result = buildProjection(makeTrend([10, 12, 14]));
    result.forEach(({ month }) => {
      expect(typeof month).toBe('string');
      expect(month.length).toBeGreaterThan(0);
    });
  });

  it('confidence band is ±15% of projected', () => {
    const result = buildProjection(makeTrend([10, 12, 14]));
    result.forEach(({ projected, lower, upper }) => {
      if (projected > 0) {
        expect(lower).toBeCloseTo(projected * 0.85, 5);
        expect(upper).toBeCloseTo(projected * 1.15, 5);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// applyDateFilter
// ---------------------------------------------------------------------------
describe('applyDateFilter', () => {
  const trend = [
    { month: 'Jan', referrals: 5, approved: 3 },
    { month: 'Feb', referrals: 7, approved: 4 },
    { month: 'Mar', referrals: 6, approved: 5 },
    { month: 'Apr', referrals: 8, approved: 6 },
    { month: 'May', referrals: 9, approved: 7 },
  ];

  it('returns the original array when dateRange is null', () => {
    const result = applyDateFilter(trend, null);
    expect(result).toBe(trend); // same reference
  });

  it('returns the original array when dateRange is undefined', () => {
    const result = applyDateFilter(trend, undefined);
    expect(result).toBe(trend);
  });

  it('returns the original array when both start and end are empty strings', () => {
    const result = applyDateFilter(trend, { start: '', end: '' });
    expect(result).toBe(trend);
  });

  it('returns the original array when both start and end are falsy', () => {
    const result = applyDateFilter(trend, { start: null, end: null });
    expect(result).toBe(trend);
  });

  it('filters correctly with a valid date range', () => {
    // Jan–Mar 2024
    const result = applyDateFilter(trend, { start: '2024-01-01', end: '2024-03-31' });
    const months = result.map((t) => t.month);
    expect(months).toContain('Jan');
    expect(months).toContain('Feb');
    expect(months).toContain('Mar');
    expect(months).not.toContain('Apr');
    expect(months).not.toContain('May');
  });

  it('result length is <= trend length', () => {
    const result = applyDateFilter(trend, { start: '2024-02-01', end: '2024-04-30' });
    expect(result.length).toBeLessThanOrEqual(trend.length);
  });

  it('does not mutate the input array', () => {
    const original = [...trend];
    applyDateFilter(trend, { start: '2024-01-01', end: '2024-02-28' });
    expect(trend).toEqual(original);
    expect(trend.length).toBe(original.length);
  });

  it('returns empty array when no months match the range', () => {
    // A range in a future year with no matching months in the trend
    const result = applyDateFilter(trend, { start: '2030-06-01', end: '2030-08-31' });
    // Jun, Jul, Aug are not in our trend array, so result should be empty
    expect(result.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// deriveRejectionRate
// ---------------------------------------------------------------------------
describe('deriveRejectionRate', () => {
  it('calculates the correct rejection rate for a normal case', () => {
    expect(deriveRejectionRate({ total: 100, rejected: 25 })).toBe(25);
  });

  it('rounds to the nearest integer', () => {
    // 1/3 ≈ 33.33 → rounds to 33
    expect(deriveRejectionRate({ total: 3, rejected: 1 })).toBe(33);
  });

  it('returns 0 when total is 0', () => {
    expect(deriveRejectionRate({ total: 0, rejected: 0 })).toBe(0);
  });

  it('returns 0 when total is falsy (undefined)', () => {
    expect(deriveRejectionRate({ rejected: 5 })).toBe(0);
  });

  it('returns 0 when total is null', () => {
    expect(deriveRejectionRate({ total: null, rejected: 5 })).toBe(0);
  });

  it('defaults rejected to 0 when field is missing', () => {
    expect(deriveRejectionRate({ total: 50 })).toBe(0);
  });

  it('returns 100 when total equals rejected', () => {
    expect(deriveRejectionRate({ total: 10, rejected: 10 })).toBe(100);
  });

  it('handles empty summary object', () => {
    expect(deriveRejectionRate({})).toBe(0);
  });
});
