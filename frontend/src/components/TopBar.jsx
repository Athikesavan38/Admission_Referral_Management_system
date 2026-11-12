import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DarkModeToggle from './DarkModeToggle';
import NotificationBar from './NotificationBar';
import SmartSearch from './SmartSearch';

export default function TopBar({ title, subtitle }) {
  const { user } = useAuth();

  return (
    <header className="h-16 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6
      bg-white/80 dark:bg-[#0f1117]/80 backdrop-blur-md
      border-b border-gray-200/60 dark:border-white/5 shadow-sm">

      {/* Left — title (hidden on mobile since hamburger is there) */}
      <div className="hidden lg:block">
        <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
      </div>

      {/* Mobile title */}
      <div className="lg:hidden pl-12">
        <h1 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Smart Search */}
        <div className="hidden md:block">
          <SmartSearch />
        </div>

        {/* Dark mode toggle */}
        <DarkModeToggle compact />

        {/* Notification bell */}
        <NotificationBar />

        {/* Avatar */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="hidden xl:block">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">{user?.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[140px]">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
