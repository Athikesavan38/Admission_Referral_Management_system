import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [tab, setTab]       = useState('user'); // 'admin' | 'user'
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  }

  function switchTab(t) {
    setTab(t);
    setForm({ email: '', password: '' });
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = tab === 'admin' ? '/auth/login/admin' : '/auth/login/user';
      const { data } = await client.post(endpoint, form);
      login(data.token, data.user);
      navigate(data.user.role === 'admin' ? '/dashboard/admin' : '/dashboard/referrer');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const isAdmin = tab === 'admin';

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-10 relative overflow-hidden bg-gradient-to-br from-[#1e2a78] via-[#2d3a9e] to-[#4f46e5]">
        {/* Decorative circles */}
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full bg-white/5" />

        <div className="relative z-10 text-center animate-slide-up max-w-md w-full">

          {/* CIET Logo + College Name */}
          <div className="flex flex-col items-center mb-8">
            {/* Logo card */}
            <div className="w-40 h-40 rounded-2xl bg-white flex items-center justify-center shadow-2xl border-4 border-white/30 mb-5 overflow-hidden">
              <img
                src="/ciet-logo.png"
                alt="CIET Logo"
                className="w-full h-full object-contain"
                onError={(e) => { e.target.onerror = null; e.target.src = '/ciet-logo.svg'; }}
              />
            </div>

            {/* College name */}
            <h1 className="text-xl font-black text-white leading-tight tracking-wide uppercase text-center px-2">
              Coimbatore Institute of<br />Engineering and Technology
            </h1>
            <p className="text-sky-300 font-bold text-sm mt-1 tracking-widest uppercase">Coimbatore</p>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4 w-full px-4">
              <div className="flex-1 h-px bg-white/20" />
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <div className="flex-1 h-px bg-white/20" />
            </div>

            {/* Accreditation badges */}
            <div className="flex flex-wrap justify-center gap-2 px-2">
              {[
                { label: 'Autonomous Institution', icon: '🏛️' },
                { label: "NAAC 'A' Grade",         icon: '⭐' },
                { label: 'AICTE Approved',          icon: '✅' },
                { label: 'Anna University',         icon: '🎓' },
              ].map(({ label, icon }) => (
                <span key={label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white/90 text-xs font-semibold">
                  <span>{icon}</span>{label}
                </span>
              ))}
            </div>

            {/* Full accreditation text */}
            <p className="text-white/40 text-[10px] mt-3 leading-relaxed text-center px-4 uppercase tracking-wide">
              An Autonomous Institution | Accredited by NAAC with 'A' Grade |<br />
              Approved by AICTE | Affiliated to Anna University
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6 px-4">
            <div className="flex-1 h-px bg-white/15" />
            <span className="text-white/40 text-xs font-medium uppercase tracking-widest">Light The Light Within</span>
            <div className="flex-1 h-px bg-white/15" />
          </div>

          {/* Feature list */}
          <div className="space-y-2.5 text-left px-2">
            {[
              { icon: '🔐', text: 'From a new Face today to a future leader tomorrow - your journey starts here' },
              { icon: '📋', text: 'Step in with confidence, learn with passion and leave with purpose' },
              { icon: '📊', text: 'You walked in with dreams in your eyes - walk out with fire in your soul' },
              { icon: '🔍', text: 'Dare to begin' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-white/70 text-sm">
                <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-sm flex-shrink-0">{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-[#f0f2f9] dark:bg-[#0f1117] px-6 py-12">
        <div className="w-full max-w-md animate-slide-up">

          {/* Tab switcher */}
          <div className="flex bg-white dark:bg-[#1a1d2e] rounded-2xl p-1.5 shadow-card dark:shadow-card-dark border border-gray-100 dark:border-white/5 mb-6">
            <TabBtn active={!isAdmin} onClick={() => switchTab('user')}
              icon="👤" label="User Login" desc="Referrers & Staff" />
            <TabBtn active={isAdmin} onClick={() => switchTab('admin')}
              icon="🛡️" label="Admin Login" desc="Administrators only" admin />
          </div>

          {/* Form card */}
          <div className={`bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-card dark:shadow-card-dark border overflow-hidden transition-all duration-300 ${isAdmin ? 'border-indigo-200 dark:border-indigo-700' : 'border-gray-100 dark:border-white/5'}`}>
            {/* Card header */}
            <div className={`px-8 py-5 border-b ${isAdmin ? 'bg-gradient-to-r from-[#1e2a78] to-[#3b4fd8] border-indigo-700' : 'bg-white border-gray-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow ${isAdmin ? 'bg-white/20' : 'bg-indigo-50'}`}>
                  {isAdmin ? '🛡️' : '👤'}
                </div>
                <div>
                  <h2 className={`text-lg font-bold ${isAdmin ? 'text-white' : 'text-gray-900'}`}>
                    {isAdmin ? 'Administrator Login' : 'User Login'}
                  </h2>
                  <p className={`text-xs ${isAdmin ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {isAdmin ? 'Restricted to authorised admins only' : 'For referrers, faculty, alumni & consultants'}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-white dark:bg-[#1a1d2e]">
              {/* Admin notice */}
              {isAdmin && (
                <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs animate-fade-in">
                  <span className="text-base mt-0.5">⚠️</span>
                  <p>This login is exclusively for system administrators. Unauthorised access attempts are logged.</p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mb-5 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-slide-in-right">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAdmin ? 'Admin Email' : 'Email Address'}
                  </label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} required
                    placeholder={isAdmin ? 'admin@example.com' : 'you@example.com'}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all
                      ${isAdmin ? 'border-indigo-200 dark:border-indigo-700 bg-white dark:bg-[#0f1117] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-indigo-400' : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1117] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-indigo-400'}`} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} required
                      placeholder="••••••••"
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 transition-all
                        ${isAdmin ? 'border-indigo-200 dark:border-indigo-700 bg-white dark:bg-[#0f1117] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-indigo-400' : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1117] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-indigo-400'}`} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-300">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        {showPass
                          ? <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          : <><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>
                        }
                      </svg>
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 shadow-md flex items-center justify-center gap-2 mt-2
                    ${isAdmin
                      ? 'bg-gradient-to-r from-[#1e2a78] to-[#3b4fd8] hover:from-[#16205e] hover:to-[#2d3ab0] text-white hover:shadow-glow'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white hover:shadow-glow'
                    } disabled:opacity-60`}>
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</>
                    : <>{isAdmin ? '🛡️' : '→'} {isAdmin ? 'Access Admin Panel' : 'Sign In'}</>
                  }
                </button>
              </form>

              {!isAdmin && (
                <p className="mt-5 text-sm text-gray-500 dark:text-gray-400 text-center">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-indigo-600 font-semibold hover:underline">Create one</Link>
                </p>
              )}
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
            {isAdmin
              ? 'Admin credentials are provided by the system administrator.'
              : 'Admin? Use the Admin Login tab above.'}
          </p>
          <p className="text-center text-[10px] text-gray-300 dark:text-gray-600 mt-3 font-medium tracking-wide">
            © {new Date().getFullYear()} <span className="font-bold text-gray-400 dark:text-gray-500">TECH BROTHERS</span> · All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label, desc, admin }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all duration-200 text-left
        ${active
          ? admin
            ? 'bg-gradient-to-r from-[#1e2a78] to-[#3b4fd8] text-white shadow-md'
            : 'bg-indigo-600 text-white shadow-md'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}>
      <span className="text-xl">{icon}</span>
      <div>
        <p className={`text-sm font-bold leading-tight ${active ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}>{label}</p>
        <p className={`text-[10px] ${active ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`}>{desc}</p>
      </div>
    </button>
  );
}
