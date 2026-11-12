/**
 * Analytics utility functions for the AI Analytics Dashboard.
 * All functions are pure (no side effects) and safe to use in useMemo.
 */

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Build the 4-slice donut data for the Referral Status chart.
 *
 * @param {object} summary - analytics.summary from the API response
 * @returns {Array<{ name: string, value: number, color: string }>} exactly 4 slices
 */
export function buildStatusDonut(summary = {}) {
  const pending  = summary.pending  ?? 0;
  const approved = summary.approved ?? 0;
  const rejected = summary.rejected ?? 0;
  const total    = summary.total    ?? 0;

  // underReview: use explicit field if present, otherwise derive as remainder
  const underReview = summary.underReview ??
    Math.max(0, total - approved - pending - rejected);

  return [
    { name: 'Pending',      value: pending,     color: '#f59e0b' },
    { name: 'Approved',     value: approved,    color: '#10b981' },
    { name: 'Rejected',     value: rejected,    color: '#ef4444' },
    { name: 'Under Review', value: underReview, color: '#6366f1' },
  ];
}

/**
 * Advance a short month name by `offset` months.
 *
 * @param {string} monthName - e.g. "Jan", "Feb"
 * @param {number} offset    - number of months to advance (1-based)
 * @returns {string} short month name
 */
function advanceMonth(monthName, offset) {
  const idx = MONTH_NAMES.indexOf(monthName);
  // If the month name is unrecognised, fall back to index 0
  const base = idx === -1 ? 0 : idx;
  return MONTH_NAMES[(base + offset) % 12];
}

/**
 * Build a 12-month forward projection from the last 3 entries of monthlyTrend.
 *
 * @param {Array<{ month: string, referrals: number, approved: number }>} monthlyTrend
 * @returns {Array<{ month: string, projected: number, lower: number, upper: number }>}
 *          12 projection points, or [] when input has fewer than 3 entries
 */
export function buildProjection(monthlyTrend) {
  if (!Array.isArray(monthlyTrend) || monthlyTrend.length < 3) {
    return [];
  }

  const last3 = monthlyTrend.slice(-3);

  // Average monthly delta of approved values over the last 3 entries
  const delta1 = (last3[1].approved ?? 0) - (last3[0].approved ?? 0);
  const delta2 = (last3[2].approved ?? 0) - (last3[1].approved ?? 0);
  const avgDelta = (delta1 + delta2) / 2;

  const baseValue  = last3[2].approved ?? 0;
  const lastMonth  = last3[2].month;

  const projection = [];
  for (let i = 1; i <= 12; i++) {
    const projected = Math.max(0, baseValue + avgDelta * i);
    const lower     = Math.max(0, projected * 0.85);
    const upper     = projected * 1.15;
    const month     = advanceMonth(lastMonth, i);
    projection.push({ month, projected, lower, upper });
  }

  return projection;
}

/**
 * Filter a monthly trend array to only include months within a date range.
 * Returns the original array unchanged when dateRange is null/empty.
 *
 * Trend items have `month` as a short name (e.g. "Jan"). The year is inferred
 * from the date range: months are matched by their short name against the
 * calendar months that fall within [start, end].
 *
 * @param {Array<{ month: string }>} trend
 * @param {{ start: string, end: string } | null | undefined} dateRange
 * @returns {Array<{ month: string }>} filtered (or original) array
 */
export function applyDateFilter(trend, dateRange) {
  if (!dateRange || (!dateRange.start && !dateRange.end)) {
    return trend;
  }

  const startDate = dateRange.start ? new Date(dateRange.start) : null;
  const endDate   = dateRange.end   ? new Date(dateRange.end)   : null;

  return trend.filter((item) => {
    const monthIdx = MONTH_NAMES.indexOf(item.month);
    if (monthIdx === -1) return false;

    // Build candidate dates for this month in the years spanned by the range
    const startYear = startDate ? startDate.getFullYear() : (endDate ? endDate.getFullYear() : new Date().getFullYear());
    const endYear   = endDate   ? endDate.getFullYear()   : startYear;

    // Check if this month falls within the range for any year in [startYear, endYear]
    for (let year = startYear; year <= endYear; year++) {
      // Use the 1st of the month for comparison
      const candidate = new Date(year, monthIdx, 1);
      const afterStart  = !startDate || candidate >= new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const beforeEnd   = !endDate   || candidate <= new Date(endDate.getFullYear(),   endDate.getMonth(),   1);
      if (afterStart && beforeEnd) return true;
    }
    return false;
  });
}

/**
 * Derive the rejection rate as a rounded percentage.
 *
 * @param {object} summary - analytics.summary from the API response
 * @returns {number} integer in [0, 100], or 0 when total is 0/falsy
 */
export function deriveRejectionRate(summary = {}) {
  const total    = summary.total    ?? 0;
  const rejected = summary.rejected ?? 0;

  if (!total) return 0;

  return Math.round((rejected / total) * 100);
}
