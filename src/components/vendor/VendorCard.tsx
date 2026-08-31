import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin } from 'lucide-react';
import type { VendorWithCategory } from '@/lib/types';
import { StarRating } from '@/components/ui/StarRating';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { formatINR } from '@/lib/format';

export function VendorCard({ vendor }: { vendor: VendorWithCategory }) {
  return (
    <Link
      to={`/app/vendor/${vendor.slug}`}
      className="group glass rounded-2xl overflow-hidden hover:border-gold-400/40 transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={vendor.cover_url ?? vendor.logo_url ?? ''}
          alt={vendor.business_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/30 to-transparent" />
        {vendor.is_verified && (
          <span className="absolute top-3 left-3 chip-gold !py-0.5 !px-2">
            <ShieldCheck size={11} /> Verified
          </span>
        )}
        {vendor.is_featured && (
          <span className="absolute top-3 right-3 chip-orange !py-0.5 !px-2">Featured</span>
        )}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
          <h3 className="font-display text-lg font-semibold text-white leading-tight line-clamp-2">
            {vendor.business_name}
          </h3>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <CategoryIcon name={vendor.category?.icon} size={14} />
          <span>{vendor.category?.name ?? 'Service'}</span>
          {vendor.city && (
            <>
              <span className="text-neutral-700">•</span>
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {vendor.city}
              </span>
            </>
          )}
        </div>
        <p className="mt-2 text-sm text-neutral-400 line-clamp-2">
          {vendor.tagline ?? vendor.description}
        </p>
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
          <StarRating rating={vendor.rating} showValue reviewCount={vendor.review_count} />
          <div className="text-right">
            <div className="text-[10px] text-neutral-500">From</div>
            <div className="text-sm font-semibold text-gold-300">
              {formatINR(vendor.pricing_from)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
