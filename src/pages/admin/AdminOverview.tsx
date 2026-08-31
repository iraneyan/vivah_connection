import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Store,
  Wallet,
  Calendar,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  Star,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { Vendor, Booking, Profile, Category } from '@/lib/types';
import { Spinner } from '@/components/ui/Spinner';
import { StarRating } from '@/components/ui/StarRating';
import { formatINR, formatDate, relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

export function AdminOverview() {
  const [vendors, setVendors] = useState<(Vendor & { category?: Category })[]>([]);
  const [bookings, setBookings] = useState<(Booking & { customer?: Profile; vendor?: Vendor })[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [vs, bks, us] = await Promise.all([
        supabase.from('vendors').select('*, category:categories(id,name,slug,icon)').order('created_at', { ascending: false }),
        supabase
          .from('bookings')
          .select('*, customer:profiles!bookings_customer_id_fkey(id,full_name), vendor:vendors(id,business_name,logo_url,slug)')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      ]);
      setVendors((vs.data as (Vendor & { category?: Category })[]) ?? []);
      setBookings((bks.data as (Booking & { customer?: Profile; vendor?: Vendor })[]) ?? []);
      setUsers((us.data as Profile[]) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner size={28} label="Loading platform data" className="py-20" />;

  const pendingVendors = vendors.filter((v) => !v.is_approved);
  const approvedVendors = vendors.filter((v) => v.is_approved);
  const totalRevenue = bookings
    .filter((b) => b.payment_status === 'paid' || b.payment_status === 'deposit_paid')
    .reduce((s, b) => s + (b.amount || 0), 0);
  const customers = users.filter((u) => u.role === 'customer');
  const vendorUsers = users.filter((u) => u.role === 'vendor');

  return (
    <div className="space-y-8">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white">Platform overview</h1>
        <p className="mt-2 text-neutral-400">Monitor marketplace health and vendor approvals.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up">
        <StatCard icon={<Wallet size={18} />} label="Gross revenue" value={formatINR(totalRevenue)} sub="from paid bookings" />
        <StatCard icon={<Store size={18} />} label="Total vendors" value={String(vendors.length)} sub={`${approvedVendors.length} live`} />
        <StatCard icon={<Users size={18} />} label="Customers" value={String(customers.length)} sub="registered" />
        <StatCard icon={<Calendar size={18} />} label="Bookings" value={String(bookings.length)} sub="total" />
      </div>

      {/* Pending approvals */}
      <section className="card animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-white flex items-center gap-2">
            <Clock size={18} className="text-amber-400" /> Pending approvals
            {pendingVendors.length > 0 && (
              <span className="chip-orange !py-0.5">{pendingVendors.length}</span>
            )}
          </h2>
          <Link to="/admin/vendors" className="text-sm text-gold-400 hover:text-gold-300">
            Review all <ArrowRight size={13} />
          </Link>
        </div>
        {pendingVendors.length === 0 ? (
          <p className="text-sm text-neutral-500 py-6 text-center">All caught up — no pending approvals.</p>
        ) : (
          <ul className="space-y-3">
            {pendingVendors.slice(0, 5).map((v) => (
              <li key={v.id} className="flex items-center gap-3">
                {v.logo_url ? (
                  <img src={v.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="grid place-items-center w-10 h-10 rounded-lg bg-gold-400/15 text-gold-300">
                    <Store size={16} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{v.business_name}</p>
                  <p className="text-xs text-neutral-500">{v.category?.name} • {v.city}</p>
                </div>
                <span className="text-xs text-neutral-600">{relativeTime(v.created_at)}</span>
                <Link to="/admin/vendors" className="btn-outline-gold !py-1.5 !px-3 text-xs">Review</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent bookings */}
        <section className="card animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-white">Recent bookings</h2>
            <Link to="/admin/bookings" className="text-sm text-gold-400 hover:text-gold-300">View all</Link>
          </div>
          {bookings.length === 0 ? (
            <p className="text-sm text-neutral-500 py-6 text-center">No bookings yet.</p>
          ) : (
            <ul className="space-y-3">
              {bookings.slice(0, 6).map((b) => (
                <li key={b.id} className="flex items-center gap-3">
                  <div className="grid place-items-center w-9 h-9 rounded-full bg-gold-400/15 text-gold-300 text-xs font-semibold">
                    {(b.customer?.full_name ?? 'A')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{b.customer?.full_name ?? 'Customer'}</p>
                    <p className="text-xs text-neutral-500 truncate">{b.vendor?.business_name} • {b.package_title ?? 'Custom'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-gold-300">{formatINR(b.amount)}</div>
                    <span className={cn(
                      'text-[10px] capitalize',
                      b.status === 'confirmed' || b.status === 'completed' ? 'text-emerald-400' : 'text-neutral-500'
                    )}>{b.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Top vendors */}
        <section className="card animate-fade-up">
          <h2 className="font-display text-xl font-semibold text-white mb-4">Top vendors</h2>
          <ul className="space-y-3">
            {[...approvedVendors]
              .sort((a, b) => b.rating - a.rating)
              .slice(0, 5)
              .map((v) => (
                <li key={v.id} className="flex items-center gap-3">
                  {v.logo_url ? (
                    <img src={v.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="grid place-items-center w-10 h-10 rounded-lg bg-gold-400/15 text-gold-300">
                      <Store size={16} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{v.business_name}</p>
                    <p className="text-xs text-neutral-500">{v.category?.name}</p>
                  </div>
                  <StarRating rating={v.rating} showValue reviewCount={v.review_count} size={11} />
                </li>
              ))}
          </ul>
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
