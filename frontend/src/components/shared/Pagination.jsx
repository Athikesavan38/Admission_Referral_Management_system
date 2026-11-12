export default function Pagination({ page, total, limit, onPageChange }) {
  const totalPages = Math.ceil(total / limit) || 1;
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="flex items-center justify-between py-4 px-1">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing{' '}
        <span className="font-medium text-gray-700 dark:text-gray-200">{Math.min((page - 1) * limit + 1, total)}</span>
        –
        <span className="font-medium text-gray-700 dark:text-gray-200">{Math.min(page * limit, total)}</span>
        {' '}of{' '}
        <span className="font-medium text-gray-700 dark:text-gray-200">{total}</span> results
      </p>
      <div className="flex items-center gap-1">
        <NavBtn onClick={() => onPageChange(1)} disabled={!hasPrev} title="First">«</NavBtn>
        <NavBtn onClick={() => onPageChange(page - 1)} disabled={!hasPrev} title="Previous">‹</NavBtn>
        <span className="px-3 py-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-100 dark:border-indigo-800">
          {page} / {totalPages}
        </span>
        <NavBtn onClick={() => onPageChange(page + 1)} disabled={!hasNext} title="Next">›</NavBtn>
        <NavBtn onClick={() => onPageChange(totalPages)} disabled={!hasNext} title="Last">»</NavBtn>
      </div>
    </div>
  );
}

function NavBtn({ onClick, disabled, children, title }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium border transition-all duration-150
        disabled:opacity-30 disabled:cursor-not-allowed
        border-gray-200 dark:border-white/10
        text-gray-600 dark:text-gray-300
        hover:border-indigo-300 dark:hover:border-indigo-600
        hover:text-indigo-600 dark:hover:text-indigo-400
        hover:bg-indigo-50 dark:hover:bg-indigo-900/30
        bg-white dark:bg-[#1a1d2e]">
      {children}
    </button>
  );
}
