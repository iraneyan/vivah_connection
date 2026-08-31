import { useEffect, useState } from 'react';
import { Check, X, ShieldCheck, Star, Clock, Store, Trash2, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { Vendor, Category, Profile } from '@/lib/types';
import { useCategories } from '@/hooks/useCategories';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { StarRating } from '@/components/ui/StarRating';
import { formatINR, formatDate, relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

export function AdminVendorsPage() {
  const { categories } = useCategories();
  const [vendors, setVendors] = useState<(Vendor & { category?: Category; owner?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [selected, setSelected] = useState<(Vendor & { category?: Category; owner?: Profile }) | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from('vendors')
      .select('*, category:categories(id,name,slug,icon), owner:profiles!vendors_owner_id_fkey(id,full_name,phone)')
      .order('created_at', { ascending: false });
    setVendors((data as (Vendor & { category?: Category; owner?: Profile })[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (v: Vendor) => {
    setBusy(true);
    await supabase
      .from('vendors')
      .update({ is_approved: true, is_verified: true, approved_at: new Date().toISOString() })
      .eq('id', v.id);
    await supabase.from('notifications').insert({
      user_id: v.owner_id,
      type: 'vendor_approved',
      title: 'Your listing is now live!',
      body: `${v.business_name} has been approved and is visible to customers.`,
      data: { vendor_id: v.id },
    });
    setBusy(false);
    load();
  };

  const reject = async (v: Vendor) => {
    if (!confirm(`Reject "${v.business_name}"? The listing will remain hidden.`)) return;
    setBusy(true);
    await supabase.from('vendors').update({ is_approved: false, is_verified: false }).eq('id', v.id);
    setBusy(false);
    load();
  };

  const toggleFeatured = async (v: Vendor) => {
    await supabase.from('vendors').update({ is_featured: !v.is_featured }).eq('id', v.id);
    load();
  };

  const remove = async (v: Vendor) => {
    if (!confirm(`Permanently delete "${v.business_name}"? This cannot be undone.`)) return;
    await supabase.from('vendors').delete().eq('id', v.id);
    setSelected(null);
    load();
  };

  const filtered = vendors.filter((v) => {
    if (filter === 'pending') return !v.is_approved;
    if (filter === 'approved') return v.is_approved;
    return true;
  });

  if (loading) return <Spinner size={28} label="Loading vendors" className="py-20" />;

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white">Vendor management</h1>
        <p className="mt-2 text-neutral-400">Review, approve, and manage all vendor listings.</p>
      </div>

      <div className="flex gap-2 animate-fade-up">
        {[
          { key: 'pending' as const, label: `Pending (${vendors.filter((v) => !v.is_approved).length})` },
          { key: 'approved' as const, label: `Approved (${vendors.filter((v) => v.is_approved).length})` },
          { key: 'all' as const, label: `All (${vendors.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-all',
              filter === t.key
                ? 'bg-gold-400/15 border border-gold-400/50 text-gold-200'
                : 'bg-white/5 border border-white/8 text-neutral-400'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Store size={26} />}
          title={filter === 'pending' ? 'No pending approvals' : 'No vendors found'}
          description={filter === 'pending' ? 'All vendor listings have been reviewed.' : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((v, i) => (
            <div key={v.id} className="card animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {v.logo_url ? (
                    <img src={v.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="grid place-items-center w-12 h-12 rounded-xl bg-gold-400/15 text-gold-300 shrink-0">
                      <Store size={20} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white truncate">{v.business_name}</h3>
                      {v.is_approved ? (
                        <span className="chip-gold !py-0.5"><Check size={11} /> Live</span>
                      ) : (
                        <span className="chip !py-0.5"><Clock size={11} /> Pending</span>
                      )}
                      {v.is_featured && <span className="chip-orange !py-0.5">Featured</span>}
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      {v.category?.name ?? 'Uncategorized'} • {v.city ?? 'No city'} • Owner: {v.owner?.full_name ?? 'Unknown'}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-500">
                      <StarRating rating={v.rating} showValue reviewCount={v.review_count} size={10} />
                      <span>From {formatINR(v.pricing_from)}</span>
                      <span>Added {relativeTime(v.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setSelected(v)} className="btn-ghost !px-3 !py-2 text-xs">
                    <Eye size={14} /> Review
                  </button>
                  {!v.is_approved ? (
                    <button onClick={() => approve(v)} disabled={busy} className="btn-gold !px-3 !py-2 text-xs">
                      <Check size={14} /> Approve
                    </button>
                  ) : (
                    <>
                      <button onClick={() => toggleFeatured(v)} className="btn-outline-gold !px-3 !py-2 text-xs">
                        <Star size={13} /> {v.is_featured ? 'Unfeature' : 'Feature'}
                      </button>
                      <button onClick={() => reject(v)} className="btn-ghost !px-3 !py-2 text-xs !text-amber-300">
                        <X size={14} /> Unapprove
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <Modal open onClose={() => setSelected(null)} title={selected.business_name} subtitle={selected.category?.name ?? undefined} size="lg">
          <div className="space-y-5">
            {selected.cover_url && (
              <img src={selected.cover_url} alt="" className="w-full h-48 rounded-xl object-cover" />
            )}
            {selected.tagline && <p className="text-sm text-gold-300">{selected.tagline}</p>}
            {selected.description && (
              <div>
                <p className="text-xs font-medium text-neutral-400 mb-1">Description</p>
                <p className="text-sm text-neutral-300 whitespace-pre-line">{selected.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Info label="City" value={selected.city ?? '—'} />
              <Info label="Starting price" value={formatINR(selected.pricing_from)} />
              <Info label="Contact phone" value={selected.contact_phone ?? '—'} />
              <Info label="Contact email" value={selected.contact_email ?? '—'} />
              <Info label="Owner" value={selected.owner?.full_name ?? '—'} />
              <Info label="Owner phone" value={selected.owner?.phone ?? '—'} />
              <Info label="Service areas" value={selected.service_areas.join(', ') || '—'} />
              <Info label="Added" value={formatDate(selected.created_at)} />
            </div>
            {selected.gallery.length > 0 && (
              <div>
                <p className="text-xs font-medium text-neutral-400 mb-2">Gallery</p>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                  {selected.gallery.map((g, i) => (
                    <img key={i} src={g} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-4 border-t border-white/5">
              {!selected.is_approved ? (
                <button onClick={() => { approve(selected); setSelected(null); }} className="btn-gold">
                  <ShieldCheck size={16} /> Approve & publish
                </button>
              ) : (
                <button onClick={() => { reject(selected); setSelected(null); }} className="btn-ghost !text-amber-300">
                  <X size={16} /> Unapprove
                </button>
              )}
              <button onClick={() => { remove(selected); }} className="btn-ghost !text-red-300 ml-auto">
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-white font-medium mt-0.5">{value}</div>
    </div>
  );
}
