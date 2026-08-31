import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Search,
  Sparkles,
  ShieldCheck,
  CalendarCheck,
  Star,
  Heart,
  Briefcase,
  Quote,
} from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { StarRating } from '@/components/ui/StarRating';
import { supabase } from '@/lib/supabaseClient';
import type { VendorWithCategory } from '@/lib/types';
import { formatINR } from '@/lib/format';

export function LandingPage() {
  const { categories } = useCategories();
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<VendorWithCategory[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('vendors')
        .select('*, category:categories(id,name,slug,icon)')
        .eq('is_approved', true)
        .order('rating', { ascending: false })
        .limit(4);
      if (data) setFeatured(data as VendorWithCategory[]);
    })();
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    navigate(`/auth/login?next=/app/browse?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-ink-800">
      {/* Nav */}
      <header className="absolute top-0 inset-x-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
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
            <div className="flex items-center gap-3">
              <Link to="/auth/login" className="btn-ghost">
                Sign in
              </Link>
              <Link to="/auth/signup" className="btn-gold">
                Get started <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <img
          src="https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt="Wedding celebration"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink-900/95 via-ink-900/70 to-ink-900/40" />
        <div className="absolute inset-0 bg-gold-radial" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full pt-28">
          <div className="max-w-2xl animate-fade-up">
            <div className="chip-gold mb-6">
              <Sparkles size={13} /> India's premium wedding marketplace
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold text-white leading-[1.05]">
              Every wedding service,
              <br />
              <span className="gold-text">beautifully in one place.</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-300 max-w-xl">
              Discover verified venues, photographers, caterers, and 18 more
              service categories. Compare packages, book instantly, and plan
              your entire celebration from a single dashboard.
            </p>

            {/* Search */}
            <form
              onSubmit={onSearch}
              className="mt-8 flex flex-col sm:flex-row gap-3 max-w-xl"
            >
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search venues, photographers, caterers…"
                  className="input-field pl-11 h-12 text-base"
                />
              </div>
              <button type="submit" className="btn-gold h-12 !px-6">
                Search <ArrowRight size={16} />
              </button>
            </form>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-gold-400" /> Verified vendors
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarCheck size={15} className="text-gold-400" /> Instant booking
              </span>
              <span className="flex items-center gap-1.5">
                <Star size={15} className="text-gold-400" /> Real reviews
              </span>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-neutral-500 animate-fade-in">
          <span className="text-[10px] uppercase tracking-[0.3em]">Explore</span>
          <div className="w-px h-8 bg-gradient-to-b from-gold-400/60 to-transparent" />
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 sm:py-28 bg-ink-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <div className="chip-gold w-fit mb-3">
                <Sparkles size={13} /> Categories
              </div>
              <h2 className="font-display text-4xl sm:text-5xl font-semibold text-white">
                Find every service you need
              </h2>
              <p className="mt-3 text-neutral-400 max-w-lg">
                21 curated categories covering the full spectrum of wedding and
                event services.
              </p>
            </div>
            <Link to="/auth/signup" className="btn-outline-gold shrink-0">
              Browse all <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
            {categories.map((cat, i) => (
              <Link
                key={cat.id}
                to={`/auth/login?next=/app/browse?category=${cat.slug}`}
                className="group card hover:border-gold-400/40 hover:-translate-y-1 animate-fade-up"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="grid place-items-center w-12 h-12 rounded-xl bg-gold-400/10 text-gold-300 mb-3 group-hover:bg-gold-400/20 transition-colors">
                  <CategoryIcon name={cat.icon} size={22} />
                </div>
                <div className="text-sm font-semibold text-white leading-tight">
                  {cat.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured vendors */}
      {featured.length > 0 && (
        <section className="py-20 sm:py-28 bg-ink-900 border-y border-white/5">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="chip-gold w-fit mb-3 mx-auto">
                <Star size={13} /> Top rated
              </div>
              <h2 className="font-display text-4xl sm:text-5xl font-semibold text-white">
                Featured vendors
              </h2>
              <p className="mt-3 text-neutral-400">
                Hand-picked, verified, and loved by couples.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featured.map((v, i) => (
                <Link
                  key={v.id}
                  to={`/auth/login?next=/app/vendor/${v.slug}`}
                  className="group glass rounded-2xl overflow-hidden hover:border-gold-400/40 transition-all duration-300 hover:-translate-y-1 animate-fade-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={v.cover_url ?? v.logo_url ?? ''}
                      alt={v.business_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/20 to-transparent" />
                    {v.is_verified && (
                      <span className="absolute top-3 left-3 chip-gold !py-0.5 !px-2">
                        <ShieldCheck size={11} /> Verified
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-lg font-semibold text-white leading-tight">
                        {v.business_name}
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">{v.category?.name}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <StarRating rating={v.rating} showValue reviewCount={v.review_count} />
                      <span className="text-xs text-neutral-400">{v.city}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-xs text-neutral-500">From</span>
                      <span className="text-sm font-semibold text-gold-300">
                        {formatINR(v.pricing_from)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="py-20 sm:py-28 bg-ink-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl sm:text-5xl font-semibold text-white">
              How Vivah Connect works
            </h2>
            <p className="mt-3 text-neutral-400">Three steps to a perfectly planned celebration.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Search size={22} />,
                step: '01',
                title: 'Discover',
                desc: 'Browse 21 categories, filter by city, budget, and rating to find vendors that match your vision.',
              },
              {
                icon: <CalendarCheck size={22} />,
                step: '02',
                title: 'Book',
                desc: 'Select a package, choose your date, request a quote, or book instantly with secure payments.',
              },
              {
                icon: <Heart size={22} />,
                step: '03',
                title: 'Celebrate',
                desc: 'Track every booking in your event dashboard, manage tasks, and leave reviews after the big day.',
              },
            ].map((s, i) => (
              <div
                key={s.step}
                className="relative card hover:border-gold-400/30 transition-colors animate-fade-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="absolute top-5 right-5 font-display text-5xl font-semibold text-white/5">
                  {s.step}
                </span>
                <div className="grid place-items-center w-12 h-12 rounded-xl bg-gold-400/10 text-gold-300 mb-4">
                  {s.icon}
                </div>
                <h3 className="font-display text-2xl font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-neutral-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For vendors */}
      <section className="py-20 sm:py-28 bg-ink-900 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=1000"
                alt="Vendor at work"
                className="rounded-2xl object-cover w-full h-[420px] gold-border"
              />
              <div className="absolute -bottom-6 -right-4 sm:-right-6 glass-gold rounded-2xl p-5 shadow-gold-lg max-w-[220px]">
                <div className="text-3xl font-display font-semibold gold-text">500+</div>
                <div className="text-sm text-neutral-300 mt-1">
                  bookings processed this month
                </div>
              </div>
            </div>
            <div>
              <div className="chip-orange w-fit mb-4">
                <Briefcase size={13} /> For vendors
              </div>
              <h2 className="font-display text-4xl sm:text-5xl font-semibold text-white leading-tight">
                Grow your wedding business
              </h2>
              <p className="mt-4 text-neutral-400">
                List your services, showcase your portfolio, manage bookings, and
                track revenue — all from a dedicated vendor studio built for
                wedding professionals.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Reach couples actively planning their wedding',
                  'Manage packages, pricing, and availability',
                  'Accept, reschedule, or quote on bookings',
                  'Dashboard analytics for revenue and reviews',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-neutral-200">
                    <ShieldCheck size={16} className="text-gold-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/auth/signup" className="btn-gold mt-8">
                Become a vendor <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 sm:py-28 bg-ink-800">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <Quote size={40} className="text-gold-400/40 mx-auto mb-6" />
          <p className="font-display text-2xl sm:text-3xl font-medium text-white leading-relaxed">
            "We planned our entire wedding through Vivah Connect. From the venue
            to the mehendi artist, everything was in one place. The event
            dashboard kept us sane."
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <img
              src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100"
              alt="Kavya"
              className="w-10 h-10 rounded-full object-cover gold-border"
            />
            <div className="text-left">
              <div className="text-sm font-semibold text-white">Kavya & Arjun</div>
              <div className="text-xs text-neutral-500">Mumbai, February 2026</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-semibold text-white">
            Ready to plan your <span className="gold-text">perfect day?</span>
          </h2>
          <p className="mt-4 text-neutral-400">
            Join Vivah Connect today. It's free for customers.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth/signup" className="btn-gold">
              Start planning <ArrowRight size={16} />
            </Link>
            <Link to="/auth/login" className="btn-ghost">
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-ink-900 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="grid place-items-center w-9 h-9 rounded-lg bg-gold-gradient text-black font-display font-bold text-lg">
                  V
                </div>
                <div className="font-display text-lg font-semibold text-white">
                  Vivah <span className="gold-text">Connect</span>
                </div>
              </div>
              <p className="text-sm text-neutral-500 max-w-xs">
                India's premium wedding & event services marketplace.
              </p>
            </div>
            {[
              { title: 'Customers', links: ['Browse vendors', 'Plan an event', 'Book a service'] },
              { title: 'Vendors', links: ['List your business', 'Pricing', 'Success stories'] },
              { title: 'Company', links: ['About', 'Careers', 'Contact'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-white mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l}>
                      <Link to="/auth/login" className="text-sm text-neutral-500 hover:text-gold-300 transition-colors">
                        {l}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-3 text-xs text-neutral-600">
            <span>© 2026 Vivah Connect. Crafted for celebrations.</span>
            <span>Made with care in India</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
