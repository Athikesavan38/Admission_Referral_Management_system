export default function TableSkeleton({ rows = 6, cols = 7 }) {
  return (
    <div className="overflow-x-auto animate-fade-in">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50/80 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-5 py-3">
                <div className="skeleton h-3 w-20 rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-gray-50 dark:border-white/5">
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="px-5 py-4">
                  <div
                    className="skeleton h-3 rounded"
                    style={{ width: `${55 + ((r * 3 + c * 7) % 40)}%`, animationDelay: `${(r * cols + c) * 30}ms` }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
