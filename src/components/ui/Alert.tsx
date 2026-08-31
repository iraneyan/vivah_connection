import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type Variant = 'success' | 'error' | 'info' | 'warning';

interface AlertProps {
  variant: Variant;
  title?: string;
  children?: ReactNode;
  className?: string;
}

const config: Record<Variant, { icon: typeof Info; cls: string }> = {
  success: { icon: CheckCircle2, cls: 'border-emerald-500/30 bg-emerald-500/8 text-emerald-200' },
  error: { icon: XCircle, cls: 'border-red-500/30 bg-red-500/8 text-red-200' },
  warning: { icon: AlertCircle, cls: 'border-amber-500/30 bg-amber-500/8 text-amber-200' },
  info: { icon: Info, cls: 'border-sky-500/30 bg-sky-500/8 text-sky-200' },
};

export function Alert({ variant, title, children, className }: AlertProps) {
  const { icon: Icon, cls } = config[variant];
  return (
    <div className={cn('flex gap-3 rounded-xl border px-4 py-3 text-sm', cls, className)}>
      <Icon size={18} className="shrink-0 mt-0.5" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'text-sm opacity-90')}>{children}</div>}
      </div>
    </div>
  );
}
