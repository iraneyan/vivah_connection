import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Image, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { Banner } from '@/lib/types';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { cn } from '@/lib/utils';

export function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true });
    setBanners((data as Banner[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (b: Banner) => {
    if (!confirm(`Delete banner "${b.title}"?`)) return;
    await supabase.from('banners').delete().eq('id', b.id);
    load();
  };

  if (loading) return <Spinner size={28} label="Loading banners" className="py-20" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white">Banner management</h1>
          <p className="mt-2 text-neutral-400">Manage promotional banners shown across the marketplace.</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-gold">
          <Plus size={16} /> New banner
        </button>
      </div>

      {banners.length === 0 ? (
        <EmptyState
          icon={<Image size={26} />}
          title="No banners yet"
          description="Create promotional banners to highlight offers and featured categories."
          action={<button onClick={() => setCreating(true)} className="btn-gold"><Plus size={16} /> Create banner</button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {banners.map((b, i) => (
            <div key={b.id} className="glass rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="relative h-36">
                <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 to-transparent" />
                <div className="absolute bottom-2 left-3 right-3">
                  <h3 className="font-semibold text-white text-sm">{b.title}</h3>
                  <span className="text-[10px] text-neutral-400 capitalize">{b.position}</span>
                </div>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className={cn('chip !py-0.5', b.is_active ? '!text-emerald-300 !border-emerald-500/30' : '')}>
                  {b.is_active ? 'Active' : 'Inactive'}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(b)} className="text-neutral-500 hover:text-gold-300 p-1.5">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => remove(b)} className="text-neutral-500 hover:text-red-400 p-1.5">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <BannerEditor
          banner={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function BannerEditor({
  banner,
  onClose,
  onSaved,
}: {
  banner: Banner | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: banner?.title ?? '',
    image_url: banner?.image_url ?? '',
    link_url: banner?.link_url ?? '',
    position: banner?.position ?? 'home',
    is_active: banner?.is_active ?? true,
    sort_order: banner ? String(banner.sort_order) : '0',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true);
    setError('');
    const payload = {
      title: form.title.trim(),
      image_url: form.image_url.trim(),
      link_url: form.link_url || null,
      position: form.position,
      is_active: form.is_active,
      sort_order: Number(form.sort_order) || 0,
    };
    let res;
    if (banner) {
      res = await supabase.from('banners').update(payload).eq('id', banner.id);
    } else {
      res = await supabase.from('banners').insert(payload);
    }
    setSaving(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title={banner ? 'Edit banner' : 'Create banner'} size="md">
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">Image URL</label>
          <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="input-field" placeholder="https://…" />
          {form.image_url && (
            <div className="mt-2 rounded-lg overflow-hidden h-24">
              <img src={form.image_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">Link URL (optional)</label>
          <input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} className="input-field" placeholder="https://…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Position</label>
            <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="input-field">
              <option value="home" className="bg-ink-800">Home</option>
              <option value="category" className="bg-ink-800">Category</option>
              <option value="detail" className="bg-ink-800">Detail</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Sort order</label>
            <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="input-field" />
          </div>
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded accent-gold-400" />
          <span className="text-sm text-neutral-300">Active</span>
        </label>
        <button onClick={save} disabled={saving} className="btn-gold w-full">
          {saving ? <Spinner size={16} className="!text-black" /> : banner ? 'Save changes' : 'Create banner'}
        </button>
      </div>
    </Modal>
  );
}
