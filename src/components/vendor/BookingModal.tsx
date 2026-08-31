import { useEffect, useState } from 'react';
import { Calendar, Check, MessageSquare, Sparkles } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { formatINR } from '@/lib/format';
import type { Vendor, VendorPackage, Event, Booking } from '@/lib/types';
import { cn } from '@/lib/utils';

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  vendor: Vendor;
  packages: VendorPackage[];
  preselectedPackage?: VendorPackage | null;
}

export function BookingModal({
  open,
  onClose,
  vendor,
  packages,
  preselectedPackage,
}: BookingModalProps) {
  const { profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<Booking | null>(null);

  const [selectedPkg, setSelectedPkg] = useState<VendorPackage | null>(null);
  const [eventId, setEventId] = useState<string>('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [mode, setMode] = useState<'book' | 'quote'>('quote');

  useEffect(() => {
    if (!open || !profile) return;
    setSelectedPkg(preselectedPackage ?? null);
    setError('');
    setSuccess(null);
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('customer_id', profile.id)
        .order('event_date', { ascending: true });
      setEvents((data as Event[]) ?? []);
      setLoading(false);
    })();
  }, [open, profile, preselectedPackage]);

  const selectedPkgObj = packages.find((p) => p.id === selectedPkg?.id) ?? null;

  const submit = async () => {
    setError('');
    if (!profile) return;
    if (!date) {
      setError('Please choose an event date.');
      return;
    }
    setSubmitting(true);
    const payload = {
      vendor_id: vendor.id,
      package_id: selectedPkgObj?.id ?? null,
      event_id: eventId || null,
      event_date: date,
      status: mode === 'book' ? 'pending' : 'pending',
      package_title: selectedPkgObj?.title ?? null,
      amount: selectedPkgObj?.price ?? vendor.pricing_from,
      deposit: mode === 'book' ? (selectedPkgObj?.price ?? vendor.pricing_from) * 0.2 : 0,
      customer_notes: notes,
      payment_status: 'unpaid',
    };
    const { data, error } = await supabase
      .from('bookings')
      .insert(payload)
      .select('*')
      .single();
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    // notify vendor owner
    await supabase.from('notifications').insert({
      user_id: vendor.owner_id,
      type: 'new_booking',
      title: `New ${mode === 'book' ? 'booking' : 'quote request'} — ${vendor.business_name}`,
      body: `${profile.full_name ?? 'A customer'} requested ${selectedPkgObj?.title ?? 'a service'} on ${date}.`,
      data: { booking_id: (data as Booking).id, mode },
    });
    setSuccess(data as Booking);
  };

  const close = () => {
    setSuccess(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={success ? undefined : mode === 'book' ? 'Book this vendor' : 'Request a quote'}
      subtitle={
        success
          ? undefined
          : `${vendor.business_name} • ${vendor.city ?? ''}`.trim().replace('• ', '')
      }
      size="lg"
    >
      {success ? (
        <div className="text-center py-6">
          <div className="mx-auto grid place-items-center w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-300 mb-4">
            <Check size={32} />
          </div>
          <h3 className="font-display text-2xl font-semibold text-white">Request sent!</h3>
          <p className="mt-2 text-sm text-neutral-400 max-w-sm mx-auto">
            {mode === 'book'
              ? 'Your booking request has been submitted. The vendor will confirm shortly.'
              : 'Your quote request is on its way. The vendor will respond with a customized quote.'}
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <button onClick={close} className="btn-ghost">
              Close
            </button>
          </div>
        </div>
      ) : loading ? (
        <Spinner size={24} label="Loading your events" className="py-8" />
      ) : (
        <div className="space-y-5">
          {error && <Alert variant="error">{error}</Alert>}

          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/40">
            <button
              onClick={() => setMode('quote')}
              className={cn(
                'rounded-lg py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2',
                mode === 'quote' ? 'bg-gold-gradient text-black' : 'text-neutral-400 hover:text-white'
              )}
            >
              <MessageSquare size={15} /> Request quote
            </button>
            <button
              onClick={() => setMode('book')}
              className={cn(
                'rounded-lg py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2',
                mode === 'book' ? 'bg-gold-gradient text-black' : 'text-neutral-400 hover:text-white'
              )}
            >
              <Calendar size={15} /> Book now
            </button>
          </div>

          {/* Package selection */}
          {packages.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-2">
                Choose a package
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <PackageOption
                  pkg={null}
                  label="Custom request"
                  price={vendor.pricing_from}
                  selected={!selectedPkg}
                  onSelect={() => setSelectedPkg(null)}
                />
                {packages.map((p) => (
                  <PackageOption
                    key={p.id}
                    pkg={p}
                    label={p.title}
                    price={p.price}
                    selected={selectedPkg?.id === p.id}
                    onSelect={() => setSelectedPkg(p)}
                    popular={p.is_popular}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Event date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="input-field"
            />
          </div>

          {/* Event link */}
          {events.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Link to event (optional)
              </label>
              <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="input-field">
                <option value="">No specific event</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id} className="bg-ink-800">
                    {e.title} — {e.event_date}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              {mode === 'quote' ? 'Tell the vendor what you need' : 'Special requests (optional)'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Guest count, venue, timings, any specific requirements…"
              className="input-field resize-none"
            />
          </div>

          {/* Summary */}
          {mode === 'book' && selectedPkgObj && (
            <div className="rounded-xl glass p-4 space-y-2 text-sm">
              <div className="flex justify-between text-neutral-400">
                <span>Package</span>
                <span className="text-white">{selectedPkgObj.title}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Total</span>
                <span className="text-gold-300 font-semibold">{formatINR(selectedPkgObj.price)}</span>
              </div>
              <div className="flex justify-between text-neutral-400 pt-2 border-t border-white/5">
                <span>Deposit due now (20%)</span>
                <span className="text-white">{formatINR(selectedPkgObj.price * 0.2)}</span>
              </div>
            </div>
          )}

          <button onClick={submit} disabled={submitting} className="btn-gold w-full">
            {submitting ? (
              <Spinner size={16} className="!text-black" />
            ) : mode === 'book' ? (
              <>
                <Sparkles size={16} /> Submit booking request
              </>
            ) : (
              <>
                <MessageSquare size={16} /> Request quote
              </>
            )}
          </button>

          <p className="text-xs text-neutral-600 text-center">
            You won't be charged yet. The vendor will confirm and send a payment link.
          </p>
        </div>
      )}
    </Modal>
  );
}

function PackageOption({
  pkg,
  label,
  price,
  selected,
  onSelect,
  popular,
}: {
  pkg: VendorPackage | null;
  label: string;
  price: number;
  selected: boolean;
  onSelect: () => void;
  popular?: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all',
        selected ? 'border-gold-400/60 bg-gold-400/10' : 'border-white/8 bg-black/30 hover:border-white/15'
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={cn(
            'grid place-items-center w-5 h-5 rounded-full border shrink-0',
            selected ? 'border-gold-400 bg-gold-400 text-black' : 'border-white/20'
          )}
        >
          {selected && <Check size={12} />}
        </div>
        <span className="text-sm font-medium text-white truncate">{label}</span>
        {popular && <span className="chip-orange !py-0 !px-1.5 !text-[10px]">Popular</span>}
      </div>
      <span className="text-sm font-semibold text-gold-300 shrink-0">
        {pkg ? formatINR(price) : `from ${formatINR(price)}`}
      </span>
    </button>
  );
}
