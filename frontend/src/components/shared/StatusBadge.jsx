const STYLES = {
  pending:  'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 ring-1 ring-amber-100 dark:ring-amber-800',
  approved: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 ring-1 ring-emerald-100 dark:ring-emerald-800',
  rejected: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 ring-1 ring-red-100 dark:ring-red-800',
};

const DOTS = {
  pending:  'bg-amber-400',
  approved: 'bg-emerald-400',
  rejected: 'bg-red-400',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STYLES[status] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${DOTS[status] ?? 'bg-gray-400'}`} />
      {status}
    </span>
  );
}
