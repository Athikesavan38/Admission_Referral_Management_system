import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'student_referrer', label: 'Student Referrer', icon: '🎓' },
  { value: 'faculty', label: 'Faculty', icon: '👨‍🏫' },
  { value: 'alumni', label: 'Alumni', icon: '🏅' },
  { value: 'external_consultant', label: 'External Consultant', icon: '💼' },
];

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student_referrer' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setFieldErrors({});
    setLoading(true);
    try {
      const { data } = await client.post('/auth/register', form);
      login(data.token, data.user);
      navigate(data.user.role === 'admin' ? '/dashboard/admin' : '/dashboard/referrer');
    } catch (err) {
      const res = err.response?.data;
      if (res?.details?.length) {
        const mapped = {};
        res.details.forEach((d) => { if (d.path) mapped[d.path] = d.msg; });
        setFieldErrors(mapped);
      } else {
        setError(res?.error || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-500 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-[-60px] right-[-60px] w-56 h-56 rounded-full bg-white/10" />
        <div className="absolute bottom-[-80px] left-[-40px] w-72 h-72 rounded-full bg-white/10" />
        <div className="relative z-10 text-center animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-5 shadow-xl">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Join the Portal</h1>
          <p className="text-white/70 text-sm max-w-xs mx-auto">Create your account and start referring talented students today.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-[#f0f2f9] dark:bg-[#0f1117] px-6 py-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-card dark:shadow-card-dark p-8 border border-gray-100 dark:border-white/5">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create account</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Fill in your details to get started</p>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-slide-in-right">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { name: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
                { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
              ].map(({ name, label, type, placeholder }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
                  <input type={type} name={name} value={form[name]} onChange={handleChange} required placeholder={placeholder}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all ${fieldErrors[name] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                  {fieldErrors[name] && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><span>⚠</span>{fieldErrors[name]}</p>}
                </div>
              ))}

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} required placeholder="Min. 6 characters"
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all ${fieldErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-300">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {showPass
                        ? <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        : <><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>
                      }
                    </svg>
                  </button>
                </div>
                {fieldErrors.password && <p className="mt-1 text-xs text-red-600">⚠ {fieldErrors.password}</p>}
              </div>

              {/* Role selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Role</label>
                <select name="role" value={form.role} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all bg-white">
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.icon} {r.label}</option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 transition-all duration-200 shadow-md hover:shadow-glow flex items-center justify-center gap-2 mt-2">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account…</>
                  : 'Create account'}
              </button>
            </form>

            <p className="mt-5 text-sm text-gray-500 dark:text-gray-400 text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-700 hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
