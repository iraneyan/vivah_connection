import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';

export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) setError(error);
  };

  const fillDemo = (role: 'customer' | 'vendor' | 'admin') => {
    const map = {
      customer: { email: 'kavya@example.com', password: 'vivahconnect' },
      vendor: { email: 'venue@vivahconnect.com', password: 'vivahconnect' },
      admin: { email: 'admin@vivahconnect.com', password: 'vivahconnect' },
    };
    setEmail(map[role].email);
    setPassword(map[role].password);
    setError('');
  };

  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-3xl font-semibold text-white">Welcome back</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Sign in to manage your bookings and events.
      </p>

      {error && <Alert variant="error" className="mt-5">{error}</Alert>}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field pl-10"
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type={showPw ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field pl-10 pr-10"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link to="/auth/forgot" className="text-xs text-gold-400 hover:text-gold-300">
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={loading} className="btn-gold w-full">
          {loading ? <Spinner size={16} className="!text-black" /> : <>Sign in <ArrowRight size={16} /></>}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-white/5">
        <p className="text-xs text-neutral-500 mb-2.5 text-center">Try a demo account</p>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => fillDemo('customer')} className="btn-ghost text-xs !px-2 !py-2">
            Customer
          </button>
          <button onClick={() => fillDemo('vendor')} className="btn-ghost text-xs !px-2 !py-2">
            Vendor
          </button>
          <button onClick={() => fillDemo('admin')} className="btn-ghost text-xs !px-2 !py-2">
            Admin
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-neutral-400">
        New here?{' '}
        <Link to="/auth/signup" className="text-gold-400 font-semibold hover:text-gold-300">
          Create an account
        </Link>
      </p>
    </div>
  );
}
