import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Plus, Wallet } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import type { Event, Booking } from '@/lib/types';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { formatDate, formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';

const eventTypes = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'reception', label: 'Reception' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'other', label: 'Other' },
];

export function EventsPage() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [spend, setSpend] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    event_type: 'wedding' as Event['event_type'],
    event_date: '',
    city: '',
    venue: '',
    budget: '',
    guest_count: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('customer_id', profile.id)
      .order('event_date', { ascending: true });
    const list = (data as Event[]) ?? [];
    setEvents(list);
    // compute spend per event from confirmed+completed bookings
    const spendMap: Record<string, number> = {};
    await Promise.all(
      list.map(async (e) => {
        const { data: bk } = await supabase
          .from('bookings')
          .select('amount, status')
          .eq('event_id', e.id)
          .in('status', ['confirmed', 'completed']);
        spendMap[e.id] = (bk as Booking[])?.reduce((s, b) => s + (b.amount || 0), 0) ?? 0;
      })
    );
    setSpend(spendMap);
    setLoading(false);
  };

  useEffect(() => {
    if (profile) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const submit = async () => {
    if (!profile) return;
    setError('');
    if (!form.title.trim()) {
      setError('Please give your event a name.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('events').insert({
      customer_id: profile.id,
      title: form.title.trim(),
      event_type: form.event_type,
      event_date: form.event_date || null,
      city: form.city || null,
      venue: form.venue || null,
      budget: form.budget ? Number(form.budget) : 0,
      guest_count: form.guest_count ? Number(form.guest_count) : 0,
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setOpen(false);
    setForm({ title: '', event_type: 'wedding', event_date: '', city: '', venue: '', budget: '', guest_count: '' });
    load();
  };

  if (loading) return <Spinner size={28} label="Loading your events" className="py-20" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white">My events</h1>
          <p className="mt-2 text-neutral-400">Plan and track every celebration in one place.</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-gold">
          <Plus size={16} /> New event
        </button>
      </div>

      {events.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Create your first event to start booking vendors and tracking your budget."
          action={
            <button onClick={() => setOpen(true)} className="btn-gold">
              <Plus size={16} /> Create event
            </button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((e, i) => {
            const pct = e.budget > 0 ? Math.min(100, Math.round((spend[e.id] ?? 0) / e.budget) * 100) : 0;
            return (
              <Link
                key={e.id}
                to={`/app/events/${e.id}`}
                className="group card hover:border-gold-400/40 hover:-translate-y-0.5 transition-all animate-fade-up overflow-hidden"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="relative h-28 -mx-5 -mt-5 mb-4 overflow-hidden">
                  <img
                    src={e.cover_url ?? 'https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg?auto=compress&cs=tinysrgb&w=600'}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-700 via-ink-700/40 to-transparent" />
                  <span className="absolute bottom-2 left-3 chip-gold !py-0.5 capitalize">{e.event_type}</span>
                </div>
                <h3 className="font-display text-xl font-semibold text-white">{e.title}</h3>
                <div className="mt-2 space-y-1.5 text-xs text-neutral-400">
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-gold-400" /> {formatDate(e.event_date)}
                  </div>
                  {e.venue && (
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-gold-400" /> {e.venue}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users size={13} className="text-gold-400" /> {e.guest_count} guests
                  </div>
                </div>
                {e.budget > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-neutral-400">
                        <Wallet size={12} /> Budget
                      </span>
                      <span className="text-neutral-300">
                        {formatINR(spend[e.id] ?? 0)} / {formatINR(e.budget)}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          pct > 90 ? 'bg-orange-500' : 'bg-gold-gradient'
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create new event" size="md">
        {error && <Alert variant="error" className="mb-4">{error}</Alert>}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Event name</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="e.g. Kavya & Arjun Wedding" />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Event type</label>
            <div className="grid grid-cols-3 gap-2">
              {eventTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setForm({ ...form, event_type: t.value as Event['event_type'] })}
                  className={cn(
                    'rounded-lg py-2 text-xs font-medium transition-all',
                    form.event_type === t.value
                      ? 'bg-gold-400/15 border border-gold-400/50 text-gold-200'
                      : 'bg-black/30 border border-white/8 text-neutral-400'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Date</label>
              <input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">City</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-field" placeholder="Mumbai" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Venue</label>
            <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="input-field" placeholder="Venue name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Budget (₹)</label>
              <input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="input-field" placeholder="1000000" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Guests</label>
              <input type="number" value={form.guest_count} onChange={(e) => setForm({ ...form, guest_count: e.target.value })} className="input-field" placeholder="300" />
            </div>
          </div>
          <button onClick={submit} disabled={submitting} className="btn-gold w-full">
            {submitting ? <Spinner size={16} className="!text-black" /> : 'Create event'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
