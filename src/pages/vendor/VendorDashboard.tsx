import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Calendar,
  Wallet,
  Star,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Store,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import type { Vendor, Booking, Review, Profile } from '@/lib/types';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { StarRating } from '@/components/ui/StarRating';
import { formatINR, formatDate, relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

export function VendorDashboard() {
  const { profile } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [bookings, setBookings] = useState<(Booking & { customer?: Profile })[]>([]);
  const [reviews, setReviews] = useState<(Review & { customer?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    (async () => {
      const { data: vs } = await supabase
        .from('vendors')
        .select('*')
        .eq('owner_id', profile.id)
        .order('created_at', { ascending: false });
      if (!active) return;
      const vendorList = (vs as Vendor[]) ?? [];
      setVendors(vendorList);
      if (vendorList.length > 0) {
        const vendorIds = vendorList.map((v) => v.id);
        const [bks, revs] = await Promise.all([
          supabase
            .from('bookings')
            .select('*, customer:profiles!bookings_customer_id_fkey(id,full_name,avatar_url)')
            .in('vendor_id', vendorIds)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('reviews')
            .select('*, customer:profiles!reviews_customer_id_fkey(id,full_name,avatar_url)')
            .in('vendor_id', vendorIds)
            .order('created_at', { ascending: false })
            .limit(5),
        ]);
        if (active) {
          setBookings((bks.data as (Booking & { customer?: Profile })[]) ?? []);
          setReviews((revs.data as (Review & { customer?: Profile })[]) ?? []);
        }
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [profile]);

  if (loading) return <Spinner size={28} label="Loading your dashboard" className="py-20" />;

  const totalRevenue = bookings
    .filter((b) => b.payment_status === 'paid' || b.payment_status === 'deposit_paid')
    .reduce((s, b) => s + (b.amount || 0), 0);
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const avgRating = vendors.length > 0
    ? (vendors.reduce((s, v) => s + v.rating, 0) / vendors.length).toFixed(1)
    : '0.0';
  const approvedVendors = vendors.filter((v) => v.is_approved);

  return (
    <div className="space-y-8">
      <div className="animate-fade-up">
        <p className="text-sm text-neutral-500">{profile?.full_name ? `Hello, ${profile.full_name.split(' ')[0]}` : 'Welcome'}</p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white mt-1">Vendor dashboard</h1>
      </div>

      {/* Approval banner */}
      {vendors.length > 0 && approvedVendors.length === 0 && (
        <div className="glass-gold rounded-2xl p-5 flex items-start gap-3 animate-fade-up">
          <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-white">Your listings are pending approval</p>
            <p className="text-xs text-neutral-400 mt-1">
              Our admin team reviews each listing before it appears in the customer marketplace.
              You'll be notified once approved.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up">
        <StatCard icon={<Wallet size={18} />} label="Total revenue" value={formatINR(totalRevenue)} sub="from paid bookings" />
        <StatCard icon={<Calendar size={18} />} label="Total bookings" value={String(bookings.length)} sub={`${confirmedCount} confirmed`} />
        <StatCard icon={<Clock size={18} />} label="Pending" value={String(pendingCount)} sub="awaiting your response" highlight={pendingCount > 0} />
        <StatCard icon={<Star size={18} />} label="Avg rating" value={`${avgRating}★`} sub={`${vendors.length} listing${vendors.length !== 1 ? 's' : ''}`} />
      </div>

      {/* No listings state */}
      {vendors.length === 0 ? (
        <EmptyState
          icon={<Store size={26} />}
          title="No listings yet"
          description="Create your first vendor listing to start receiving bookings from customers."
          action={<Link to="/vendor/listings" className="btn-gold">Create listing <ArrowRight size={15} /></Link>}
        />
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent bookings */}
          <section className="card animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold text-white">Recent bookings</h2>
              <Link to="/vendor/bookings" className="text-sm text-gold-400 hover:text-gold-300">View all</Link>
            </div>
            {bookings.length === 0 ? (
              <p className="text-sm text-neutral-500 py-8 text-center">No bookings yet.</p>
            ) : (
              <ul className="space-y-3">
                {bookings.slice(0, 5).map((b) => (
                  <li key={b.id} className="flex items-center gap-3">
                    {b.customer?.avatar_url ? (
                      <img src={b.customer.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="grid place-items-center w-9 h-9 rounded-full bg-gold-400/15 text-gold-300 text-xs font-semibold">
                        {(b.customer?.full_name ?? 'A')[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{b.customer?.full_name ?? 'Customer'}</p>
                      <p className="text-xs text-neutral-500 truncate">{b.package_title ?? 'Custom'} • {formatDate(b.event_date)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-gold-300">{formatINR(b.amount)}</div>
                      <span className={cn(
                        'text-[10px] capitalize',
                        b.status === 'confirmed' ? 'text-emerald-400' : b.status === 'pending' ? 'text-amber-400' : 'text-neutral-500'
                      )}>{b.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Recent reviews */}
          <section className="card animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold text-white">Recent reviews</h2>
            </div>
            {reviews.length === 0 ? (
              <p className="text-sm text-neutral-500 py-8 text-center">No reviews yet.</p>
            ) : (
              <ul className="space-y-3">
                {reviews.map((r) => (
                  <li key={r.id} className="rounded-xl bg-black/20 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{r.customer?.full_name ?? 'Customer'}</span>
                      <StarRating rating={r.rating} size={11} />
                    </div>
                    {r.body && <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{r.body}</p>}
                    <p className="text-[10px] text-neutral-600 mt-1">{relativeTime(r.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* Listings preview */}
      {vendors.length > 0 && (
        <section className="animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-white">Your listings</h2>
            <Link to="/vendor/listings" className="text-sm text-gold-400 hover:text-gold-300">Manage <ArrowRight size={13} /></Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map((v) => (
              <div key={v.id} className="card">
                <div className="flex items-start gap-3">
                  {v.logo_url ? (
                    <img src={v.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="grid place-items-center w-12 h-12 rounded-xl bg-gold-400/15 text-gold-300">
                      <Store size={20} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{v.business_name}</h3>
                    <StarRating rating={v.rating} showValue reviewCount={v.review_count} size={11} className="mt-1" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {v.is_approved ? (
                    <span className="chip-gold !py-0.5"><CheckCircle2 size={11} /> Live</span>
                  ) : (
                    <span className="chip !py-0.5"><Clock size={11} /> Pending</span>
                  )}
                  {v.is_featured && <span className="chip-orange !py-0.5">Featured</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn('card', highlight && 'border-amber-500/30')}>
      <div className="flex items-center gap-2 text-neutral-400 text-xs">
        <span className={highlight ? 'text-amber-400' : 'text-gold-400'}>{icon}</span>
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold text-white">{value}</div>
      {sub && <div className="text-xs text-neutral-500 mt-0.5">{sub}</div>}
    </div>
  );
}
