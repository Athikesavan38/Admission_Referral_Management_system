import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getFileUrl } from '../../utils/fileUrl';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from 'recharts';
import Sidebar from '../../components/Sidebar';
import TopBar from '../../components/TopBar';
import Pagination from '../../components/shared/Pagination';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import TableSkeleton from '../../components/shared/TableSkeleton';
import AnimatedCounter from '../../components/AnimatedCounter';
import client from '../../api/client';
import { useDebounce } from '../../hooks/useDebounce';
import { useRipple } from '../../hooks/useRipple';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { useNotificationCenter } from '../../context/NotificationContext';

const LIMIT = 10;
const INIT = { status: '', course: '', startDate: '', endDate: '', search: '' };
const PIE_COLORS = ['#f59e0b', '#10b981', '#ef4444'];

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function StatCard({ label, value, icon, gradient, change }) {
  return (
    <div className={`rounded-2xl p-5 text-white shadow-lg relative overflow-hidden cursor-default card-hover ripple-btn ${gradient} animate-slide-up`}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white/10 translate-y-6 -translate-x-4" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-2xl shadow animate-float-up">
            {icon}
          </div>
          {change !== undefined && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm">
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
            </span>
          )}
        </div>
        <AnimatedCounter target={value} className="text-3xl font-black block" />
        <p className="text-white/80 text-sm font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function SectionCard({ title, children, action }) {
  return (
    <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-card dark:shadow-card-dark border border-gray-100 dark:border-white/5 overflow-hidden card-hover">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-white/5">
        <h3 className="font-bold text-gray-900 dark:text-white text-base">{title}</h3>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters]     = useState({ ...INIT, search: searchParams.get('search') || '' });
  const [applied, setApplied]     = useState({ ...INIT, search: searchParams.get('search') || '' });
  const [referrals, setReferrals] = useState([]);
  const [total, setTotal]         = useState(0);
  const [stats, setStats]         = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [chartData, setChartData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Debounce search — only fires API call 400ms after user stops typing
  const debouncedSearch = useDebounce(filters.search, 400);
  useEffect(() => {
    setApplied((prev) => ({ ...prev, search: debouncedSearch }));
    setPage(1);
  }, [debouncedSearch]);

  const fetchReferrals = useCallback(async (pg, f) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: LIMIT };
      Object.entries(f).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await client.get('/referrals', { params });
      setReferrals(res.data.data ?? []);
      setTotal(res.data.total ?? 0);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const [all, pend, appr, rej] = await Promise.all([
        client.get('/referrals', { params: { page: 1, limit: 1 } }),
        client.get('/referrals', { params: { page: 1, limit: 1, status: 'pending' } }),
        client.get('/referrals', { params: { page: 1, limit: 1, status: 'approved' } }),
        client.get('/referrals', { params: { page: 1, limit: 1, status: 'rejected' } }),
      ]);
      const t = all.data.total, p = pend.data.total, a = appr.data.total, r = rej.data.total;
      setStats({ total: t, pending: p, approved: a, rejected: r });
      setChartData([
        { name: 'Pending',  value: p, fill: '#f59e0b' },
        { name: 'Approved', value: a, fill: '#10b981' },
        { name: 'Rejected', value: r, fill: '#ef4444' },
      ]);
      // Simulated trend (last 6 months relative to totals)
      const months = ['Jan','Feb','Mar','Apr','May','Jun'];
      setTrendData(months.map((m, i) => ({
        month: m,
        referrals: Math.max(1, Math.round((t / 6) * (0.5 + i * 0.1 + Math.random() * 0.4))),
        approved:  Math.max(0, Math.round((a / 6) * (0.4 + i * 0.12 + Math.random() * 0.3))),
      })));
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchReferrals(page, applied); }, [page, applied, fetchReferrals]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Poll for new referrals every 30s and notify admin
  useEffect(() => {
    let prevTotal = -1; // -1 means not yet initialised
    const interval = setInterval(async () => {
      try {
        const res = await client.get('/referrals', { params: { page: 1, limit: 1 } });
        const newTotal = res.data.total ?? 0;
        if (prevTotal > 0 && newTotal > prevTotal) {
          const diff = newTotal - prevTotal;
          pushNotif({
            target: 'admin',
            type: 'new_referral',
            title: `${diff} New Referral${diff > 1 ? 's' : ''} Received`,
            message: `${diff} new referral${diff > 1 ? 's have' : ' has'} been submitted and awaiting review.`,
            link: '/status',
          });
        }
        prevTotal = newTotal;
      } catch { /* silent */ }
    }, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyTab(tab) {
    setActiveTab(tab);
    const f = { ...INIT, status: tab === 'all' ? '' : tab };
    setFilters(f); setApplied(f); setPage(1);
  }

  async function updateStatus(aadhaar, status) {
    try {
      await client.put('/referrals/status', { aadhaar, status });
      fetchReferrals(page, applied);
      fetchStats();

      // Find the referral to get student name
      const r = referrals.find((x) => x.aadhaar === aadhaar);
      const studentName = r?.studentName || 'Student';

      if (status === 'approved') {
        // Push to the referrer's role — SSE handles real-time delivery
        pushNotif({
          target: r?.referredBy?.role || 'user',
          type: 'admission_confirmed',
          title: '🎉 Admission Confirmed!',
          message: `${studentName}'s referral for ${r?.course} has been approved! Credits have been awarded.`,
          studentName,
          course: r?.course,
          link: '/status',
        });
        pushNotif({
          target: 'admin',
          type: 'admission_confirmed',
          title: 'Referral Approved',
          message: `You approved ${studentName}'s referral.`,
          studentName,
          referrerName: r?.referredBy?.name || '—',
          referrerRole: r?.referredBy?.role || 'unknown',
          course: r?.course,
          link: '/status',
        });
      } else {
        pushNotif({
          target: r?.referredBy?.role || 'user',
          type: 'admission_rejected',
          title: 'Referral Rejected',
          message: `${studentName}'s referral for ${r?.course} has been rejected.`,
          studentName,
          course: r?.course,
          link: '/status',
        });
        pushNotif({
          target: 'admin',
          type: 'admission_rejected',
          title: 'Referral Rejected',
          message: `You rejected ${studentName}'s referral.`,
          studentName,
          referrerName: r?.referredBy?.name || '—',
          referrerRole: r?.referredBy?.role || 'unknown',
          course: r?.course,
          link: '/status',
        });
      }
    } catch { alert('Failed to update status.'); }
  }

  async function exportCSV() {
    try {
      const params = {};
      Object.entries(applied).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await client.get('/referrals/export', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'referrals.csv'; a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert('Export failed.'); }
  }

  const approvalRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;
  const ripple = useRipple();
  const revealRef = useScrollReveal();
  const { push: pushNotif } = useNotificationCenter();

  return (
    <div className="flex min-h-screen bg-[#f0f2f9] dark:bg-[#0f1117]">
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <TopBar title="Dashboard" subtitle="Admission Referral Portal — Admin View" />

        <main className="flex-1 p-4 sm:p-6 space-y-6" ref={revealRef}>

          {/* Stat cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="Total Referrals" value={stats.total}    icon="📋" gradient="bg-gradient-to-br from-[#1e2a78] to-[#3b4fd8]" change={12} />
            <StatCard label="Pending Review"  value={stats.pending}  icon="⏳" gradient="bg-gradient-to-br from-amber-500 to-orange-500"  change={-3} />
            <StatCard label="Approved"        value={stats.approved} icon="✅" gradient="bg-gradient-to-br from-emerald-500 to-teal-500"   change={8}  />
            <StatCard label="Rejected"        value={stats.rejected} icon="❌" gradient="bg-gradient-to-br from-rose-500 to-pink-600"      change={2}  />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Trend chart */}
            <div className="xl:col-span-2">
              <SectionCard title="Referral Trends"
                action={<span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full border">Last 6 months</span>}>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="refGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="referrals" name="Referrals" stroke="#4f46e5" strokeWidth={2.5} fill="url(#refGrad)" dot={{ r: 4, fill: '#4f46e5' }} />
                    <Area type="monotone" dataKey="approved"  name="Approved"  stroke="#10b981" strokeWidth={2.5} fill="url(#appGrad)" dot={{ r: 4, fill: '#10b981' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </SectionCard>
            </div>

            {/* Pie chart */}
            <SectionCard title="Status Breakdown">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {chartData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                      <span className="text-gray-600 dark:text-gray-300">{d.name}</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">{d.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-gray-500 dark:text-gray-400">Approval Rate</span>
                  <span className="font-bold text-emerald-600">{approvalRate}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${approvalRate}%` }} />
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Referrals table */}
          <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-card dark:shadow-card-dark border border-gray-100 dark:border-white/5 overflow-hidden">
            {/* Table header */}
            <div className="px-6 py-4 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">All Referrals</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{total} total submissions</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Tab filters */}
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                  {['all','pending','approved','rejected'].map((tab) => (
                    <button key={tab} onClick={() => applyTab(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all
                        ${activeTab === tab ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                      {tab}
                    </button>
                  ))}
                </div>
                {/* Search */}
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <input value={filters.search}
                    onChange={(e) => { const f = { ...filters, search: e.target.value }; setFilters(f); setApplied(f); setPage(1); }}
                    placeholder="Search…" className="bg-transparent text-xs text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none w-32" />
                </div>
                <button onClick={ripple(exportCSV)}
                  className="ripple-btn btn-press flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm tooltip" data-tip="Download CSV">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Export CSV
                </button>
              </div>
            </div>

            {loading ? <TableSkeleton rows={8} cols={7} /> : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/80 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                        {['Student', 'Aadhaar', 'Course', 'Referred By', 'Status', 'Date', 'Actions'].map((h) => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                      {referrals.length === 0 ? (
                        <tr><td colSpan={7} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-5xl">📭</span>
                            <p className="text-gray-400 font-medium">No referrals found</p>
                          </div>
                        </td></tr>
                      ) : referrals.map((r, i) => (
                        <tr key={r._id} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/20 transition-colors animate-fade-in" style={{ animationDelay: `${i * 25}ms` }}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 shadow-sm border border-gray-100 dark:border-white/10">
                                {r.photo ? (
                                  <img src={getFileUrl(r.photo)} alt={r.studentName}
                                    loading="lazy" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                    {r.studentName?.[0]?.toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white text-sm">{r.studentName}</p>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <p className="text-xs text-gray-400 dark:text-gray-500">{r.contactDetails?.email}</p>
                                  {r.gender && (
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                                      ${r.gender === 'male' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                        : r.gender === 'female' ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
                                        : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'}`}>
                                      {r.gender.charAt(0).toUpperCase() + r.gender.slice(1)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-gray-400 dark:text-gray-500 text-xs">{r.aadhaar}</td>
                          <td className="px-5 py-3.5">
                            <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-lg">{r.course}</span>
                            {r.cutoffMark && (
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Cutoff: {r.cutoffMark}</p>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                {r.referredBy?.name?.[0]?.toUpperCase() ?? '?'}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-700">{r.referredBy?.name ?? '—'}</p>
                                <p className="text-[10px] text-gray-400 capitalize">{r.referredBy?.role?.replace('_', ' ')}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                          <td className="px-5 py-3.5">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{fmt(r.timestamp)}</p>
                            <p className="text-[10px] text-gray-400">{fmtTime(r.timestamp)}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col gap-1.5">
                              {r.status === 'pending' ? (
                                <div className="flex gap-1.5">
                                  <button onClick={ripple(() => updateStatus(r.aadhaar, 'approved'))}
                                    className="ripple-btn btn-press px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors tooltip"
                                    data-tip="Approve referral">
                                    ✓ Approve
                                  </button>
                                  <button onClick={ripple(() => updateStatus(r.aadhaar, 'rejected'))}
                                    className="ripple-btn btn-press px-2.5 py-1 text-[11px] font-bold bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors tooltip"
                                    data-tip="Reject referral">
                                    ✕ Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-300 dark:text-gray-600 italic">—</span>
                              )}
                              <a href="/status" className="text-[10px] text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-400 font-medium transition-colors">
                                View Details →
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 border-t border-gray-50">
                  <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
                </div>
              </>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
