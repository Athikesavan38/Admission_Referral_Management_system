import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotificationCenter, NOTIF_CONFIG, ROLE_LABELS, ROLE_ICONS } from '../context/NotificationContext';

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

const ROLE_SECTION_LABELS = {
  admin:               '🛡️ Admin',
  student_referrer:    '🎓 Student Referrer',
  faculty:             '👨‍🏫 Faculty',
  alumni:              '🏅 Alumni',
  external_consultant: '💼 Consultant',
};

export default function NotificationBar() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const role      = user?.role || 'user';

  const { getNotifs, unreadCount, markRead, markAllRead, clear } = useNotificationCenter();

  const notifications = getNotifs(role);
  const count         = unreadCount(role);

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleClick(n) {
    markRead(n.id, role);
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  const cfg = (type) => NOTIF_CONFIG[type] || NOTIF_CONFIG.info;
  const isAdmin = role === 'admin';

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button onClick={() => setOpen((v) => !v)} title="Notifications"
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all
          bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10
          text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400
          hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full
            bg-red-500 text-white text-[10px] font-bold flex items-center justify-center
            border-2 border-white dark:border-[#0f1117] animate-bounce-in">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-[calc(100vw-2rem)] sm:w-96 max-h-[560px] flex flex-col
          bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10
          z-50 animate-scale-in origin-top-right overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                {ROLE_SECTION_LABELS[role] || '🔔'} Notifications
              </h3>
              {count > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                  {count} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {count > 0 && (
                <button onClick={() => markAllRead(role)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={() => clear(role)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <span className="text-4xl">🔔</span>
                <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">No notifications yet</p>
                <p className="text-xs text-gray-300 dark:text-gray-600">
                  {isAdmin ? 'New referral submissions will appear here in real time' : 'Your referral updates will appear here in real time'}
                </p>
              </div>
            ) : (
              <ul>
                {notifications.map((n, i) => (
                  <li key={n.id}
                    onClick={() => handleClick(n)}
                    className={`flex items-start gap-3 px-5 py-4 cursor-pointer transition-all
                      border-b border-gray-50 dark:border-white/5 last:border-0 group
                      ${n.read
                        ? 'bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-white/5'
                        : 'bg-indigo-50/40 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                      }`}
                    style={{ animationDelay: `${i * 25}ms` }}>

                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border ${cfg(n.type).color}`}>
                      {cfg(n.type).icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold leading-tight ${n.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5 whitespace-nowrap">
                          {timeAgo(n.time)}
                        </span>
                      </div>

                      {n.message && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                      )}

                      {/* Admin: referrer role badge + name */}
                      {isAdmin && n.referrerName && (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold border border-indigo-100 dark:border-indigo-800">
                            {ROLE_ICONS[n.referrerRole] || '👤'} {ROLE_LABELS[n.referrerRole] || n.referrerRole}
                          </span>
                          <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300">{n.referrerName}</span>
                        </div>
                      )}

                      {/* Student + course pills */}
                      {n.studentName && (
                        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-[10px] font-medium">
                            👤 {n.studentName}
                          </span>
                          {n.course && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium">
                              📚 {n.course}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Clickable link hint */}
                      {n.link && (
                        <p className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-1.5 group-hover:underline flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                          Click to view details
                        </p>
                      )}
                    </div>

                    {/* Unread dot */}
                    {!n.read && (
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${cfg(n.type).dot}`} />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''} · Click any to view details
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
