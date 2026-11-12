import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import StatusBadge from "../components/shared/StatusBadge";
import TableSkeleton from "../components/shared/TableSkeleton";
import Pagination from "../components/shared/Pagination";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useDebounce } from "../hooks/useDebounce";
import { getFileUrl } from "../utils/fileUrl";
const LIMIT = 10;
const ROLE_LABELS = { student_referrer:"Student Referrer", faculty:"Faculty", alumni:"Alumni", external_consultant:"External Consultant", admin:"Admin" };

function fmt(iso) { if (!iso) return "�"; return new Date(iso).toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}); }
function fmtDate(iso) { if (!iso) return "�"; return new Date(iso).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}); }

function DL({ label, value, mono, full }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm text-gray-900 dark:text-white font-medium break-words ${mono ? "font-mono" : ""}`}>{value ?? "�"}</p>
    </div>
  );
}

function UserStatusCard({ r }) {
  const isApproved = r.status === "approved";
  const isRejected = r.status === "rejected";
  return (
    <div className={`border-t animate-slide-up ${isApproved ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800" : isRejected ? "bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-800" : "bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800"}`}>
      <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 ${isApproved ? "bg-emerald-100 dark:bg-emerald-900/40" : isRejected ? "bg-red-100 dark:bg-red-900/40" : "bg-amber-100 dark:bg-amber-900/40"}`}>
          {isApproved ? "??" : isRejected ? "?" : "?"}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <p className="font-bold text-gray-900 dark:text-white">{r.studentName}</p>
            <StatusBadge status={r.status} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{r.course}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Submitted: {fmtDate(r.timestamp)}</p>
          {isRejected && r.remarks && (
            <div className="mt-3 p-3 rounded-xl bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
              <p className="text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wider mb-1">Rejection Remarks</p>
              <p className="text-sm text-red-800 dark:text-red-200">{r.remarks}</p>
            </div>
          )}
          {isApproved && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">Your referral has been approved! Credits have been awarded.</p>
              {r.remarks && <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">{r.remarks}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Full detail card for admin ────────────────────────────────────────────────
function AdminDetailCard({ r, onStatusUpdate }) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isPdf = (d) => d.endsWith('.pdf');
  const isImg = (d) => /\.(jpg|jpeg|png|webp)$/i.test(d);

  async function handleAction(status) {
    if (status === 'rejected' && !remarks.trim()) { setError('Remarks are required for rejection.'); return; }
    setSaving(true); setError('');
    try {
      await client.put('/referrals/status', { aadhaar: r.aadhaar, status, remarks: remarks.trim() || undefined });
      setShowRejectModal(false); setShowApproveModal(false); setRemarks('');
      onStatusUpdate();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status.');
    } finally { setSaving(false); }
  }

  return (
    <div className="border-t border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/3 animate-slide-up">
      {/* Full details grid */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Photo + status */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-64 h-64 rounded-3xl overflow-hidden border-4 border-indigo-100 dark:border-indigo-800 shadow-2xl bg-gray-100 dark:bg-white/10">
            {r.photo ? <img src={getFileUrl(r.photo)} alt={r.studentName} loading="lazy" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-8xl">👤</div>}
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-900 dark:text-white text-sm">{r.studentName}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">{r.aadhaar}</p>
            <div className="mt-2"><StatusBadge status={r.status} /></div>
          </div>
          {/* Action buttons */}
          {r.status === 'pending' && (
            <div className="flex gap-2 mt-1">
              <button onClick={() => setShowApproveModal(true)}
                className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
                ✓ Approve
              </button>
              <button onClick={() => setShowRejectModal(true)}
                className="px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-sm">
                ✕ Reject
              </button>
            </div>
          )}
          {r.status !== 'pending' && (
            <button onClick={() => r.status === 'approved' ? setShowRejectModal(true) : setShowApproveModal(true)}
              className="mt-1 px-3 py-1.5 text-xs font-bold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
              ✏️ Change Status
            </button>
          )}
        </div>

        {/* Contact + academic */}
        <div className="grid grid-cols-2 gap-3 content-start">
          <DL label="Gender" value={r.gender ? r.gender.charAt(0).toUpperCase() + r.gender.slice(1) : null} />
          <DL label="Phone" value={r.contactDetails?.phone} />
          <DL label="Email" value={r.contactDetails?.email} full />
          {r.contactDetails?.parentsPhone && (
            <DL label="Parent's Contact" value={r.contactDetails.parentsPhone} full />
          )}
          <DL label="Institution" value={r.institution} full />
          <DL label="10th Marks" value={r.marks10} />
          <DL label="12th Marks" value={r.marks12} />
          {r.cutoffMark && <DL label="Cutoff Mark" value={r.cutoffMark} />}
          <DL label="Course" value={r.course} full />
        </div>

        {/* Location + referrer */}
        <div className="grid grid-cols-2 gap-3 content-start">
          <DL label="Country" value={r.country} />
          <DL label="State" value={r.state} />
          <DL label="City" value={r.city} />
          <DL label="Submitted" value={fmtDate(r.timestamp)} />
          <div className="col-span-2 pt-2 border-t border-gray-100 dark:border-white/5">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Referred By</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
                {r.referredBy?.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{r.referredBy?.name ?? '—'}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{ROLE_LABELS[r.referredBy?.role] ?? r.referredBy?.role}</p>
              </div>
            </div>
          </div>
          {r.address && <div className="col-span-2"><DL label="Address" value={r.address} /></div>}
        </div>
      </div>

      {/* Remarks display */}
      {r.remarks && (
        <div className={`mx-5 mb-4 p-3 rounded-xl border text-sm ${r.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">Admin Remarks</p>
          <p>{r.remarks}</p>
        </div>
      )}

      {/* Documents */}
      {r.documents?.length > 0 && (
        <div className="px-5 pb-4">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Documents</p>
          <div className="flex flex-wrap gap-2">
            {r.documents.map((doc, i) => (
              <a key={i} href={getFileUrl(doc)} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-xs font-medium text-gray-600 dark:text-gray-300 group">
                <span>{isPdf(doc) ? '📄' : isImg(doc) ? '🖼️' : '📎'}</span>
                Document {i + 1}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Audit trail */}
      {r.auditTrail?.length > 0 && (
        <div className="px-5 pb-5">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Audit Trail</p>
          <div className="relative pl-5">
            <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-300 to-purple-200 dark:from-indigo-700 dark:to-purple-800" />
            <ol className="space-y-3">
              {r.auditTrail.map((entry, i) => (
                <li key={i} className="relative">
                  <div className="absolute -left-[18px] top-1 w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                    <span className="text-white text-[8px] font-bold">{i + 1}</span>
                  </div>
                  <div className="bg-white dark:bg-white/5 rounded-xl px-3 py-2 border border-gray-100 dark:border-white/10">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">{entry.action}</p>
                    {(entry.previousStatus || entry.newStatus) && (
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <StatusBadge status={entry.previousStatus} />
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                        <StatusBadge status={entry.newStatus} />
                      </div>
                    )}
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{fmt(entry.timestamp)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {showRejectModal && (
        <Modal title="Reject Referral" onClose={() => { setShowRejectModal(false); setRemarks(''); setError(''); }}>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">You are rejecting <strong>{r.studentName}</strong>'s referral. Please provide a reason.</p>
          <textarea value={remarks} onChange={(e) => { setRemarks(e.target.value); setError(''); }}
            placeholder="Enter rejection reason (required)…" rows={4}
            className="w-full px-3 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-[#0f1117] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
          {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={() => handleAction('rejected')} disabled={saving}
              className="flex-1 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 disabled:opacity-60 transition-colors">
              {saving ? 'Rejecting…' : '✕ Confirm Reject'}
            </button>
            <button onClick={() => { setShowRejectModal(false); setRemarks(''); setError(''); }}
              className="px-4 py-2.5 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Approve modal */}
      {showApproveModal && (
        <Modal title="Approve Referral" onClose={() => { setShowApproveModal(false); setRemarks(''); setError(''); }}>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Approve <strong>{r.studentName}</strong>'s referral? You may add optional remarks.</p>
          <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)}
            placeholder="Optional remarks…" rows={3}
            className="w-full px-3 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-[#0f1117] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
          {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={() => handleAction('approved')} disabled={saving}
              className="flex-1 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-60 transition-colors">
              {saving ? 'Approving…' : '✓ Confirm Approve'}
            </button>
            <button onClick={() => { setShowApproveModal(false); setRemarks(''); setError(''); }}
              className="px-4 py-2.5 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
          <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function FilterPill({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium border border-indigo-100 dark:border-indigo-800">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition-colors">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ReferralStatus() {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin';

  const [referrals, setReferrals] = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [expanded, setExpanded]   = useState(null);

  const [nameFilter,   setNameFilter]   = useState('');
  const [dateFilter,   setDateFilter]   = useState('');
  const [deptFilter,   setDeptFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const debouncedName = useDebounce(nameFilter, 400);
  const debouncedDept = useDebounce(deptFilter, 400);

  const fetchReferrals = useCallback(async (pg, f) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: LIMIT };
      if (f.name)   params.search    = f.name;
      if (f.date)   params.startDate = f.date;
      if (f.dept)   params.course    = f.dept;
      if (f.status) params.status    = f.status;
      const res = await client.get('/referrals', { params });
      setReferrals(res.data.data ?? []);
      setTotal(res.data.total ?? 0);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchReferrals(page, { name: debouncedName, date: dateFilter, dept: debouncedDept, status: statusFilter });
  }, [page, debouncedName, dateFilter, debouncedDept, statusFilter, fetchReferrals]);

  function clearFilters() { setNameFilter(''); setDateFilter(''); setDeptFilter(''); setStatusFilter(''); setPage(1); }
  const hasFilters = nameFilter || dateFilter || deptFilter || statusFilter;

  const cols = isAdmin
    ? ['Student', 'Aadhaar', 'Course', 'Referred By', 'Status', 'Date', '']
    : ['Student', 'Aadhaar', 'Course', 'Institution', 'Status', 'Date', ''];

  return (
    <div className="flex min-h-screen bg-[#f0f2f9] dark:bg-[#0f1117]">
      <Sidebar />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <TopBar title="Check Referral Status"
          subtitle={isAdmin ? 'View, approve or reject referrals with remarks' : 'View your referral status and remarks'} />
        <main className="flex-1 p-4 sm:p-6 space-y-5">

          {/* Filter bar */}
          <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-card dark:shadow-card-dark border border-gray-100 dark:border-white/5 p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">🔍 Filter Referrals</h3>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  Clear
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Student Name</label>
                <input value={nameFilter} onChange={(e) => { setNameFilter(e.target.value); setPage(1); }}
                  placeholder="Search by name or email…"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-[#0f1117] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Submitted Date</label>
                <input type="date" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-[#0f1117] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Department / Course</label>
                <input value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
                  placeholder="e.g. B.Tech CSE…"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-[#0f1117] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Status</label>
                <div className="relative">
                  <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-[#0f1117] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all appearance-none">
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                </div>
              </div>
            </div>
            {hasFilters && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                {nameFilter   && <FilterPill label={`Name: "${nameFilter}"`}   onRemove={() => setNameFilter('')} />}
                {dateFilter   && <FilterPill label={`Date: ${dateFilter}`}     onRemove={() => setDateFilter('')} />}
                {deptFilter   && <FilterPill label={`Dept: "${deptFilter}"`}   onRemove={() => setDeptFilter('')} />}
                {statusFilter && <FilterPill label={`Status: ${statusFilter}`} onRemove={() => setStatusFilter('')} />}
              </div>
            )}
          </div>

          {/* Results table */}
          <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-card dark:shadow-card-dark border border-gray-100 dark:border-white/5 overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                  {isAdmin ? 'All Referred Students' : 'My Referred Students'}
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{total} student{total !== 1 ? 's' : ''} found{hasFilters ? ' (filtered)' : ''}</p>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/5 px-3 py-1 rounded-full border border-gray-100 dark:border-white/10">
                Click a row to {isAdmin ? 'view details & take action' : 'view status & remarks'}
              </span>
            </div>

            {loading ? <TableSkeleton rows={6} cols={7} /> : referrals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <span className="text-5xl">📭</span>
                <p className="text-gray-400 dark:text-gray-500 font-medium">No referrals found</p>
                {hasFilters && <p className="text-xs text-gray-300 dark:text-gray-600">Try adjusting your filters</p>}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/80 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                        {cols.map((h) => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {referrals.map((r, i) => (
                        <React.Fragment key={r._id}>
                          <tr key={r._id}
                            onClick={() => setExpanded(expanded === r._id ? null : r._id)}
                            className={`cursor-pointer transition-all border-b border-gray-50 dark:border-white/5 animate-fade-in
                              ${expanded === r._id ? 'bg-indigo-50/60 dark:bg-indigo-900/20' : 'hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10'}`}
                            style={{ animationDelay: `${i * 20}ms` }}>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-gray-100 dark:border-white/10 shadow-sm">
                                  {r.photo ? <img src={getFileUrl(r.photo)} alt={r.studentName} loading="lazy" className="w-full h-full object-cover" />
                                    : <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">{r.studentName?.[0]?.toUpperCase()}</div>}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{r.studentName}</p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500">{r.contactDetails?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-gray-400 dark:text-gray-500 text-xs">{r.aadhaar}</td>
                            <td className="px-5 py-3.5">
                              <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-lg">{r.course}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              {isAdmin ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">{r.referredBy?.name?.[0]?.toUpperCase() ?? '?'}</div>
                                  <div>
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{r.referredBy?.name ?? '—'}</p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500">{ROLE_LABELS[r.referredBy?.role] ?? r.referredBy?.role}</p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-600 dark:text-gray-300">{r.institution ?? '—'}</p>
                              )}
                            </td>
                            <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                            <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">{fmtDate(r.timestamp)}</td>
                            <td className="px-5 py-3.5">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${expanded === r._id ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rotate-180' : 'bg-gray-100 dark:bg-white/10 text-gray-400'}`}>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                              </div>
                            </td>
                          </tr>
                          {expanded === r._id && (
                            <tr key={`${r._id}-exp`}>
                              <td colSpan={7} className="p-0">
                                {isAdmin
                                  ? <AdminDetailCard r={r} onStatusUpdate={() => { fetchReferrals(page, { name: debouncedName, date: dateFilter, dept: debouncedDept, status: statusFilter }); }} />
                                  : <UserStatusCard r={r} />
                                }
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
                {total > LIMIT && (
                  <div className="px-5 border-t border-gray-100 dark:border-white/5">
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
