import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  size?: number;
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
}

export function StarRating({
  rating,
  size = 14,
  showValue = false,
  reviewCount,
  className,
}: StarRatingProps) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < full;
          const half = i === full && hasHalf;
          return (
            <Star
              key={i}
              size={size}
              className={
                filled || half
                  ? 'text-gold-400 fill-gold-400'
                  : 'text-neutral-600 fill-neutral-700'
              }
              strokeWidth={1.5}
            />
          );
        })}
      </div>
      {showValue && (
        <span className="text-xs font-semibold text-gold-300">
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className="text-xs text-neutral-500">({reviewCount})</span>
      )}
    </div>
  );
}
