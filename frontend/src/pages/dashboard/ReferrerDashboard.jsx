import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Sidebar from '../../components/Sidebar';
import TopBar from '../../components/TopBar';
import Pagination from '../../components/shared/Pagination';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import TableSkeleton from '../../components/shared/TableSkeleton';
import AnimatedCounter from '../../components/AnimatedCounter';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { useNotificationCenter } from '../../context/NotificationContext';

const LIMIT = 10;

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ReferrerDashboard() {
  const { user }                  = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const res = await client.get('/referrals', { params: { page, limit: LIMIT } });
        setReferrals(res.data.data ?? []);
        setTotal(res.data.total ?? 0);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    fetch();
  }, [page]);

  const pending  = referrals.filter((r) => r.status === 'pending').length;
  const approved = referrals.filter((r) => r.status === 'approved').length;
  const rejected = referrals.filter((r) => r.status === 'rejected').length;

  const barData = [
    { name: 'Pending',  value: pending,  fill: '#f59e0b' },
    { name: 'Approved', value: approved, fill: '#10b981' },
    { name: 'Rejected', value: rejected, fill: '#ef4444' },
  ];

  const revealRef = useScrollReveal();
  const { push: pushNotif } = useNotificationCenter();
  // Track previous statuses to detect changes
  const prevStatusMap = useRef({});

  // Poll every 30s for status changes on user's referrals
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await client.get('/referrals', { params: { page: 1, limit: 50 } });
        const latest = res.data.data ?? [];
        latest.forEach((r) => {
          const prev = prevStatusMap.current[r._id];
          if (prev && prev !== r.status) {
            if (r.status === 'approved') {
              pushNotif({
                target: user?.role || 'user',
                type: 'admission_confirmed',
                title: '🎉 Admission Confirmed!',
                message: `Your referral for ${r.studentName} (${r.course}) has been approved! Credits awarded.`,
                studentName: r.studentName,
                course: r.course,
                link: '/status',
              });
            } else if (r.status === 'rejected') {
              pushNotif({
                target: user?.role || 'user',
                type: 'admission_rejected',
                title: 'Referral Rejected',
                message: `Your referral for ${r.studentName} (${r.course}) has been rejected.`,
                studentName: r.studentName,
                course: r.course,
                link: '/status',
              });
            }
          }
          prevStatusMap.current[r._id] = r.status;
        });
      } catch { /* silent */ }
    }, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f0f2f9] dark:bg-[#0f1117]">
      <Sidebar />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <TopBar title="My Dashboard" subtitle={`Welcome back, ${user?.name}`} />

        <main className="flex-1 p-4 sm:p-6 space-y-6" ref={revealRef}>

          {/* Header */}
          <div className="flex items-center justify-between mb-8 animate-slide-up">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Dashboard</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Welcome back, <span className="font-medium text-indigo-600 dark:text-indigo-400">{user?.name}</span>
              </p>
              {user?.referralId && (
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs text-gray-400 dark:text-gray-500">Referral ID:</span>
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-800">
                    {user.referralId}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">Credits:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {user?.credits ?? 0} pts
                  </span>
                </div>
              )}
            </div>
            <Link to="/submit"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-glow hover:from-indigo-700 hover:to-purple-700 transition-all">
              + New Referral
            </Link>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: 'Total Referred',  value: total,    icon: '📋', gradient: 'bg-gradient-to-br from-[#1e2a78] to-[#3b4fd8]' },
              { label: 'Pending',         value: pending,  icon: '⏳', gradient: 'bg-gradient-to-br from-amber-500 to-orange-500' },
              { label: 'Approved',        value: approved, icon: '✅', gradient: 'bg-gradient-to-br from-emerald-500 to-teal-500' },
              { label: 'Rejected',        value: rejected, icon: '❌', gradient: 'bg-gradient-to-br from-rose-500 to-pink-600' },
            ].map(({ label, value, icon, gradient }) => (
              <div key={label} className={`rounded-2xl p-5 text-white shadow-lg relative overflow-hidden card-hover ripple-btn ${gradient} animate-slide-up`}>
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white/10 -translate-y-6 translate-x-6" />
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl mb-3 animate-float-up">{icon}</div>
                  <AnimatedCounter target={value} className="text-3xl font-black block" />
                  <p className="text-white/80 text-sm mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Bar chart */}
            <div className="xl:col-span-2 bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-card dark:shadow-card-dark border border-gray-100 dark:border-white/5 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900 dark:text-white">Referral Status Overview</h3>
                <Link to="/submit"
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
                  + New Referral
                </Link>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f5f5ff' }} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  <Bar dataKey="value" name="Count" radius={[8, 8, 0, 0]}>
                    {barData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick actions */}
            <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-card dark:shadow-card-dark border border-gray-100 dark:border-white/5 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {[
                  { to: '/submit', icon: '➕', label: 'Submit New Referral', desc: 'Refer a new candidate', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
                  { to: '/status', icon: '🔍', label: 'Check Status',        desc: 'Look up by Aadhaar',   color: 'bg-blue-50 text-blue-700 border-blue-100' },
                ].map(({ to, icon, label, desc, color }) => (
                  <Link key={to} to={to}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all hover:shadow-sm ${color}`}>
                    <span className="text-xl">{icon}</span>
                    <div>
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="text-xs opacity-70">{desc}</p>
                    </div>
                    <svg className="w-4 h-4 ml-auto opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                ))}
              </div>

              {/* Progress */}
              {total > 0 && (
                <div className="mt-5 pt-5 border-t border-gray-50">
                  <p className="text-xs font-semibold text-gray-500 mb-3">Approval Progress</p>
                  {[
                    { label: 'Approved', value: approved, total, color: 'bg-emerald-500' },
                    { label: 'Pending',  value: pending,  total, color: 'bg-amber-400' },
                    { label: 'Rejected', value: rejected, total, color: 'bg-red-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="mb-2.5">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500 dark:text-gray-400">{label}</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-200">{total > 0 ? Math.round((value / total) * 100) : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className={`${color} h-1.5 rounded-full transition-all duration-700`}
                          style={{ width: `${total > 0 ? (value / total) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Referrals table */}
          <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-card dark:shadow-card-dark border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">My Referrals</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{total} total</p>
              </div>
            </div>

            {loading ? <TableSkeleton rows={6} cols={5} /> : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/80 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                        {['Student', 'Aadhaar', 'Course', 'Status', 'Date'].map((h) => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                      {referrals.length === 0 ? (
                        <tr><td colSpan={5} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <span className="text-5xl">🎓</span>
                            <p className="text-gray-400 font-medium">No referrals yet</p>
                            <Link to="/submit" className="text-indigo-600 text-sm font-semibold hover:underline">Submit your first referral →</Link>
                          </div>
                        </td></tr>
                      ) : referrals.map((r, i) => (
                        <tr key={r._id} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/20 transition-colors animate-fade-in" style={{ animationDelay: `${i * 25}ms` }}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {r.studentName?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{r.studentName}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">{r.contactDetails?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-gray-400 dark:text-gray-500 text-xs">{r.aadhaar}</td>
                          <td className="px-5 py-3.5">
                            <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-lg">{r.course}</span>
                          </td>
                          <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                          <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">{fmt(r.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {total > LIMIT && (
                  <div className="px-5 border-t border-gray-50">
                    <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
