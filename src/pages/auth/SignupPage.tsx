import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Briefcase, Heart, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/lib/types';

export function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email.trim(), password, fullName.trim(), role);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    navigate(role === 'vendor' ? '/vendor' : role === 'admin' ? '/admin' : '/app', {
      replace: true,
    });
  };

  const roleOptions: {
    value: UserRole;
    label: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    { value: 'customer', label: 'Customer', desc: 'Plan & book services', icon: <Heart size={18} /> },
    { value: 'vendor', label: 'Vendor', desc: 'List your business', icon: <Briefcase size={18} /> },
  ];

  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-3xl font-semibold text-white">Create your account</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Join Vivah Connect as a customer or vendor.
      </p>

      {error && <Alert variant="error" className="mt-5">{error}</Alert>}

      <div className="mt-6">
        <label className="block text-xs font-medium text-neutral-400 mb-2">I am a</label>
        <div className="grid grid-cols-2 gap-3">
          {roleOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRole(opt.value)}
              className={cn(
                'flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition-all',
                role === opt.value
                  ? 'border-gold-400/60 bg-gold-400/10'
                  : 'border-white/8 bg-black/30 hover:border-white/15'
              )}
            >
              <span className={cn(role === opt.value ? 'text-gold-300' : 'text-neutral-400')}>
                {opt.icon}
              </span>
              <span className="text-sm font-semibold text-white">{opt.label}</span>
              <span className="text-xs text-neutral-500">{opt.desc}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-neutral-600 flex items-center gap-1.5">
          <Shield size={12} /> Admin accounts are provisioned internally.
        </p>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">Full name</label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="input-field pl-10"
            />
          </div>
        </div>
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
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="input-field pl-10"
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-gold w-full">
          {loading ? <Spinner size={16} className="!text-black" /> : <>Create account <ArrowRight size={16} /></>}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-400">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-gold-400 font-semibold hover:text-gold-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
