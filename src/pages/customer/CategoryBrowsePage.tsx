import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Spinner } from '@/components/ui/Spinner';

export function CategoryBrowsePage() {
  const { categories, loading } = useCategories();

  if (loading) return <Spinner size={28} label="Loading categories" className="py-16" />;

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white">
          All categories
        </h1>
        <p className="mt-2 text-neutral-400">
          {categories.length} service categories for every wedding need.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat, i) => (
          <Link
            key={cat.id}
            to={`/app/browse?category=${cat.slug}`}
            className="group card hover:border-gold-400/40 hover:-translate-y-0.5 transition-all animate-fade-up"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div className="flex items-start gap-4">
              <div className="grid place-items-center w-12 h-12 rounded-xl bg-gold-400/10 text-gold-300 shrink-0 group-hover:bg-gold-400/20 transition-colors">
                <CategoryIcon name={cat.icon} size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg font-semibold text-white">{cat.name}</h3>
                {cat.description && (
                  <p className="text-sm text-neutral-400 mt-1 line-clamp-2">{cat.description}</p>
                )}
                <span className="mt-2 inline-flex items-center gap-1 text-xs text-gold-400 group-hover:gap-2 transition-all">
                  Browse <ArrowRight size={12} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
