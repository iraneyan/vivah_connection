import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, XCircle, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import type { Booking, Vendor } from '@/lib/types';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatINR, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, cls: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
  confirmed: { label: 'Confirmed', icon: CheckCircle2, cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
  completed: { label: 'Completed', icon: CheckCircle2, cls: 'text-sky-300 bg-sky-500/10 border-sky-500/30' },
  cancelled: { label: 'Cancelled', icon: XCircle, cls: 'text-neutral-400 bg-white/5 border-white/10' },
  rejected: { label: 'Rejected', icon: XCircle, cls: 'text-red-300 bg-red-500/10 border-red-500/30' },
  rescheduled: { label: 'Rescheduled', icon: Clock, cls: 'text-orange-300 bg-orange-500/10 border-orange-500/30' },
};

export function BookingsPage() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<(Booking & { vendor?: Vendor })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from('bookings')
        .select('*, vendor:vendors(id,business_name,logo_url,city,slug)')
        .eq('customer_id', profile.id)
        .order('created_at', { ascending: false });
      setBookings((data as (Booking & { vendor?: Vendor })[]) ?? []);
      setLoading(false);
    })();
  }, [profile]);

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);
  const counts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) return <Spinner size={28} label="Loading bookings" className="py-20" />;

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white">My bookings</h1>
        <p className="mt-2 text-neutral-400">Track every request, quote, and confirmed booking.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar animate-fade-up">
        {[
          { key: 'all', label: `All (${bookings.length})` },
          { key: 'pending', label: `Pending (${counts.pending ?? 0})` },
          { key: 'confirmed', label: `Confirmed (${counts.confirmed ?? 0})` },
          { key: 'completed', label: `Completed (${counts.completed ?? 0})` },
          { key: 'cancelled', label: `Cancelled (${counts.cancelled ?? 0})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all',
              filter === t.key
                ? 'bg-gold-400/15 border border-gold-400/50 text-gold-200'
                : 'bg-white/5 border border-white/8 text-neutral-400 hover:border-white/15'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="Browse vendors and book services to see them here."
          action={<Link to="/app/browse" className="btn-gold">Browse vendors</Link>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((b, i) => {
            const cfg = statusConfig[b.status];
            const StatusIcon = cfg.icon;
            return (
              <Link
                key={b.id}
                to={`/app/bookings/${b.id}`}
                className="group card hover:border-gold-400/30 transition-all flex items-center gap-4 animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {b.vendor?.logo_url ? (
                  <img src={b.vendor.logo_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="grid place-items-center w-14 h-14 rounded-xl bg-gold-400/15 text-gold-300 shrink-0">
                    <Calendar size={20} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white truncate">{b.vendor?.business_name ?? 'Vendor'}</h3>
                  </div>
                  <p className="text-sm text-neutral-400 truncate">{b.package_title ?? 'Custom request'}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-500">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(b.event_date)}</span>
                    <span className="flex items-center gap-1 text-gold-300"><DollarSign size={12} /> {formatINR(b.amount)}</span>
                  </div>
                </div>
                <span className={cn('shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border', cfg.cls)}>
                  <StatusIcon size={12} /> {cfg.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
