import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaCheckCircle, FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import AuthLayout, { AUTH_ACCENTS } from '../components/AuthLayout';

const accent = AUTH_ACCENTS.emerald;
const RegisterInstructor = () => {
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
            const response = await axios.post('/api/auth/register/instructor', {
                name,
                email,
                password
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/instructor/login');
            }, 3000);
        }
        catch (err) {
            console.error('Registration error:', err);
            if (err.response?.data?.errors) {
                // Handle validation errors
                setError(err.response.data.errors.map((e) => e.msg || e.message).join(', '));
            }
            else if (err.response?.data?.message) {
                setError(err.response.data.message);
            }
            else if (err.message) {
                setError(err.message);
            }
            else {
                setError('Registration failed. Please check your connection and try again.');
            }
        }
        finally {
            setLoading(false);
        }
    };
    if (success) {
        return (<AuthLayout accent="emerald" badge="Instructor HQ" title="You're queued for instructor approval" subtitle="Once the team verifies your profile, you'll unlock the full suite of authoring tools and analytics." highlights={['Advanced course composer', 'Auto-graded quizzes', 'Cohort health insights']}>
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <FaCheckCircle className="text-5xl text-emerald-500"/>
        <h2 className="text-2xl font-bold text-slate-900">Application submitted!</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          We\'re reviewing your credentials. Expect an approval email soon, then log in to publish your first course.
        </p>
        <p className="text-xs text-slate-400">Redirecting you to the login page...</p>
      </div>
    </AuthLayout>);
    }
    return (<AuthLayout accent="emerald" badge="Instructor HQ" title="Share your expertise with EduMaster" subtitle="Apply in minutes, then start crafting immersive, trackable learning experiences for every cohort." highlights={['Modular content builder', 'Built-in assessments', 'Detailed learner insights']}>
      <div className="space-y-8">
        <div>
          <p className="text-sm font-semibold tracking-wide text-slate-400">Apply as instructor</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Set up your teaching profile</h2>
          <p className="mt-1 text-sm text-slate-500">Admin approval keeps content quality high for every learner.</p>
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
              <input id="name" name="name" type="text" required className={`w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:bg-white ${accent.focus}`} placeholder="Morgan Ellis" value={name} onChange={(e) => setName(e.target.value)}/>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-600">
              Work email
            </label>
            <div className="relative">
              <FaEnvelope className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input id="email" name="email" type="email" autoComplete="email" required className={`w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:bg-white ${accent.focus}`} placeholder="you@academy.com" value={email} onChange={(e) => setEmail(e.target.value)}/>
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
          <button type="submit" disabled={loading} className={`inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition ${accent.button} ${loading ? 'opacity-70' : ''}`}>
            {loading ? 'Submitting...' : 'Request instructor access'}
          </button>
        </form>
        <div className="text-center text-sm text-slate-500">
          Already approved?{' '}
          <Link to="/instructor/login" className="font-semibold text-slate-900 hover:text-emerald-600">
            Sign in instead
          </Link>
        </div>
      </div>
    </AuthLayout>);
  };
export default RegisterInstructor;
