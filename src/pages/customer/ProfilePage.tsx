import { useState } from 'react';
import { User, Mail, Phone, Save, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    setError('');
    setSaved(false);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone, avatar_url: avatarUrl })
      .eq('id', profile.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
    refreshProfile();
    setTimeout(() => setSaved(false), 2500);
  };

  if (!profile) return <Spinner size={28} label="Loading profile" className="py-20" />;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white">My profile</h1>
        <p className="mt-2 text-neutral-400">Update your personal information.</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {saved && <Alert variant="success">Profile updated successfully.</Alert>}

      <div className="card animate-fade-up space-y-5">
        {/* Avatar preview */}
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover gold-border" />
          ) : (
            <div className="grid place-items-center w-20 h-20 rounded-full bg-gold-400/15 text-gold-300">
              <User size={32} />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-white">{fullName || 'Your name'}</p>
            <p className="text-xs text-neutral-500 capitalize">{profile.role}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">Full name</label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field pl-10" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input value={profile.id ? '' : ''} disabled placeholder="Email is managed by your sign-in" className="input-field pl-10 opacity-50" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">Phone</label>
          <div className="relative">
            <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91…" className="input-field pl-10" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">Avatar URL</label>
          <input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…"
            className="input-field"
          />
        </div>

        <button onClick={save} disabled={saving} className="btn-gold">
          {saving ? <Spinner size={16} className="!text-black" /> : saved ? <><CheckCircle2 size={16} /> Saved</> : <><Save size={16} /> Save changes</>}
        </button>
      </div>
    </div>
  );
}
