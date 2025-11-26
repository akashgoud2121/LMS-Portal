import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaCheckCircle, FaEnvelope, FaLock, FaShieldAlt, FaUser } from 'react-icons/fa';
import AuthLayout, { AUTH_ACCENTS } from '../components/AuthLayout';

const accent = AUTH_ACCENTS.blue;
const RegisterAdmin = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post('/api/auth/register/admin', {
                name,
                email,
                password
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/admin/login');
            }, 3000);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    if (success) {
        return (<AuthLayout accent="blue" badge="Admin Command" title="Admin request received" subtitle="Once the master admin approves you, the command dashboard, analytics, and controls will open up automatically." highlights={['Centralized approvals', 'Team-wide insights', 'Audit-ready logs']}>
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <FaCheckCircle className="text-5xl text-blue-500"/>
        <h2 className="text-2xl font-bold text-slate-900">Success! Pending approval.</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          We just notified the master admin. As soon as you're approved, you'll receive a secure login link via email.
        </p>
        <p className="text-xs text-slate-400">Redirecting you to the login page...</p>
      </div>
    </AuthLayout>);
    }
    return (<AuthLayout accent="blue" badge="Admin Command" title="Request elevated access" subtitle="Keep every cohort, instructor, and learner secure with a beautifully modern admin console." highlights={['Role-based controls', 'Usage analytics', 'Automated approvals']}>
      <div className="space-y-8">
        <div className="flex items-center gap-3 text-blue-700">
          <FaShieldAlt className="text-3xl"/>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Secure signup</p>
            <h2 className="text-3xl font-bold text-slate-900">Create an admin profile</h2>
          </div>
        </div>
        {error && (<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>)}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-slate-600">
              Full name
            </label>
            <div className="relative">
              <FaUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input id="name" name="name" type="text" required className={`w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:bg-white ${accent.focus}`} placeholder="Ari Thompson" value={name} onChange={(e) => setName(e.target.value)}/>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-600">
              Work email
            </label>
            <div className="relative">
              <FaEnvelope className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input id="email" name="email" type="email" autoComplete="email" required className={`w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:bg-white ${accent.focus}`} placeholder="admin@company.com" value={email} onChange={(e) => setEmail(e.target.value)}/>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-600">
              Password
            </label>
            <div className="relative">
              <FaLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input id="password" name="password" type="password" autoComplete="new-password" required className={`w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:bg-white ${accent.focus}`} placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)}/>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-600">
              Confirm password
            </label>
            <div className="relative">
              <FaLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required className={`w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:bg-white ${accent.focus}`} placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}/>
            </div>
          </div>
          <button type="submit" disabled={loading} className={`inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition ${accent.button} ${loading ? 'opacity-70' : ''}`}>
            {loading ? 'Submitting...' : 'Send admin request'}
          </button>
        </form>
        <div className="text-center text-sm text-slate-500">
          Already approved?{' '}
          <Link to="/admin/login" className="font-semibold text-slate-900 hover:text-blue-600">
            Sign in instead
          </Link>
        </div>
      </div>
    </AuthLayout>);
  };
export default RegisterAdmin;
