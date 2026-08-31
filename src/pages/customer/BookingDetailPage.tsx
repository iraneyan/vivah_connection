import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  DollarSign,
  Send,
  CreditCard,
  Download,
  XCircle,
  MessageSquare,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import type { Booking, Vendor, Message, Profile } from '@/lib/types';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert } from '@/components/ui/Alert';
import { formatINR, formatDateTime, relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

const statusConfig = {
  pending: { label: 'Pending', cls: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
  confirmed: { label: 'Confirmed', cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
  completed: { label: 'Completed', cls: 'text-sky-300 bg-sky-500/10 border-sky-500/30' },
  cancelled: { label: 'Cancelled', cls: 'text-neutral-400 bg-white/5 border-white/10' },
  rejected: { label: 'Rejected', cls: 'text-red-300 bg-red-500/10 border-red-500/30' },
  rescheduled: { label: 'Rescheduled', cls: 'text-orange-300 bg-orange-500/10 border-orange-500/30' },
};

export function BookingDetailPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<(Booking & { vendor?: Vendor }) | null>(null);
  const [messages, setMessages] = useState<(Message & { sender?: Profile })[]>([]);
  const [msgText, setMsgText] = useState('');
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    if (!id) return;
    const { data: b } = await supabase
      .from('bookings')
      .select('*, vendor:vendors(id,business_name,logo_url,city,slug,owner_id)')
      .eq('id', id)
      .maybeSingle();
    setBooking(b as (Booking & { vendor?: Vendor }) | null);
    const { data: msgs } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(id,full_name,avatar_url)')
      .eq('booking_id', id)
      .order('created_at', { ascending: true });
    setMessages((msgs as (Message & { sender?: Profile })[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const sendMessage = async () => {
    if (!profile || !id || !msgText.trim()) return;
    const text = msgText.trim();
    setMsgText('');
    const { data } = await supabase
      .from('messages')
      .insert({ booking_id: id, sender_id: profile.id, body: text })
      .select('*, sender:profiles!messages_sender_id_fkey(id,full_name,avatar_url)')
      .single();
    if (data) setMessages((prev) => [...prev, data as Message & { sender?: Profile }]);
    // notify vendor
    if (booking?.vendor?.owner_id) {
      await supabase.from('notifications').insert({
        user_id: booking.vendor.owner_id,
        type: 'new_message',
        title: 'New message from customer',
        body: text.slice(0, 100),
        data: { booking_id: id },
      });
    }
  };

  const cancelBooking = async () => {
    if (!id) return;
    setAction('cancel');
    setError('');
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id);
    setAction(null);
    if (error) {
      setError(error.message);
      return;
    }
    load();
  };

  const payDeposit = async () => {
    if (!id || !booking) return;
    setAction('pay');
    setError('');
    // Simulate payment — in production this would route to a payment gateway
    const { error } = await supabase
      .from('bookings')
      .update({
        payment_status: 'deposit_paid',
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    setAction(null);
    if (error) {
      setError(error.message);
      return;
    }
    load();
  };

  if (loading) return <Spinner size={28} label="Loading booking" className="py-20" />;

  if (!booking) {
    return (
      <EmptyState
        title="Booking not found"
        action={<Link to="/app/bookings" className="btn-gold">Back to bookings</Link>}
      />
    );
  }

  const cfg = statusConfig[booking.status];
  const isVendorOwner = profile?.id === booking.vendor?.owner_id;

  return (
    <div className="space-y-6">
      <Link to="/app/bookings" className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white">
        <ArrowLeft size={15} /> All bookings
      </Link>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vendor card */}
          <div className="card flex items-center gap-4 animate-fade-up">
            {booking.vendor?.logo_url ? (
              <img src={booking.vendor.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <div className="grid place-items-center w-16 h-16 rounded-xl bg-gold-400/15 text-gold-300">
                <Calendar size={24} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <Link
                to={`/app/vendor/${booking.vendor?.slug}`}
                className="font-display text-xl font-semibold text-white hover:text-gold-300"
              >
                {booking.vendor?.business_name ?? 'Vendor'}
              </Link>
              <p className="text-sm text-neutral-400">{booking.package_title ?? 'Custom request'}</p>
            </div>
            <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border', cfg.cls)}>
              {cfg.label}
            </span>
          </div>

          {/* Details grid */}
          <div className="card animate-fade-up space-y-4">
            <h2 className="font-display text-xl font-semibold text-white">Booking details</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <DetailRow icon={<Calendar size={15} />} label="Event date" value={formatDateTime(booking.event_date)} />
              <DetailRow icon={<DollarSign size={15} />} label="Total amount" value={formatINR(booking.amount)} />
              <DetailRow icon={<CreditCard size={15} />} label="Deposit" value={formatINR(booking.deposit)} />
              <DetailRow
                icon={<CreditCard size={15} />}
                label="Payment status"
                value={
                  <span className={cn(
                    'capitalize',
                    booking.payment_status === 'paid' || booking.payment_status === 'deposit_paid'
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  )}>
                    {booking.payment_status.replace('_', ' ')}
                  </span>
                }
              />
              {booking.vendor?.city && (
                <DetailRow icon={<MapPin size={15} />} label="City" value={booking.vendor.city} />
              )}
              <DetailRow icon={<Calendar size={15} />} label="Booked on" value={formatDateTime(booking.created_at)} />
            </div>
            {booking.customer_notes && (
              <div className="pt-4 border-t border-white/5">
                <p className="text-xs font-medium text-neutral-400 mb-1">Your notes</p>
                <p className="text-sm text-neutral-300">{booking.customer_notes}</p>
              </div>
            )}
            {booking.vendor_notes && (
              <div className="pt-4 border-t border-white/5">
                <p className="text-xs font-medium text-neutral-400 mb-1">Vendor notes</p>
                <p className="text-sm text-neutral-300">{booking.vendor_notes}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 animate-fade-up">
            {(booking.status === 'pending' || booking.status === 'confirmed') && booking.payment_status === 'unpaid' && (
              <button onClick={payDeposit} disabled={action === 'pay'} className="btn-gold">
                {action === 'pay' ? <Spinner size={16} className="!text-black" /> : <><CreditCard size={16} /> Pay deposit {formatINR(booking.deposit)}</>}
              </button>
            )}
            {(booking.payment_status === 'deposit_paid' || booking.payment_status === 'paid') && (
              <button className="btn-ghost">
                <Download size={16} /> Download invoice
              </button>
            )}
            {(booking.status === 'pending' || booking.status === 'confirmed') && !isVendorOwner && (
              <button onClick={cancelBooking} disabled={action === 'cancel'} className="btn-ghost !text-red-300 hover:!border-red-500/40">
                {action === 'cancel' ? <Spinner size={16} /> : <><XCircle size={16} /> Cancel booking</>}
              </button>
            )}
          </div>
        </div>

        {/* Right: messages */}
        <aside className="card flex flex-col animate-fade-up" style={{ minHeight: '400px' }}>
          <h2 className="font-display text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <MessageSquare size={18} className="text-gold-400" /> Messages
          </h2>
          <div className="flex-1 space-y-3 overflow-y-auto max-h-80 mb-4 hide-scrollbar">
            {messages.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-8">
                No messages yet. Start the conversation below.
              </p>
            ) : (
              messages.map((m) => {
                const mine = m.sender_id === profile?.id;
                return (
                  <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                    <div className={cn('max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm', mine ? 'bg-gold-gradient text-black' : 'bg-white/5 text-neutral-200')}>
                      <p>{m.body}</p>
                      <p className={cn('text-[10px] mt-1', mine ? 'text-black/60' : 'text-neutral-600')}>
                        {relativeTime(m.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message…"
              className="input-field !py-2.5"
            />
            <button onClick={sendMessage} className="btn-gold !px-3 shrink-0">
              <Send size={16} />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-neutral-500 text-xs">
        <span className="text-gold-400">{icon}</span>
        {label}
      </div>
      <div className="mt-1 text-white font-medium">{value}</div>
    </div>
  );
}
