import { useEffect, useState } from 'react';
import { TrendingUp, Wallet, Calendar, Star, BarChart3 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import type { Booking, Vendor, Review } from '@/lib/types';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { StarRating } from '@/components/ui/StarRating';
import { formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';

export function VendorAnalyticsPage() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: vs } = await supabase.from('vendors').select('*').eq('owner_id', profile.id);
      const vendorList = (vs as Vendor[]) ?? [];
      setVendors(vendorList);
      if (vendorList.length > 0) {
        const ids = vendorList.map((v) => v.id);
        const [bks, revs] = await Promise.all([
          supabase.from('bookings').select('*').in('vendor_id', ids).order('created_at', { ascending: false }),
          supabase.from('reviews').select('*').in('vendor_id', ids).order('created_at', { ascending: false }),
        ]);
        setBookings((bks.data as Booking[]) ?? []);
        setReviews((revs.data as Review[]) ?? []);
      }
      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <Spinner size={28} label="Loading analytics" className="py-20" />;

  const paidBookings = bookings.filter((b) => b.payment_status === 'paid' || b.payment_status === 'deposit_paid');
  const totalRevenue = paidBookings.reduce((s, b) => s + (b.amount || 0), 0);

  // Monthly revenue (last 6 months)
  const now = new Date();
  const months: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString('en', { month: 'short' });
    const value = paidBookings
      .filter((b) => {
        const bd = new Date(b.created_at);
        return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear();
      })
      .reduce((s, b) => s + (b.amount || 0), 0);
    months.push({ label, value });
  }
  const maxMonth = Math.max(...months.map((m) => m.value), 1);

  // Status breakdown
  const statusBreakdown = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Rating distribution
  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const maxRating = Math.max(...ratingDist.map((r) => r.count), 1);

  if (vendors.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 size={26} />}
        title="No data yet"
        description="Create a listing and start receiving bookings to see analytics here."
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white">Analytics</h1>
        <p className="mt-2 text-neutral-400">Track your revenue, bookings, and reputation.</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up">
        <StatCard icon={<Wallet size={18} />} label="Total revenue" value={formatINR(totalRevenue)} sub={`${paidBookings.length} paid bookings`} />
        <StatCard icon={<Calendar size={18} />} label="Total bookings" value={String(bookings.length)} sub="all time" />
        <StatCard icon={<TrendingUp size={18} />} label="This month" value={formatINR(months[months.length - 1].value)} sub={months[months.length - 1].label} />
        <StatCard icon={<Star size={18} />} label="Avg rating" value={`${(reviews.reduce((s, r) => s + r.rating, 0) / (reviews.length || 1)).toFixed(1)}★`} sub={`${reviews.length} reviews`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <section className="card animate-fade-up">
          <h2 className="font-display text-xl font-semibold text-white mb-5">Revenue (last 6 months)</h2>
          <div className="flex items-end justify-between gap-2 h-48">
            {months.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-gold-600 to-gold-300 rounded-t-lg transition-all hover:from-gold-500 hover:to-gold-200"
                    style={{ height: `${(m.value / maxMonth) * 100}%`, minHeight: m.value > 0 ? '8px' : '2px' }}
                    title={formatINR(m.value)}
                  />
                </div>
                <span className="text-[10px] text-neutral-500">{m.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Booking status */}
        <section className="card animate-fade-up">
          <h2 className="font-display text-xl font-semibold text-white mb-5">Booking status</h2>
          <div className="space-y-3">
            {Object.entries(statusBreakdown).map(([status, count]) => {
              const pct = (count / bookings.length) * 100;
              return (
                <div key={status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="capitalize text-neutral-300">{status}</span>
                    <span className="text-neutral-500">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        status === 'confirmed' || status === 'completed' ? 'bg-emerald-500' :
                        status === 'pending' ? 'bg-amber-500' : 'bg-neutral-600'
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Rating distribution */}
        <section className="card animate-fade-up">
          <h2 className="font-display text-xl font-semibold text-white mb-5">Rating breakdown</h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-8">No reviews yet.</p>
          ) : (
            <div className="space-y-2">
              {ratingDist.map((r) => (
                <div key={r.star} className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400 w-8">{r.star}★</span>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-gold-gradient rounded-full" style={{ width: `${(r.count / maxRating) * 100}%` }} />
                  </div>
                  <span className="text-xs text-neutral-500 w-6 text-right">{r.count}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Top listings */}
        <section className="card animate-fade-up">
          <h2 className="font-display text-xl font-semibold text-white mb-5">Listing performance</h2>
          <div className="space-y-3">
            {vendors.map((v) => {
              const vBookings = bookings.filter((b) => b.vendor_id === v.id);
              const vRevenue = vBookings.filter((b) => b.payment_status === 'paid' || b.payment_status === 'deposit_paid').reduce((s, b) => s + b.amount, 0);
              return (
                <div key={v.id} className="flex items-center gap-3">
                  {v.logo_url ? (
                    <img src={v.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="grid place-items-center w-10 h-10 rounded-lg bg-gold-400/15 text-gold-300 text-xs font-semibold">
                      {v.business_name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{v.business_name}</p>
                    <StarRating rating={v.rating} showValue reviewCount={v.review_count} size={10} className="mt-0.5" />
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-gold-300">{formatINR(vRevenue)}</div>
                    <div className="text-[10px] text-neutral-500">{vBookings.length} bookings</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 text-neutral-400 text-xs">
        <span className="text-gold-400">{icon}</span>
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold text-white">{value}</div>
      <div className="text-xs text-neutral-500 mt-0.5">{sub}</div>
    </div>
  );
}
