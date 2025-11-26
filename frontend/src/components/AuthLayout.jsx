import React from 'react';
import { FaCheckCircle, FaQuoteLeft } from 'react-icons/fa';

export const AUTH_ACCENTS = {
  indigo: {
    panelGradient: 'from-[#3127a0] via-[#252066] to-[#0e0b2b]',
    badge: 'bg-white/15 text-indigo-100 ring-1 ring-white/20',
    badgeText: 'text-indigo-100',
    accentText: 'text-indigo-200',
    icon: 'text-indigo-200',
    button: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 hover:from-indigo-600 hover:via-purple-600 hover:to-blue-600 focus:ring-indigo-400',
    focus: 'focus:ring-indigo-500 focus:border-indigo-500',
    pill: 'bg-white/10 text-indigo-100'
  },
  emerald: {
    panelGradient: 'from-[#0f5132] via-[#0a3f26] to-[#041f13]',
    badge: 'bg-white/15 text-emerald-100 ring-1 ring-white/20',
    badgeText: 'text-emerald-100',
    accentText: 'text-emerald-200',
    icon: 'text-emerald-200',
    button: 'bg-gradient-to-r from-emerald-500 via-green-500 to-lime-400 hover:from-emerald-600 hover:via-green-600 hover:to-lime-500 focus:ring-emerald-400',
    focus: 'focus:ring-emerald-500 focus:border-emerald-500',
    pill: 'bg-white/10 text-emerald-100'
  },
  blue: {
    panelGradient: 'from-[#003b73] via-[#07264a] to-[#050f21]',
    badge: 'bg-white/15 text-blue-100 ring-1 ring-white/20',
    badgeText: 'text-blue-100',
    accentText: 'text-blue-200',
    icon: 'text-blue-200',
    button: 'bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400 hover:from-blue-600 hover:via-sky-600 hover:to-cyan-500 focus:ring-blue-400',
    focus: 'focus:ring-blue-500 focus:border-blue-500',
    pill: 'bg-white/10 text-blue-100'
  }
};

const AuthLayout = ({
  accent = 'indigo',
  badge,
  title,
  subtitle,
  highlights = [],
  stats = [],
  testimonial,
  children
}) => {
  const accentStyles = AUTH_ACCENTS[accent] || AUTH_ACCENTS.indigo;

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-b from-white/10 to-white/0 blur-3xl opacity-40" />
        <div className="absolute -top-32 -left-32 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className={`bg-gradient-to-br ${accentStyles.panelGradient} rounded-3xl p-10 shadow-2xl ring-1 ring-white/10`}>
            {badge && (
              <span className={`inline-flex items-center px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] rounded-full ${accentStyles.badge}`}>
                {badge}
              </span>
            )}
            <h1 className="mt-6 text-4xl font-bold leading-tight text-white">{title}</h1>
            <p className={`mt-4 text-base ${accentStyles.accentText}`}>{subtitle}</p>

            {highlights.length > 0 && (
              <ul className="mt-8 space-y-4">
                {highlights.map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-white/90">
                    <FaCheckCircle className={`mt-0.5 ${accentStyles.icon}`} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {stats.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="rounded-2xl bg-white/10 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-white/70">{stat.label}</p>
                    <p className="text-2xl font-semibold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            )}

            {testimonial && (
              <div className="mt-10 rounded-2xl bg-white/10 p-5">
                <FaQuoteLeft className={`text-2xl ${accentStyles.icon}`} />
                <p className="mt-3 text-sm text-white/90 italic">"{testimonial.quote}"</p>
                <p className="mt-4 text-sm font-semibold text-white">{testimonial.author}</p>
                <p className="text-xs text-white/70">{testimonial.role}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-10 shadow-2xl border border-slate-100">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

