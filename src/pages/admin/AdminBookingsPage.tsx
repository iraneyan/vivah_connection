import { useEffect, useState } from 'react';
import { Calendar, DollarSign, Users } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { Booking, Profile, Vendor } from '@/lib/types';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatINR, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

const statusConfig = {
  pending: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  confirmed: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  completed: 'text-sky-300 bg-sky-500/10 border-sky-500/30',
  cancelled: 'text-neutral-400 bg-white/5 border-white/10',
  rejected: 'text-red-300 bg-red-500/10 border-red-500/30',
  rescheduled: 'text-orange-300 bg-orange-500/10 border-orange-500/30',
};

export function AdminBookingsPage() {
  const [bookings, setBookings] = useState<(Booking & { customer?: Profile; vendor?: Vendor })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('bookings')
        .select('*, customer:profiles!bookings_customer_id_fkey(id,full_name,avatar_url), vendor:vendors(id,business_name,logo_url,slug)')
        .order('created_at', { ascending: false });
      setBookings((data as (Booking & { customer?: Profile; vendor?: Vendor })[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  if (loading) return <Spinner size={28} label="Loading bookings" className="py-20" />;

  const totalRevenue = bookings
    .filter((b) => b.payment_status === 'paid' || b.payment_status === 'deposit_paid')
    .reduce((s, b) => s + (b.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white">Booking monitor</h1>
        <p className="mt-2 text-neutral-400">All bookings across the platform.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 animate-fade-up">
        <div className="card">
          <div className="flex items-center gap-2 text-xs text-neutral-400"><DollarSign size={15} className="text-gold-400" /> Gross revenue</div>
          <div className="mt-2 font-display text-2xl font-semibold text-white">{formatINR(totalRevenue)}</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-xs text-neutral-400"><Calendar size={15} className="text-gold-400" /> Total bookings</div>
          <div className="mt-2 font-display text-2xl font-semibold text-white">{bookings.length}</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-xs text-neutral-400"><Users size={15} className="text-gold-400" /> Unique customers</div>
          <div className="mt-2 font-display text-2xl font-semibold text-white">
            {new Set(bookings.map((b) => b.customer_id)).size}
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar animate-fade-up">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-sm font-medium capitalize transition-all',
              filter === t
                ? 'bg-gold-400/15 border border-gold-400/50 text-gold-200'
                : 'bg-white/5 border border-white/8 text-neutral-400'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No bookings" description="Bookings will appear here as customers book services." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500 border-b border-white/5">
                <th className="py-3 px-2 font-medium">Customer</th>
                <th className="py-3 px-2 font-medium">Vendor</th>
                <th className="py-3 px-2 font-medium">Package</th>
                <th className="py-3 px-2 font-medium">Date</th>
                <th className="py-3 px-2 font-medium">Amount</th>
                <th className="py-3 px-2 font-medium">Status</th>
                <th className="py-3 px-2 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      {b.customer?.avatar_url ? (
                        <img src={b.customer.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="grid place-items-center w-7 h-7 rounded-full bg-gold-400/15 text-gold-300 text-[10px] font-semibold">
                          {(b.customer?.full_name ?? 'A')[0]}
                        </div>
                      )}
                      <span className="text-white truncate">{b.customer?.full_name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-neutral-300 truncate max-w-[140px]">{b.vendor?.business_name ?? '—'}</td>
                  <td className="py-3 px-2 text-neutral-400 truncate max-w-[120px]">{b.package_title ?? 'Custom'}</td>
                  <td className="py-3 px-2 text-neutral-400 whitespace-nowrap">{formatDateTime(b.event_date)}</td>
                  <td className="py-3 px-2 text-gold-300 font-semibold whitespace-nowrap">{formatINR(b.amount)}</td>
                  <td className="py-3 px-2">
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border capitalize', statusConfig[b.status])}>
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className={cn(
                      'text-[10px] capitalize',
                      b.payment_status === 'paid' || b.payment_status === 'deposit_paid' ? 'text-emerald-400' : 'text-neutral-500'
                    )}>
                      {b.payment_status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
