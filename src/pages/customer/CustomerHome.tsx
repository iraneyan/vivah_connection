import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Sparkles, TrendingUp } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { VendorCard } from '@/components/vendor/VendorCard';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { supabase } from '@/lib/supabaseClient';
import type { VendorWithCategory } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

export function CustomerHome() {
  const { categories } = useCategories();
  const { profile } = useAuth();
  const [vendors, setVendors] = useState<VendorWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('vendors')
        .select('*, category:categories(id,name,slug,icon)')
        .eq('is_approved', true)
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false })
        .limit(24);
      if (data) setVendors(data as VendorWithCategory[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return vendors;
    const q = query.toLowerCase();
    return vendors.filter(
      (v) =>
        v.business_name.toLowerCase().includes(q) ||
        v.city?.toLowerCase().includes(q) ||
        v.category?.name.toLowerCase().includes(q) ||
        v.tagline?.toLowerCase().includes(q)
    );
  }, [vendors, query]);

  const featured = vendors.filter((v) => v.is_featured).slice(0, 3);

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <div className="animate-fade-up">
        <p className="text-sm text-neutral-500">
          {profile?.full_name ? `Welcome back, ${profile.full_name.split(' ')[0]}` : 'Welcome'}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white mt-1">
          Plan your perfect celebration
        </h1>
      </div>

      {/* Search */}
      <div className="relative animate-fade-up">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vendors, categories, or cities…"
            className="input-field pl-11 pr-10 h-12 text-base"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <section className="animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-white">Browse categories</h2>
          <Link to="/app/categories" className="text-sm text-gold-400 hover:text-gold-300">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {categories.slice(0, 8).map((cat) => (
            <Link
              key={cat.id}
              to={`/app/browse?category=${cat.slug}`}
              className="group flex flex-col items-center gap-2 rounded-xl glass p-4 hover:border-gold-400/40 hover:-translate-y-0.5 transition-all"
            >
              <div className="grid place-items-center w-10 h-10 rounded-lg bg-gold-400/10 text-gold-300 group-hover:bg-gold-400/20 transition-colors">
                <CategoryIcon name={cat.icon} size={18} />
              </div>
              <span className="text-[11px] font-medium text-neutral-300 text-center leading-tight">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && !query && (
        <section className="animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-gold-400" />
            <h2 className="font-display text-xl font-semibold text-white">Featured vendors</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map((v) => (
              <VendorCard key={v.id} vendor={v} />
            ))}
          </div>
        </section>
      )}

      {/* All vendors */}
      <section className="animate-fade-up">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-gold-400" />
          <h2 className="font-display text-xl font-semibold text-white">
            {query ? `Results for "${query}"` : 'Top rated vendors'}
          </h2>
          {!query && (
            <Link to="/app/browse" className="ml-auto text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1">
              <SlidersHorizontal size={14} /> Filters
            </Link>
          )}
        </div>

        {loading ? (
          <div className="py-16">
            <Spinner size={28} label="Loading vendors" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No vendors found"
            description="Try a different search term or browse all categories."
            action={
              <Link to="/app/categories" className="btn-gold">
                Browse categories
              </Link>
            }
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((v) => (
              <VendorCard key={v.id} vendor={v} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
