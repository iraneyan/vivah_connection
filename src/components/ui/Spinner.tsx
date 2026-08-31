import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

export function Spinner({ size = 24, className, label }: SpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2 text-neutral-400', className)}>
      <Loader2 size={size} className="animate-spin text-gold-400" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function FullPageSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Spinner size={32} label={label} />
    </div>
  );
}
