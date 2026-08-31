import { useEffect, useState } from 'react';
import { Check, X, Clock, DollarSign, MessageSquare, Send, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import type { Booking, Profile, Vendor, Message } from '@/lib/types';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { formatINR, formatDate, relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

const statusConfig = {
  pending: { label: 'Pending', cls: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
  confirmed: { label: 'Confirmed', cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
  completed: { label: 'Completed', cls: 'text-sky-300 bg-sky-500/10 border-sky-500/30' },
  cancelled: { label: 'Cancelled', cls: 'text-neutral-400 bg-white/5 border-white/10' },
  rejected: { label: 'Rejected', cls: 'text-red-300 bg-red-500/10 border-red-500/30' },
  rescheduled: { label: 'Rescheduled', cls: 'text-orange-300 bg-orange-500/10 border-orange-500/30' },
};

export function VendorBookingsPage() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<(Booking & { customer?: Profile; vendor?: Vendor })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actionBooking, setActionBooking] = useState<(Booking & { customer?: Profile; vendor?: Vendor }) | null>(null);
  const [actionType, setActionType] = useState<'quote' | 'message' | null>(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [vendorNotes, setVendorNotes] = useState('');
  const [msgText, setMsgText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!profile) return;
    const { data: vs } = await supabase.from('vendors').select('id').eq('owner_id', profile.id);
    const vendorIds = ((vs as Vendor[]) ?? []).map((v) => v.id);
    if (vendorIds.length === 0) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('bookings')
      .select('*, customer:profiles!bookings_customer_id_fkey(id,full_name,avatar_url,phone), vendor:vendors(id,business_name,logo_url,city,slug)')
      .in('vendor_id', vendorIds)
      .order('created_at', { ascending: false });
    setBookings((data as (Booking & { customer?: Profile; vendor?: Vendor })[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const updateStatus = async (booking: Booking, status: Booking['status'], extra?: Record<string, unknown>) => {
    setBusy(true);
    const { error } = await supabase
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString(), ...extra })
      .eq('id', booking.id);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    // notify customer
    await supabase.from('notifications').insert({
      user_id: booking.customer_id,
      type: `booking_${status}`,
      title: `Your booking has been ${status}`,
      body: `Status update for your booking with ${bookings.find((b) => b.id === booking.id)?.vendor?.business_name ?? 'a vendor'}.`,
      data: { booking_id: booking.id },
    });
    load();
  };

  const sendQuote = async () => {
    if (!actionBooking) return;
    setBusy(true);
    const { error } = await supabase
      .from('bookings')
      .update({
        quoted_amount: Number(quoteAmount),
        amount: Number(quoteAmount),
        deposit: Number(quoteAmount) * 0.2,
        vendor_notes: vendorNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', actionBooking.id);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    await supabase.from('notifications').insert({
      user_id: actionBooking.customer_id,
      type: 'quote_received',
      title: 'You received a quote',
      body: `Quote of ${formatINR(Number(quoteAmount))} for your booking.`,
      data: { booking_id: actionBooking.id },
    });
    setActionBooking(null);
    setQuoteAmount('');
    setVendorNotes('');
    load();
  };

  const sendMessage = async () => {
    if (!profile || !actionBooking || !msgText.trim()) return;
    const text = msgText.trim();
    setMsgText('');
    const { data } = await supabase
      .from('messages')
      .insert({ booking_id: actionBooking.id, sender_id: profile.id, body: text })
      .select('*')
      .single();
    if (data) setMessages((prev) => [...prev, data as Message]);
    await supabase.from('notifications').insert({
      user_id: actionBooking.customer_id,
      type: 'new_message',
      title: 'New message from vendor',
      body: text.slice(0, 100),
      data: { booking_id: actionBooking.id },
    });
  };

  const openMessage = async (b: Booking & { customer?: Profile; vendor?: Vendor }) => {
    setActionBooking(b);
    setActionType('message');
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('booking_id', b.id)
      .order('created_at', { ascending: true });
    setMessages((data as Message[]) ?? []);
  };

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  if (loading) return <Spinner size={28} label="Loading bookings" className="py-20" />;

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white">Bookings</h1>
        <p className="mt-2 text-neutral-400">Manage incoming requests, quotes, and confirmations.</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex gap-2 overflow-x-auto hide-scrollbar animate-fade-up">
        {[
          { key: 'pending', label: 'Pending' },
          { key: 'confirmed', label: 'Confirmed' },
          { key: 'completed', label: 'Completed' },
          { key: 'cancelled', label: 'Cancelled' },
          { key: 'all', label: 'All' },
        ].map((t) => {
          const count = t.key === 'all' ? bookings.length : bookings.filter((b) => b.status === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all',
                filter === t.key
                  ? 'bg-gold-400/15 border border-gold-400/50 text-gold-200'
                  : 'bg-white/5 border border-white/8 text-neutral-400'
              )}
            >
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No bookings here"
          description={filter === 'pending' ? 'No pending requests right now.' : 'Bookings will appear here as customers book your services.'}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((b, i) => {
            const cfg = statusConfig[b.status];
            return (
              <div key={b.id} className="card animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {b.customer?.avatar_url ? (
                      <img src={b.customer.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover" />
                    ) : (
                      <div className="grid place-items-center w-11 h-11 rounded-full bg-gold-400/15 text-gold-300 text-sm font-semibold">
                        {(b.customer?.full_name ?? 'A')[0]}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white truncate">{b.customer?.full_name ?? 'Customer'}</p>
                      <p className="text-xs text-neutral-500 truncate">{b.vendor?.business_name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                        <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(b.event_date)}</span>
                        <span className="flex items-center gap-1 text-gold-300"><DollarSign size={11} /> {formatINR(b.amount)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border', cfg.cls)}>
                      {cfg.label}
                    </span>
                  </div>
                </div>

                {b.customer_notes && (
                  <p className="mt-3 text-xs text-neutral-400 bg-black/20 rounded-lg p-2.5">
                    <span className="text-neutral-500">Customer note:</span> {b.customer_notes}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2">
                  {b.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(b, 'confirmed')} disabled={busy} className="btn-gold !py-2 !px-3 text-xs">
                        <Check size={13} /> Accept
                      </button>
                      <button onClick={() => { setActionBooking(b); setActionType('quote'); setQuoteAmount(String(b.amount)); }} className="btn-outline-gold !py-2 !px-3 text-xs">
                        <DollarSign size={13} /> Send quote
                      </button>
                      <button onClick={() => updateStatus(b, 'rejected')} disabled={busy} className="btn-ghost !py-2 !px-3 text-xs !text-red-300">
                        <X size={13} /> Reject
                      </button>
                    </>
                  )}
                  {b.status === 'confirmed' && (
                    <button onClick={() => updateStatus(b, 'completed')} disabled={busy} className="btn-gold !py-2 !px-3 text-xs">
                      <Check size={13} /> Mark completed
                    </button>
                  )}
                  {(b.status === 'confirmed' || b.status === 'pending') && (
                    <button onClick={() => openMessage(b)} className="btn-ghost !py-2 !px-3 text-xs">
                      <MessageSquare size={13} /> Message
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quote modal */}
      {actionBooking && actionType === 'quote' && (
        <Modal open onClose={() => { setActionBooking(null); setActionType(null); }} title="Send a quote" size="sm">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Quote amount (₹)</label>
              <input type="number" value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Notes for customer (optional)</label>
              <textarea value={vendorNotes} onChange={(e) => setVendorNotes(e.target.value)} rows={3} className="input-field resize-none" placeholder="What's included, terms, etc." />
            </div>
            <button onClick={sendQuote} disabled={busy} className="btn-gold w-full">
              {busy ? <Spinner size={16} className="!text-black" /> : 'Send quote'}
            </button>
          </div>
        </Modal>
      )}

      {/* Message modal */}
      {actionBooking && actionType === 'message' && (
        <Modal open onClose={() => { setActionBooking(null); setActionType(null); }} title="Messages" subtitle={`With ${actionBooking.customer?.full_name ?? 'customer'}`} size="md">
          <div className="space-y-3 max-h-80 overflow-y-auto mb-4 hide-scrollbar">
            {messages.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-6">No messages yet.</p>
            ) : (
              messages.map((m) => {
                const mine = m.sender_id === profile?.id;
                return (
                  <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                    <div className={cn('max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm', mine ? 'bg-gold-gradient text-black' : 'bg-white/5 text-neutral-200')}>
                      <p>{m.body}</p>
                      <p className={cn('text-[10px] mt-1', mine ? 'text-black/60' : 'text-neutral-600')}>{relativeTime(m.created_at)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="flex gap-2">
            <input value={msgText} onChange={(e) => setMsgText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} className="input-field !py-2.5" placeholder="Type a message…" />
            <button onClick={sendMessage} className="btn-gold !px-3"><Send size={16} /></button>
          </div>
        </Modal>
      )}
    </div>
  );
}
