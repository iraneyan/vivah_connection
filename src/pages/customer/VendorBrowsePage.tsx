import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Check } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { VendorCard } from '@/components/vendor/VendorCard';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { supabase } from '@/lib/supabaseClient';
import type { VendorWithCategory } from '@/lib/types';
import { cn } from '@/lib/utils';

type SortKey = 'rating' | 'price_low' | 'price_high' | 'reviews';

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'rating', label: 'Top rated' },
  { value: 'reviews', label: 'Most reviewed' },
  { value: 'price_low', label: 'Price: low to high' },
  { value: 'price_high', label: 'Price: high to low' },
];

const cities = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Jaipur'];

export function VendorBrowsePage() {
  const { categories } = useCategories();
  const [params, setParams] = useSearchParams();
  const [vendors, setVendors] = useState<VendorWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const query = params.get('q') ?? '';
  const categorySlug = params.get('category') ?? '';
  const city = params.get('city') ?? '';
  const sort = (params.get('sort') as SortKey) ?? 'rating';
  const minRating = Number(params.get('rating') ?? '0');

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      let q = supabase
        .from('vendors')
        .select('*, category:categories(id,name,slug,icon)')
        .eq('is_approved', true);

      if (categorySlug) {
        const cat = categories.find((c) => c.slug === categorySlug);
        if (cat) q = q.eq('category_id', cat.id);
      }
      if (city) q = q.ilike('city', city);
      if (minRating > 0) q = q.gte('rating', minRating);

      const { data } = await q.order('is_featured', { ascending: false }).limit(60);
      if (active) {
        setVendors((data as VendorWithCategory[]) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [categorySlug, city, minRating, categories]);

  const filtered = useMemo(() => {
    let list = [...vendors];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (v) =>
          v.business_name.toLowerCase().includes(q) ||
          v.city?.toLowerCase().includes(q) ||
          v.category?.name.toLowerCase().includes(q) ||
          v.tagline?.toLowerCase().includes(q) ||
          v.description?.toLowerCase().includes(q)
      );
    }
    switch (sort) {
      case 'price_low':
        list.sort((a, b) => a.pricing_from - b.pricing_from);
        break;
      case 'price_high':
        list.sort((a, b) => b.pricing_from - a.pricing_from);
        break;
      case 'reviews':
        list.sort((a, b) => b.review_count - a.review_count);
        break;
      default:
        list.sort((a, b) => b.rating - a.rating);
    }
    return list;
  }, [vendors, query, sort]);

  const activeFilters =
    (categorySlug ? 1 : 0) + (city ? 1 : 0) + (minRating > 0 ? 1 : 0);

  const clearAll = () => {
    setParams(new URLSearchParams(), { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white">
          {categorySlug
            ? categories.find((c) => c.slug === categorySlug)?.name ?? 'Browse'
            : 'Discover vendors'}
        </h1>
        <p className="mt-2 text-neutral-400">
          {loading ? 'Searching…' : `${filtered.length} vendors available`}
        </p>
      </div>

      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-up">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => setParam('q', e.target.value)}
            placeholder="Search by name, city, or service…"
            className="input-field pl-11 h-11"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setParam('sort', e.target.value)}
          className="input-field h-11 sm:w-52"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value} className="bg-ink-800">
              {o.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowFilters((s) => !s)}
          className={cn(
            'btn-ghost h-11 relative',
            activeFilters > 0 && '!border-gold-400/50 !text-gold-300'
          )}
        >
          <SlidersHorizontal size={16} /> Filters
          {activeFilters > 0 && (
            <span className="grid place-items-center w-5 h-5 rounded-full bg-gold-400 text-black text-[10px] font-bold">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="glass-gold rounded-2xl p-5 animate-scale-in space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Filters</h3>
            <button onClick={clearAll} className="text-xs text-gold-400 hover:text-gold-300">
              Clear all
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              <FilterChip active={!categorySlug} onClick={() => setParam('category', '')}>
                All
              </FilterChip>
              {categories.map((c) => (
                <FilterChip
                  key={c.id}
                  active={categorySlug === c.slug}
                  onClick={() => setParam('category', c.slug)}
                >
                  {c.name}
                </FilterChip>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2">City</label>
            <div className="flex flex-wrap gap-2">
              <FilterChip active={!city} onClick={() => setParam('city', '')}>
                All cities
              </FilterChip>
              {cities.map((c) => (
                <FilterChip key={c} active={city === c} onClick={() => setParam('city', c)}>
                  {c}
                </FilterChip>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2">Minimum rating</label>
            <div className="flex flex-wrap gap-2">
              {[0, 3, 4, 4.5].map((r) => (
                <FilterChip key={r} active={minRating === r} onClick={() => setParam('rating', String(r))}>
                  {r === 0 ? 'Any' : `${r}+ ★`}
                </FilterChip>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active filter pills */}
      {activeFilters > 0 && !showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {categorySlug && (
            <ActivePill
              label={categories.find((c) => c.slug === categorySlug)?.name ?? 'Category'}
              onClear={() => setParam('category', '')}
            />
          )}
          {city && <ActivePill label={city} onClear={() => setParam('city', '')} />}
          {minRating > 0 && (
            <ActivePill label={`${minRating}+ rating`} onClear={() => setParam('rating', '')} />
          )}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="py-16">
          <Spinner size={28} label="Finding vendors" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No vendors match your filters"
          description="Try widening your search or clearing some filters."
          action={
            <button onClick={clearAll} className="btn-gold">
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((v) => (
            <VendorCard key={v.id} vendor={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1.5 text-xs font-medium transition-all',
        active
          ? 'bg-gold-400/15 border border-gold-400/50 text-gold-200'
          : 'bg-white/5 border border-white/8 text-neutral-400 hover:border-white/15'
      )}
    >
      {active && <Check size={11} className="inline mr-1" />}
      {children}
    </button>
  );
}

function ActivePill({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 chip-gold">
      {label}
      <button onClick={onClear} className="hover:text-white">
        <X size={12} />
      </button>
    </span>
  );
}
