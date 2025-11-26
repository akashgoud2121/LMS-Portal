import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowRight, FaEnvelope, FaLock } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import AuthLayout, { AUTH_ACCENTS } from '../components/AuthLayout';

const accent = AUTH_ACCENTS.emerald;
const LoginInstructor = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password, 'instructor');
            navigate('/instructor/dashboard');
        }
        catch (err) {
            const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
            setError(errorMessage);
        }
        finally {
            setLoading(false);
        }
    };
    return (<AuthLayout accent="emerald" badge="Instructor HQ" title="Teach with flow and clarity" subtitle="Sign in to publish lessons, launch quizzes, and guide every learner with insightful analytics." highlights={['Drag-and-drop course builder', 'Instant quiz publishing', 'Progress snapshots per cohort']}>
      <div className="space-y-8">
        <div>
          <p className="text-sm font-semibold tracking-wide text-slate-400">Instructor login</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Welcome back, mentor</h2>
          <p className="mt-1 text-sm text-slate-500">Secure access to your teaching workspace.</p>
        </div>
        {error && (<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>)}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-600">
              Email address
            </label>
            <div className="relative">
              <FaEnvelope className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input id="email" name="email" type="email" autoComplete="email" required className={`w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:bg-white ${accent.focus}`} placeholder="mentor@academy.com" value={email} onChange={(e) => setEmail(e.target.value)}/>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-600">
              Password
            </label>
            <div className="relative">
              <FaLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input id="password" name="password" type="password" autoComplete="current-password" required className={`w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:bg-white ${accent.focus}`} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)}/>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="inline-flex items-center gap-2 text-slate-500">
              <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"/>
              Keep me signed in
            </label>
            <Link to="/instructor/register" className="font-semibold text-emerald-600 hover:text-emerald-500">
              Need access?
            </Link>
          </div>
          <button type="submit" disabled={loading} className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition ${accent.button} ${loading ? 'opacity-70' : ''}`}>
            {loading ? 'Signing in...' : 'Open instructor hub'}
            <FaArrowRight className="text-sm"/>
          </button>
        </form>
        <div className="text-center text-sm text-slate-500">
          Different role?{' '}
          <Link to="/student/login" className="font-semibold text-slate-900 hover:text-emerald-600">
            Student Login
          </Link>{' '}
          ·{' '}
          <Link to="/admin/login" className="font-semibold text-slate-900 hover:text-emerald-600">
            Admin Login
          </Link>
        </div>
      </div>
    </AuthLayout>);
};
export default LoginInstructor;
