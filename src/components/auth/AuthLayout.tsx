import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Sparkles } from 'lucide-react';

const highlights = [
  '21 service categories from venues to priests',
  'AI-assisted budget planner and event checklist',
  'Verified vendors with real reviews and ratings',
  'One dashboard for every wedding booking',
];

export function AuthLayout() {
  const { session, profile, loading, profileLoading } = useAuth();
  const location = useLocation();

  if (loading || profileLoading) return null;

  if (session && profile) {
    const home =
      profile.role === 'vendor'
        ? '/vendor'
        : profile.role === 'admin'
        ? '/admin'
        : '/app';
    const from = (location.state as { from?: string })?.from;
    return <Navigate to={from ?? home} replace />;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — form */}
      <div className="flex flex-col justify-center px-6 sm:px-12 py-10">
        <Link to="/" className="flex items-center gap-2.5 mb-10">
          <div className="grid place-items-center w-10 h-10 rounded-lg bg-gold-gradient text-black font-display font-bold text-xl shadow-gold">
            V
          </div>
          <div className="leading-tight">
            <div className="font-display text-xl font-semibold text-white">
              Vivah <span className="gold-text">Connect</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-gold-500/70">
              Marketplace
            </div>
          </div>
        </Link>
        <div className="w-full max-w-sm mx-auto">
          <Outlet />
        </div>
      </div>

      {/* Right — showcase */}
      <div className="hidden lg:flex relative overflow-hidden bg-ink-900">
        <img
          src="https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg?auto=compress&cs=tinysrgb&w=1200"
          alt="Wedding celebration"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink-900/80 via-ink-900/40 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-12">
          <div className="chip-gold w-fit mb-5">
            <Sparkles size={13} /> Premium wedding marketplace
          </div>
          <h2 className="font-display text-4xl font-semibold text-white leading-tight max-w-md">
            Every wedding service, beautifully in one place.
          </h2>
          <ul className="mt-8 space-y-3 max-w-md">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-3 text-sm text-neutral-200">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold-400 shrink-0" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
