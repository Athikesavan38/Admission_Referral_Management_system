import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const NotificationContext = createContext(null);

// Role-specific storage keys — each role gets its own notification list
const STORAGE_KEYS = {
  admin:               'arp_notif_admin',
  student_referrer:    'arp_notif_student',
  faculty:             'arp_notif_faculty',
  alumni:              'arp_notif_alumni',
  external_consultant: 'arp_notif_consultant',
  user:                'arp_notif_user', // fallback
};

export const NOTIF_CONFIG = {
  referral_submitted:  { icon: '📋', color: 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700',    dot: 'bg-indigo-500'  },
  admission_confirmed: { icon: '🎉', color: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700', dot: 'bg-emerald-500' },
  admission_rejected:  { icon: '❌', color: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700',                dot: 'bg-red-500'     },
  duplicate_detected:  { icon: '⚠️', color: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700',        dot: 'bg-amber-500'   },
  new_referral:        { icon: '🔔', color: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700',            dot: 'bg-blue-500'    },
  credit_awarded:      { icon: '⭐', color: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700',    dot: 'bg-yellow-500'  },
  info:                { icon: 'ℹ️', color: 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10',                dot: 'bg-gray-400'    },
};

export const ROLE_LABELS = {
  student_referrer:    'Student Referrer',
  faculty:             'Faculty',
  alumni:              'Alumni',
  external_consultant: 'External Consultant',
  admin:               'Admin',
};

export const ROLE_ICONS = {
  student_referrer:    '🎓',
  faculty:             '👨‍🏫',
  alumni:              '🏅',
  external_consultant: '💼',
  admin:               '🛡️',
};

function storageKey(role) {
  return STORAGE_KEYS[role] || STORAGE_KEYS.user;
}

function loadForRole(role) {
  try { return JSON.parse(localStorage.getItem(storageKey(role)) || '[]'); }
  catch { return []; }
}

export function NotificationProvider({ children }) {
  // Each role has its own list — keyed by role string
  const [notifMap, setNotifMap] = useState(() => {
    const map = {};
    Object.keys(STORAGE_KEYS).forEach((role) => {
      map[role] = loadForRole(role);
    });
    return map;
  });

  // Persist on change
  useEffect(() => {
    Object.keys(notifMap).forEach((role) => {
      localStorage.setItem(storageKey(role), JSON.stringify((notifMap[role] || []).slice(0, 50)));
    });
  }, [notifMap]);

  const getNotifs = useCallback((role) => {
    return notifMap[role] || notifMap.user || [];
  }, [notifMap]);

  const unreadCount = useCallback((role) => {
    return (notifMap[role] || []).filter((n) => !n.read).length;
  }, [notifMap]);

  /**
   * Push a notification for a specific role (or 'admin').
   * target: role string or 'admin'
   */
  const push = useCallback((opts) => {
    const { target = 'user', ...rest } = opts;
    const entry = {
      id:   Date.now() + Math.random(),
      time: new Date().toISOString(),
      read: false,
      ...rest,
    };

    setNotifMap((prev) => {
      const key = target === 'admin' ? 'admin' : target;
      const existing = prev[key] || [];
      return { ...prev, [key]: [entry, ...existing].slice(0, 50) };
    });
  }, []);

  /**
   * Push from SSE event — determines target from event data.
   */
  const pushFromSSE = useCallback((event, userRole) => {
    const entry = {
      id:   Date.now() + Math.random(),
      time: event.time || new Date().toISOString(),
      read: false,
      ...event,
    };
    setNotifMap((prev) => {
      const key = userRole || 'user';
      const existing = prev[key] || [];
      return { ...prev, [key]: [entry, ...existing].slice(0, 50) };
    });
  }, []);

  const markRead = useCallback((id, role) => {
    setNotifMap((prev) => {
      const key = role || 'user';
      return {
        ...prev,
        [key]: (prev[key] || []).map((n) => n.id === id ? { ...n, read: true } : n),
      };
    });
  }, []);

  const markAllRead = useCallback((role) => {
    setNotifMap((prev) => {
      const key = role || 'user';
      return { ...prev, [key]: (prev[key] || []).map((n) => ({ ...n, read: true })) };
    });
  }, []);

  const clear = useCallback((role) => {
    setNotifMap((prev) => ({ ...prev, [role || 'user']: [] }));
  }, []);

  return (
    <NotificationContext.Provider value={{
      push, pushFromSSE,
      getNotifs, unreadCount,
      markRead, markAllRead, clear,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotificationCenter = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) return {
    push: () => {}, pushFromSSE: () => {},
    getNotifs: () => [], unreadCount: () => 0,
    markRead: () => {}, markAllRead: () => {}, clear: () => {},
  };
  return ctx;
};
