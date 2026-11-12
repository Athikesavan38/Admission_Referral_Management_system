export default function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f9] dark:bg-[#0f1117]">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        {/* Spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-900" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
        </div>
        <p className="text-sm font-medium text-gray-400 dark:text-gray-500 tracking-wide">Loading…</p>
      </div>
    </div>
  );
}
