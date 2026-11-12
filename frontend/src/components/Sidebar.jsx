import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DarkModeToggle from './DarkModeToggle';

const ROLE_LABELS = {
  admin: 'Administrator',
  student_referrer: 'Student Referrer',
  faculty: 'Faculty',
  alumni: 'Alumni',
  external_consultant: 'Consultant',
};

function NavItem({ to, icon, label, end, onClick }) {
  return (
    <NavLink to={to} end={end} onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
        ${isActive
          ? 'bg-white/20 text-white shadow-inner font-semibold backdrop-blur-sm border border-white/20'
          : 'text-indigo-100 hover:bg-white/10 hover:text-white'}`
      }>
      <span className="text-base leading-none">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = ({ onNav }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden">
            <img
              src="/ciet-logo.png"
              alt="CIET"
              className="w-full h-full object-contain"
              onError={(e) => { e.target.onerror = null; e.target.src = '/ciet-logo.svg'; }}
            />
          </div>
          <div>
            <p className="text-white font-black text-xs leading-tight uppercase tracking-wide">CIET</p>
            <p className="text-indigo-200 text-[9px] leading-tight">Admission Referral Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="section-label">Main</p>
        {isAdmin
          ? <NavItem to="/dashboard/admin" icon="📊" label="Dashboard" end onClick={onNav} />
          : <NavItem to="/dashboard/referrer" icon="📊" label="Dashboard" end onClick={onNav} />
        }

        <p className="section-label mt-5">Referrals</p>
        {!isAdmin && <NavItem to="/submit" icon="➕" label="Submit Referral" onClick={onNav} />}
        <NavItem to="/status" icon="🔍" label="Check Status" onClick={onNav} />
        <NavItem to="/leaderboard" icon="🏆" label="Leaderboard" onClick={onNav} />

        {isAdmin && (
          <>
            <p className="section-label mt-5">Administration</p>
            <NavItem to="/dashboard/admin" icon="📋" label="All Referrals" onClick={onNav} />
          </>
        )}
      </nav>

      {/* Dark mode + user */}
      <div className="px-3 py-4 border-t border-white/10 space-y-3">
        <div className="flex items-center justify-between px-3">
          <span className="text-xs text-indigo-200 font-medium">Dark Mode</span>
          <DarkModeToggle />
        </div>
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/10 backdrop-blur border border-white/10">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-indigo-300 text-xs truncate">{ROLE_LABELS[user?.role]}</p>
          </div>
          <button onClick={logout} title="Logout"
            className="text-indigo-300 hover:text-red-300 transition-colors p-1.5 rounded-lg hover:bg-white/10">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Copyright footer */}
      <div className="px-3 py-3 border-t border-white/10 text-center">
        <p className="text-[10px] text-indigo-300/60 font-medium tracking-wide">
          © {new Date().getFullYear()} <span className="font-bold text-indigo-200/80">TECH BROTHERS</span>
        </p>
        <p className="text-[9px] text-indigo-300/40 mt-0.5">All rights reserved</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-64 flex-col z-40 shadow-2xl
        bg-gradient-to-b from-[#1e2a78] to-[#2d3a9e]">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger */}
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 h-full flex flex-col shadow-2xl animate-slide-in-left
            bg-gradient-to-b from-[#1e2a78] to-[#2d3a9e]">
            <button onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <SidebarContent onNav={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
