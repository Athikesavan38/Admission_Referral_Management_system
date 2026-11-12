import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import AnimatedCounter from '../components/AnimatedCounter';
import client from '../api/client';

const ROLE_LABELS = {
  student_referrer:    'Student Referrer',
  faculty:             'Faculty',
  alumni:              'Alumni',
  external_consultant: 'External Consultant',
};

const ROLE_COLORS = {
  student_referrer:    'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  faculty:             'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  alumni:              'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  external_consultant: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
};

const RANK_STYLES = [
  'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg',   // 1st
  'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-md',      // 2nd
  'bg-gradient-to-br from-orange-400 to-amber-600 text-white shadow-md',   // 3rd
];

const RANK_ICONS = ['🥇', '🥈', '🥉'];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

export default function Leaderboard() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('highest');
  const [year, setYear]         = useState(CURRENT_YEAR);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const res = await client.get('/referrals/leaderboard', { params: { filter, year } });
        setData(res.data);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    fetch();
  }, [filter, year]);

  const top3    = data?.leaderboard?.slice(0, 3) ?? [];
  const rest    = data?.leaderboard?.slice(3)    ?? [];
  const topYear = data?.topOfYear;

  return (
    <div className="flex min-h-screen bg-[#f0f2f9] dark:bg-[#0f1117]">
      <Sidebar />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <TopBar title="Leaderboard" subtitle="Credit rankings for all referrers" />

        <main className="flex-1 p-4 sm:p-6 space-y-6">

          {/* Top of year banner */}
          {topYear && topYear.yearReferrals > 0 && (
            <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 rounded-2xl p-5 flex items-center gap-4 shadow-lg animate-slide-up">
              <span className="text-4xl">🏆</span>
              <div className="flex-1">
                <p className="text-white/80 text-xs font-semibold uppercase tracking-widest">Top Referrer of {year}</p>
                <p className="text-white text-xl font-black">{topYear.name}</p>
                <p className="text-white/80 text-sm">{topYear.yearReferrals} referrals this year · {topYear.credits} total credits</p>
              </div>
              <div className="hidden sm:flex flex-col items-center bg-white/20 rounded-xl px-4 py-3">
                <p className="text-white text-2xl font-black">{topYear.yearReferrals}</p>
                <p className="text-white/80 text-xs">Referrals {year}</p>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-up">
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">Credit Rankings</h2>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                First referral = 20 credits · Each subsequent = 10 credits
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Year selector */}
              <select value={year} onChange={(e) => setYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-[#1a1d2e] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>

              {/* Filter tabs */}
              <div className="flex bg-white dark:bg-[#1a1d2e] rounded-xl p-1 gap-1 border border-gray-100 dark:border-white/5 shadow-sm">
                {[
                  { value: 'highest', label: '⬆️ Highest', color: 'text-emerald-700' },
                  { value: 'lowest',  label: '⬇️ Lowest',  color: 'text-amber-700'   },
                  { value: 'none',    label: '⭕ No Credits', color: 'text-gray-500'  },
                ].map(({ value, label }) => (
                  <button key={value} onClick={() => setFilter(value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                      ${filter === value
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-900" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
              </div>
            </div>
          ) : data?.leaderboard?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="text-5xl">🏅</span>
              <p className="text-gray-400 dark:text-gray-500 font-medium">No referrers found for this filter</p>
            </div>
          ) : (
            <>
              {/* Top 3 podium */}
              {filter === 'highest' && top3.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
                  {top3.map((u, i) => (
                    <div key={u._id}
                      className={`relative rounded-2xl p-5 text-center overflow-hidden
                        ${i === 0
                          ? 'bg-gradient-to-br from-[#1e2a78] to-[#3b4fd8] text-white shadow-xl sm:order-2 sm:-mt-4'
                          : 'bg-white dark:bg-[#1a1d2e] border border-gray-100 dark:border-white/5 shadow-card'
                        }`}>
                      {/* Rank badge */}
                      <div className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-lg font-black
                        ${RANK_STYLES[i] || 'bg-gray-100 text-gray-600'}`}>
                        {i < 3 ? RANK_ICONS[i] : `#${u.rank}`}
                      </div>

                      {/* Avatar */}
                      <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-black shadow-lg
                        ${i === 0 ? 'bg-white/20 text-white' : 'bg-gradient-to-br from-indigo-400 to-purple-500 text-white'}`}>
                        {u.name[0].toUpperCase()}
                      </div>

                      <p className={`font-bold text-base ${i === 0 ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{u.name}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold
                        ${i === 0 ? 'bg-white/20 text-white' : ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>

                      <div className={`mt-3 pt-3 border-t ${i === 0 ? 'border-white/20' : 'border-gray-100 dark:border-white/5'}`}>
                        <p className={`text-3xl font-black ${i === 0 ? 'text-yellow-300' : 'text-indigo-600 dark:text-indigo-400'}`}>
                          {u.credits}
                        </p>
                        <p className={`text-xs ${i === 0 ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`}>credits</p>
                        <p className={`text-xs mt-1 ${i === 0 ? 'text-white/60' : 'text-gray-400 dark:text-gray-500'}`}>
                          {u.totalReferrals} referral{u.totalReferrals !== 1 ? 's' : ''}
                        </p>
                      </div>

                      {u.referralId && (
                        <p className={`text-[10px] mt-2 font-mono ${i === 0 ? 'text-white/50' : 'text-gray-300 dark:text-gray-600'}`}>
                          {u.referralId}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Full table */}
              <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-card dark:shadow-card-dark border border-gray-100 dark:border-white/5 overflow-hidden animate-fade-in">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/80 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                        {['Rank', 'Referrer', 'Role', 'Referral ID', 'Total Referrals', `${year} Referrals`, 'Credits'].map((h) => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                      {(filter === 'highest' ? rest : data.leaderboard).map((u, i) => {
                        const rank = filter === 'highest' ? i + 4 : i + 1;
                        return (
                          <tr key={u._id} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors animate-fade-in"
                            style={{ animationDelay: `${i * 20}ms` }}>
                            <td className="px-5 py-3.5">
                              <span className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                                #{rank}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {u.name[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{u.name}</p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                                {ROLE_LABELS[u.role] || u.role}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-xs text-gray-400 dark:text-gray-500">
                              {u.referralId || '—'}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <span className="font-semibold text-gray-700 dark:text-gray-200">{u.totalReferrals}</span>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{u.yearReferrals}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className={`text-lg font-black ${u.credits > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-300 dark:text-gray-600'}`}>
                                  {u.credits}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">pts</span>
                                {u.credits > 0 && (
                                  <div className="flex-1 max-w-[80px]">
                                    <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-1.5">
                                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full"
                                        style={{ width: `${Math.min(100, (u.credits / (data.leaderboard[0]?.credits || 1)) * 100)}%` }} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
