import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Wallet,
  Plus,
  Check,
  Sparkles,
  Trash2,
  Edit2,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import type { Event, EventTask, Booking, Vendor } from '@/lib/types';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { formatDate, formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';

const aiChecklistTemplates: Record<string, { title: string; category: string }[]> = {
  wedding: [
    { title: 'Finalize guest list', category: 'Planning' },
    { title: 'Book wedding venue', category: 'Venue' },
    { title: 'Book photographer & videographer', category: 'Vendors' },
    { title: 'Book caterer and finalize menu', category: 'Catering' },
    { title: 'Book decorator for stage and mandap', category: 'Decor' },
    { title: 'Book makeup artist and mehendi artist', category: 'Beauty' },
    { title: 'Order wedding invitations', category: 'Stationery' },
    { title: 'Finalize bridal and groom attire', category: 'Attire' },
    { title: 'Book DJ or live band', category: 'Entertainment' },
    { title: 'Arrange priest for ceremonies', category: 'Ceremony' },
    { title: 'Plan transport for guests', category: 'Logistics' },
    { title: 'Buy return gifts', category: 'Gifting' },
    { title: 'Final venue walkthrough', category: 'Venue' },
    { title: 'Bridal makeup trial', category: 'Beauty' },
  ],
  engagement: [
    { title: 'Book engagement venue', category: 'Venue' },
    { title: 'Book photographer', category: 'Vendors' },
    { title: 'Order engagement ring', category: 'Shopping' },
    { title: 'Send invitations', category: 'Stationery' },
    { title: 'Book caterer', category: 'Catering' },
    { title: 'Book decorator', category: 'Decor' },
  ],
  reception: [
    { title: 'Book reception hall', category: 'Venue' },
    { title: 'Book photographer', category: 'Vendors' },
    { title: 'Finalize catering and bar', category: 'Catering' },
    { title: 'Book DJ', category: 'Entertainment' },
    { title: 'Stage and entrance decor', category: 'Decor' },
  ],
  birthday: [
    { title: 'Book party venue', category: 'Venue' },
    { title: 'Order birthday cake', category: 'Catering' },
    { title: 'Book photographer', category: 'Vendors' },
    { title: 'Plan decor and theme', category: 'Decor' },
    { title: 'Send invitations', category: 'Stationery' },
  ],
  corporate: [
    { title: 'Book event venue', category: 'Venue' },
    { title: 'Arrange AV and stage', category: 'Logistics' },
    { title: 'Book caterer', category: 'Catering' },
    { title: 'Send attendee invitations', category: 'Stationery' },
    { title: 'Plan decor and branding', category: 'Decor' },
  ],
  other: [
    { title: 'Book venue', category: 'Venue' },
    { title: 'Book photographer', category: 'Vendors' },
    { title: 'Arrange catering', category: 'Catering' },
    { title: 'Plan decor', category: 'Decor' },
  ],
};

export function EventDetailPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [tasks, setTasks] = useState<EventTask[]>([]);
  const [bookings, setBookings] = useState<(Booking & { vendor?: Vendor })[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskOpen, setTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', category: '', due_date: '' });
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data: e } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
    setEvent(e as Event);
    const [t, b] = await Promise.all([
      supabase.from('event_tasks').select('*').eq('event_id', id).order('is_completed').order('due_date', { ascending: true }),
      supabase
        .from('bookings')
        .select('*, vendor:vendors(id,business_name,logo_url,city,slug)')
        .eq('event_id', id)
        .order('created_at', { ascending: false }),
    ]);
    setTasks((t.data as EventTask[]) ?? []);
    setBookings((b.data as (Booking & { vendor?: Vendor })[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleTask = async (task: EventTask) => {
    await supabase.from('event_tasks').update({ is_completed: !task.is_completed }).eq('id', task.id);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, is_completed: !t.is_completed } : t)));
  };

  const deleteTask = async (task: EventTask) => {
    await supabase.from('event_tasks').delete().eq('id', task.id);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  };

  const addTask = async () => {
    if (!id || !newTask.title.trim()) return;
    await supabase.from('event_tasks').insert({
      event_id: id,
      title: newTask.title.trim(),
      category: newTask.category || null,
      due_date: newTask.due_date || null,
    });
    setNewTask({ title: '', category: '', due_date: '' });
    setTaskOpen(false);
    load();
  };

  const generateChecklist = async () => {
    if (!event || !id) return;
    setGenerating(true);
    const template = aiChecklistTemplates[event.event_type] ?? aiChecklistTemplates.other;
    const existing = new Set(tasks.map((t) => t.title.toLowerCase()));
    const toAdd = template.filter((t) => !existing.has(t.title.toLowerCase()));
    if (toAdd.length > 0) {
      await supabase.from('event_tasks').insert(
        toAdd.map((t) => ({
          event_id: id,
          title: t.title,
          category: t.category,
        }))
      );
    }
    setGenerating(false);
    load();
  };

  const totalSpend = bookings.reduce((s, b) => s + (b.amount || 0), 0);
  const budgetPct = event && event.budget > 0 ? Math.min(100, Math.round((totalSpend / event.budget) * 100)) : 0;
  const completedTasks = tasks.filter((t) => t.is_completed).length;

  if (loading) return <Spinner size={28} label="Loading event" className="py-20" />;

  if (!event) {
    return (
      <EmptyState
        title="Event not found"
        action={<Link to="/app/events" className="btn-gold">Back to events</Link>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/app/events" className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white">
        <ArrowLeft size={15} /> All events
      </Link>

      {/* Header */}
      <div className="relative rounded-3xl overflow-hidden h-48 sm:h-56 animate-fade-up">
        <img
          src={event.cover_url ?? 'https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg?auto=compress&cs=tinysrgb&w=1200'}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/50 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 p-6">
          <span className="chip-gold capitalize mb-2">{event.event_type}</span>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-neutral-300">
            <span className="flex items-center gap-1.5"><Calendar size={14} /> {formatDate(event.event_date)}</span>
            {event.venue && <span className="flex items-center gap-1.5"><MapPin size={14} /> {event.venue}</span>}
            <span className="flex items-center gap-1.5"><Users size={14} /> {event.guest_count} guests</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 animate-fade-up">
        <StatCard
          icon={<Wallet size={18} />}
          label="Budget"
          value={formatINR(totalSpend)}
          sub={`of ${formatINR(event.budget)}`}
          progress={budgetPct}
        />
        <StatCard
          icon={<Check size={18} />}
          label="Tasks complete"
          value={`${completedTasks}/${tasks.length}`}
          sub={tasks.length === 0 ? 'No tasks yet' : `${Math.round((completedTasks / tasks.length) * 100)}% done`}
        />
        <StatCard
          icon={<Users size={18} />}
          label="Vendors booked"
          value={String(bookings.length)}
          sub={bookings.length === 0 ? 'None yet' : 'across categories'}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Checklist */}
        <section className="card animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-white">Task checklist</h2>
            <div className="flex gap-2">
              <button onClick={generateChecklist} disabled={generating} className="btn-outline-gold !py-1.5 !px-3 text-xs">
                <Sparkles size={13} /> {generating ? 'Generating…' : 'AI suggest'}
              </button>
              <button onClick={() => setTaskOpen(true)} className="btn-ghost !py-1.5 !px-3 text-xs">
                <Plus size={13} /> Add
              </button>
            </div>
          </div>
          {tasks.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              description="Add tasks manually or let AI generate a checklist for your event type."
              className="!py-8"
            />
          ) : (
            <ul className="space-y-2">
              {tasks.map((t) => (
                <li key={t.id} className="group flex items-center gap-3 rounded-lg p-2 hover:bg-white/5 transition-colors">
                  <button
                    onClick={() => toggleTask(t)}
                    className={cn(
                      'grid place-items-center w-5 h-5 rounded-md border shrink-0 transition-all',
                      t.is_completed ? 'bg-gold-400 border-gold-400 text-black' : 'border-white/20 hover:border-gold-400'
                    )}
                  >
                    {t.is_completed && <Check size={13} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className={cn('text-sm', t.is_completed ? 'text-neutral-500 line-through' : 'text-neutral-200')}>
                      {t.title}
                    </span>
                    {t.category && <span className="ml-2 text-[10px] text-neutral-600">{t.category}</span>}
                  </div>
                  {t.due_date && (
                    <span className="text-xs text-neutral-600">{formatDate(t.due_date)}</span>
                  )}
                  <button
                    onClick={() => deleteTask(t)}
                    className="text-neutral-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Booked vendors */}
        <section className="card animate-fade-up">
          <h2 className="font-display text-xl font-semibold text-white mb-4">Booked services</h2>
          {bookings.length === 0 ? (
            <EmptyState
              title="No bookings linked"
              description="Book vendors and link them to this event to track everything here."
              action={
                <Link to="/app/browse" className="btn-gold text-xs">Browse vendors</Link>
              }
              className="!py-8"
            />
          ) : (
            <ul className="space-y-3">
              {bookings.map((b) => (
                <li key={b.id}>
                  <Link
                    to={`/app/bookings/${b.id}`}
                    className="flex items-center gap-3 rounded-xl p-3 hover:bg-white/5 transition-colors"
                  >
                    {b.vendor?.logo_url ? (
                      <img src={b.vendor.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="grid place-items-center w-10 h-10 rounded-lg bg-gold-400/15 text-gold-300">
                        <Calendar size={16} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">
                        {b.vendor?.business_name ?? 'Vendor'}
                      </div>
                      <div className="text-xs text-neutral-500 truncate">{b.package_title ?? 'Custom booking'}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-gold-300">{formatINR(b.amount)}</div>
                      <span className={cn(
                        'text-[10px] capitalize',
                        b.status === 'confirmed' || b.status === 'completed' ? 'text-emerald-400' : 'text-neutral-500'
                      )}>
                        {b.status}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Modal open={taskOpen} onClose={() => setTaskOpen(false)} title="Add task" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Task</label>
            <input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="input-field" placeholder="e.g. Order invitations" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Category</label>
              <input value={newTask.category} onChange={(e) => setNewTask({ ...newTask, category: e.target.value })} className="input-field" placeholder="Planning" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Due date</label>
              <input type="date" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} className="input-field" />
            </div>
          </div>
          <button onClick={addTask} className="btn-gold w-full">Add task</button>
        </div>
      </Modal>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  progress?: number;
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 text-neutral-400 text-xs">
        <span className="text-gold-400">{icon}</span>
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold text-white">{value}</div>
      {sub && <div className="text-xs text-neutral-500 mt-0.5">{sub}</div>}
      {progress !== undefined && (
        <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className={cn('h-full rounded-full', progress > 90 ? 'bg-orange-500' : 'bg-gold-gradient')}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
