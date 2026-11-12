import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useNotifications } from '../hooks/useNotifications';

// ── Toast context ──────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const { notify } = useNotifications();

  const addToast = useCallback(({ title, message, type = 'info', pushNotify = false }) => {
    const id = Date.now();
    setToasts((prev) => [...prev.slice(-4), { id, title, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);

    // Also fire a browser push notification if requested
    if (pushNotify) {
      notify(title, { body: message, tag: `toast-${id}` });
    }
  }, [notify]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) return { addToast: () => {} };
  return ctx;
};

// ── Toast stack ────────────────────────────────────────────────────────────────
const TYPE_STYLES = {
  success: 'border-l-4 border-emerald-500 bg-white dark:bg-[#1a1d2e]',
  error:   'border-l-4 border-red-500   bg-white dark:bg-[#1a1d2e]',
  warning: 'border-l-4 border-amber-500 bg-white dark:bg-[#1a1d2e]',
  info:    'border-l-4 border-indigo-500 bg-white dark:bg-[#1a1d2e]',
};
const TYPE_ICONS = {
  success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️',
};

function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-20 right-4 z-[100] flex flex-col gap-2 w-80 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id}
          className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border border-gray-100 dark:border-white/10 animate-slide-in-right ${TYPE_STYLES[t.type]}`}>
          <span className="text-lg flex-shrink-0 mt-0.5">{TYPE_ICONS[t.type]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.title}</p>
            {t.message && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{t.message}</p>}
          </div>
          <button onClick={() => onDismiss(t.id)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Notification permission button (for TopBar) ────────────────────────────────
export function NotificationBell() {
  const { supported, permission, requestPermission } = useNotifications();
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (permission === 'default') setPulse(true);
  }, [permission]);

  if (!supported) return null;

  return (
    <button
      onClick={async () => { setPulse(false); await requestPermission(); }}
      title={permission === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
      className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all
        bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10
        text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400
        hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
      {permission === 'granted' ? (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0f1117]" />
      ) : pulse ? (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0f1117] animate-ping2" />
      ) : (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0f1117]" />
      )}
    </button>
  );
}
