import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="animate-fade-up">
      <Link
        to="/auth/login"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white mb-6"
      >
        <ArrowLeft size={14} /> Back to sign in
      </Link>

      {sent ? (
        <div className="text-center py-4">
          <div className="mx-auto grid place-items-center w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-300 mb-4">
            <CheckCircle2 size={28} />
          </div>
          <h1 className="font-display text-2xl font-semibold text-white">Check your email</h1>
          <p className="mt-2 text-sm text-neutral-400">
            We sent a password reset link to <span className="text-gold-300">{email}</span>.
          </p>
        </div>
      ) : (
        <>
          <h1 className="font-display text-3xl font-semibold text-white">Reset password</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Enter your email and we'll send you a reset link.
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
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full">
              {loading ? <Spinner size={16} className="!text-black" /> : <>Send reset link <ArrowRight size={16} /></>}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
