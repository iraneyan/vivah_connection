import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  className,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full glass-gold rounded-t-3xl sm:rounded-2xl shadow-2xl animate-scale-in max-h-[92vh] overflow-y-auto hide-scrollbar',
          sizeMap[size],
          className
        )}
      >
        {(title || subtitle) && (
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-white/5">
            <div>
              {title && (
                <h3 className="font-display text-2xl font-semibold text-white">{title}</h3>
              )}
              {subtitle && <p className="text-sm text-neutral-400 mt-1">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-neutral-400 hover:text-white hover:bg-white/5 transition-colors shrink-0"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
