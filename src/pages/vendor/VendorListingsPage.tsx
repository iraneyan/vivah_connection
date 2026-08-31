import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Store, Package, Check, X, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import type { Vendor, VendorPackage } from '@/lib/types';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { StarRating } from '@/components/ui/StarRating';
import { formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';

export function VendorListingsPage() {
  const { profile } = useAuth();
  const { categories } = useCategories();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [packages, setPackages] = useState<Record<string, VendorPackage[]>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [creating, setCreating] = useState(false);
  const [pkgModal, setPkgModal] = useState<{ vendor: Vendor; pkg: VendorPackage | null } | null>(null);

  const load = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('vendors')
      .select('*')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false });
    const list = (data as Vendor[]) ?? [];
    setVendors(list);
    const pkgMap: Record<string, VendorPackage[]> = {};
    await Promise.all(
      list.map(async (v) => {
        const { data: pkgs } = await supabase
          .from('vendor_packages')
          .select('*')
          .eq('vendor_id', v.id)
          .order('price');
        pkgMap[v.id] = (pkgs as VendorPackage[]) ?? [];
      })
    );
    setPackages(pkgMap);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const deleteVendor = async (v: Vendor) => {
    if (!confirm(`Delete "${v.business_name}"? This removes all its packages and cannot be undone.`)) return;
    await supabase.from('vendors').delete().eq('id', v.id);
    load();
  };

  const deletePackage = async (p: VendorPackage) => {
    await supabase.from('vendor_packages').delete().eq('id', p.id);
    load();
  };

  if (loading) return <Spinner size={28} label="Loading listings" className="py-20" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white">My listings</h1>
          <p className="mt-2 text-neutral-400">Manage your business profiles and packages.</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-gold">
          <Plus size={16} /> New listing
        </button>
      </div>

      {vendors.length === 0 ? (
        <EmptyState
          icon={<Store size={26} />}
          title="No listings yet"
          description="Create your first vendor listing to showcase your services to customers."
          action={<button onClick={() => setCreating(true)} className="btn-gold"><Plus size={16} /> Create listing</button>}
        />
      ) : (
        <div className="space-y-5">
          {vendors.map((v, i) => (
            <div key={v.id} className="card animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {v.logo_url ? (
                    <img src={v.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="grid place-items-center w-16 h-16 rounded-xl bg-gold-400/15 text-gold-300 shrink-0">
                      <Store size={24} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-xl font-semibold text-white">{v.business_name}</h3>
                      {v.is_approved ? (
                        <span className="chip-gold !py-0.5"><Check size={11} /> Live</span>
                      ) : (
                        <span className="chip !py-0.5"><EyeOff size={11} /> Pending approval</span>
                      )}
                      {v.is_verified && <span className="chip-gold !py-0.5">Verified</span>}
                    </div>
                    <p className="text-sm text-neutral-400 mt-1 line-clamp-2">{v.tagline ?? v.description}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-neutral-500">
                      <StarRating rating={v.rating} showValue reviewCount={v.review_count} size={11} />
                      <span>From {formatINR(v.pricing_from)}</span>
                      {v.city && <span>• {v.city}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setEditing(v)} className="btn-ghost !px-3 !py-2 text-xs">
                    <Edit2 size={14} /> Edit
                  </button>
                  <button onClick={() => deleteVendor(v)} className="btn-ghost !px-3 !py-2 text-xs !text-red-300 hover:!border-red-500/40">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Packages */}
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
                    <Package size={13} /> Packages ({packages[v.id]?.length ?? 0})
                  </span>
                  <button
                    onClick={() => setPkgModal({ vendor: v, pkg: null })}
                    className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1"
                  >
                    <Plus size={12} /> Add package
                  </button>
                </div>
                {packages[v.id]?.length === 0 ? (
                  <p className="text-xs text-neutral-600">No packages yet.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {packages[v.id]?.map((p) => (
                      <div key={p.id} className="rounded-xl bg-black/30 border border-white/5 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{p.title}</p>
                            {p.is_popular && <span className="chip-orange !py-0 !px-1.5 !text-[10px] mt-1">Popular</span>}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => setPkgModal({ vendor: v, pkg: p })} className="text-neutral-500 hover:text-gold-300">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => deletePackage(p)} className="text-neutral-500 hover:text-red-400">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-gold-300 mt-2">{formatINR(p.price)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <VendorEditor
          vendor={editing}
          categories={categories}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            load();
          }}
        />
      )}

      {pkgModal && (
        <PackageEditor
          vendor={pkgModal.vendor}
          pkg={pkgModal.pkg}
          onClose={() => setPkgModal(null)}
          onSaved={() => {
            setPkgModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function VendorEditor({
  vendor,
  categories,
  onClose,
  onSaved,
}: {
  vendor: Vendor | null;
  categories: { id: string; name: string; slug: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { profile } = useAuth();
  const [form, setForm] = useState({
    business_name: vendor?.business_name ?? '',
    tagline: vendor?.tagline ?? '',
    description: vendor?.description ?? '',
    category_id: vendor?.category_id ?? '',
    city: vendor?.city ?? '',
    service_areas: vendor?.service_areas.join(', ') ?? '',
    contact_phone: vendor?.contact_phone ?? '',
    contact_email: vendor?.contact_email ?? '',
    website: vendor?.website ?? '',
    logo_url: vendor?.logo_url ?? '',
    cover_url: vendor?.cover_url ?? '',
    gallery: vendor?.gallery.join('\n') ?? '',
    pricing_from: vendor ? String(vendor.pricing_from) : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    setError('');
    const gallery = form.gallery.split('\n').map((s) => s.trim()).filter(Boolean);
    const payload = {
      owner_id: profile.id,
      business_name: form.business_name.trim(),
      tagline: form.tagline || null,
      description: form.description || null,
      category_id: form.category_id || null,
      city: form.city || null,
      service_areas: form.service_areas.split(',').map((s) => s.trim()).filter(Boolean),
      contact_phone: form.contact_phone || null,
      contact_email: form.contact_email || null,
      website: form.website || null,
      logo_url: form.logo_url || null,
      cover_url: form.cover_url || null,
      gallery,
      pricing_from: form.pricing_from ? Number(form.pricing_from) : 0,
      slug: form.business_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    };
    let res;
    if (vendor) {
      res = await supabase.from('vendors').update(payload).eq('id', vendor.id);
    } else {
      res = await supabase.from('vendors').insert(payload);
    }
    setSaving(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title={vendor ? 'Edit listing' : 'Create listing'} size="lg">
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Business name" required>
            <input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} className="input-field" />
          </Field>
          <Field label="Category">
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input-field">
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-ink-800">{c.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Tagline">
          <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className="input-field" placeholder="A short catchy line" />
        </Field>
        <Field label="Description">
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="input-field resize-none" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="City">
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-field" />
          </Field>
          <Field label="Service areas (comma separated)">
            <input value={form.service_areas} onChange={(e) => setForm({ ...form, service_areas: e.target.value })} className="input-field" placeholder="Mumbai, Pune" />
          </Field>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Contact phone">
            <input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className="input-field" />
          </Field>
          <Field label="Contact email">
            <input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="input-field" />
          </Field>
          <Field label="Starting price (₹)">
            <input type="number" value={form.pricing_from} onChange={(e) => setForm({ ...form, pricing_from: e.target.value })} className="input-field" />
          </Field>
        </div>
        <Field label="Logo image URL">
          <input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} className="input-field" placeholder="https://…" />
        </Field>
        <Field label="Cover image URL">
          <input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} className="input-field" placeholder="https://…" />
        </Field>
        <Field label="Gallery images (one URL per line)">
          <textarea value={form.gallery} onChange={(e) => setForm({ ...form, gallery: e.target.value })} rows={3} className="input-field resize-none" placeholder="https://…" />
        </Field>
        <button onClick={save} disabled={saving} className="btn-gold w-full">
          {saving ? <Spinner size={16} className="!text-black" /> : vendor ? 'Save changes' : 'Create listing'}
        </button>
      </div>
    </Modal>
  );
}

function PackageEditor({
  vendor,
  pkg,
  onClose,
  onSaved,
}: {
  vendor: Vendor;
  pkg: VendorPackage | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: pkg?.title ?? '',
    description: pkg?.description ?? '',
    price: pkg ? String(pkg.price) : '',
    duration: pkg?.duration ?? '',
    includes: pkg?.includes.join('\n') ?? '',
    is_popular: pkg?.is_popular ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true);
    setError('');
    const payload = {
      vendor_id: vendor.id,
      title: form.title.trim(),
      description: form.description || null,
      price: form.price ? Number(form.price) : 0,
      duration: form.duration || null,
      includes: form.includes.split('\n').map((s) => s.trim()).filter(Boolean),
      is_popular: form.is_popular,
    };
    let res;
    if (pkg) {
      res = await supabase.from('vendor_packages').update(payload).eq('id', pkg.id);
    } else {
      res = await supabase.from('vendor_packages').insert(payload);
    }
    setSaving(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title={pkg ? 'Edit package' : 'Add package'} subtitle={vendor.business_name} size="md">
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      <div className="space-y-4">
        <Field label="Title" required>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" />
        </Field>
        <Field label="Description">
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="input-field resize-none" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (₹)" required>
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" />
          </Field>
          <Field label="Duration">
            <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="input-field" placeholder="1 day" />
          </Field>
        </div>
        <Field label="What's included (one per line)">
          <textarea value={form.includes} onChange={(e) => setForm({ ...form, includes: e.target.value })} rows={3} className="input-field resize-none" placeholder="AC Hall&#10;Parking&#10;Bridal Suite" />
        </Field>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_popular}
            onChange={(e) => setForm({ ...form, is_popular: e.target.checked })}
            className="w-4 h-4 rounded accent-gold-400"
          />
          <span className="text-sm text-neutral-300">Mark as most popular</span>
        </label>
        <button onClick={save} disabled={saving} className="btn-gold w-full">
          {saving ? <Spinner size={16} className="!text-black" /> : pkg ? 'Save package' : 'Add package'}
        </button>
      </div>
    </Modal>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-400 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}
