import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Star,
  CheckCircle2,
  MessageSquare,
  Share2,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import type { VendorWithCategory, VendorPackage, Review } from '@/lib/types';
import { StarRating } from '@/components/ui/StarRating';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { BookingModal } from '@/components/vendor/BookingModal';
import { formatINR, formatDate, relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

export function VendorDetailPage() {
  const { slug } = useParams();
  const { profile } = useAuth();
  const [vendor, setVendor] = useState<VendorWithCategory | null>(null);
  const [packages, setPackages] = useState<VendorPackage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [preselectedPkg, setPreselectedPkg] = useState<VendorPackage | null>(null);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    (async () => {
      setLoading(true);
      const { data: v } = await supabase
        .from('vendors')
        .select('*, category:categories(id,name,slug,icon)')
        .eq('slug', slug)
        .maybeSingle();
      if (!active) return;
      setVendor(v as VendorWithCategory);
      if (v) {
        const [pkgs, revs] = await Promise.all([
          supabase.from('vendor_packages').select('*').eq('vendor_id', v.id).order('price'),
          supabase
            .from('reviews')
            .select('*, customer:profiles!reviews_customer_id_fkey(id,full_name,avatar_url)')
            .eq('vendor_id', v.id)
            .order('created_at', { ascending: false }),
        ]);
        if (active) {
          setPackages((pkgs.data as VendorPackage[]) ?? []);
          setReviews((revs.data as Review[]) ?? []);
        }
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) return <Spinner size={28} label="Loading vendor" className="py-20" />;

  if (!vendor) {
    return (
      <EmptyState
        title="Vendor not found"
        description="This listing may have been removed or is not yet approved."
        action={<Link to="/app/browse" className="btn-gold">Browse vendors</Link>}
      />
    );
  }

  const gallery = vendor.gallery?.length ? vendor.gallery : [vendor.cover_url, vendor.logo_url].filter(Boolean) as string[];

  const startBooking = (pkg?: VendorPackage) => {
    setPreselectedPkg(pkg ?? null);
    setBookingOpen(true);
  };

  return (
    <div className="space-y-8">
      <Link to="/app/browse" className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white">
        <ArrowLeft size={15} /> Back to browse
      </Link>

      {/* Cover + header */}
      <div className="relative rounded-3xl overflow-hidden h-64 sm:h-80 lg:h-96 animate-fade-up">
        <img src={gallery[activeImage] ?? ''} alt={vendor.business_name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/40 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {vendor.is_verified && (
                  <span className="chip-gold !py-0.5">
                    <ShieldCheck size={11} /> Verified
                  </span>
                )}
                {vendor.is_featured && <span className="chip-orange !py-0.5">Featured</span>}
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white">
                {vendor.business_name}
              </h1>
              <p className="text-neutral-300 mt-1.5 max-w-xl">{vendor.tagline}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <CategoryIcon name={vendor.category?.icon} size={14} /> {vendor.category?.name}
                </span>
                {vendor.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} /> {vendor.city}
                  </span>
                )}
                <StarRating rating={vendor.rating} showValue reviewCount={vendor.review_count} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startBooking()} className="btn-ghost">
                <MessageSquare size={15} /> Quote
              </button>
              <button onClick={() => startBooking()} className="btn-gold">
                <Calendar size={15} /> Book now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery thumbnails */}
      {gallery.length > 1 && (
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
          {gallery.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImage(i)}
              className={cn(
                'shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all',
                i === activeImage ? 'border-gold-400' : 'border-transparent opacity-60 hover:opacity-100'
              )}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: about + packages + reviews */}
        <div className="lg:col-span-2 space-y-8">
          {/* About */}
          <section className="card animate-fade-up">
            <h2 className="font-display text-2xl font-semibold text-white mb-3">About</h2>
            <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
              {vendor.description}
            </p>
            {vendor.service_areas.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-medium text-neutral-400 mb-2">Service areas</p>
                <div className="flex flex-wrap gap-2">
                  {vendor.service_areas.map((a) => (
                    <span key={a} className="chip">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Packages */}
          <section className="animate-fade-up">
            <h2 className="font-display text-2xl font-semibold text-white mb-4">Packages</h2>
            {packages.length === 0 ? (
              <div className="card text-sm text-neutral-400">
                No fixed packages — request a custom quote for this vendor.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {packages.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      'card relative',
                      p.is_popular && 'border-gold-400/40'
                    )}
                  >
                    {p.is_popular && (
                      <span className="absolute -top-2.5 left-4 chip-gold !py-0.5">Most popular</span>
                    )}
                    <h3 className="font-display text-xl font-semibold text-white">{p.title}</h3>
                    {p.duration && <p className="text-xs text-neutral-500 mt-0.5">{p.duration}</p>}
                    {p.description && (
                      <p className="text-sm text-neutral-400 mt-2">{p.description}</p>
                    )}
                    {p.includes.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {p.includes.map((inc) => (
                          <li key={inc} className="flex items-start gap-2 text-xs text-neutral-300">
                            <CheckCircle2 size={13} className="text-gold-400 shrink-0 mt-0.5" />
                            {inc}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-neutral-500">Price</div>
                        <div className="font-display text-xl font-semibold text-gold-300">
                          {formatINR(p.price)}
                        </div>
                      </div>
                      <button onClick={() => startBooking(p)} className="btn-outline-gold !py-2 !px-4">
                        Book
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Reviews */}
          <section className="animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl font-semibold text-white">
                Reviews ({reviews.length})
              </h2>
              <button onClick={() => setReviewOpen(true)} className="btn-ghost text-xs">
                <Star size={14} /> Write a review
              </button>
            </div>
            {reviews.length === 0 ? (
              <EmptyState
                title="No reviews yet"
                description="Be the first to share your experience with this vendor."
                className="!py-10"
              />
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="card">
                    <div className="flex items-start gap-3">
                      {r.customer?.avatar_url ? (
                        <img
                          src={r.customer.avatar_url}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover gold-border shrink-0"
                        />
                      ) : (
                        <div className="grid place-items-center w-9 h-9 rounded-full bg-gold-400/15 text-gold-300 shrink-0 text-xs font-semibold">
                          {(r.customer?.full_name ?? 'A')[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-white">
                            {r.customer?.full_name ?? 'Anonymous'}
                          </span>
                          <span className="text-xs text-neutral-600">
                            {relativeTime(r.created_at)}
                          </span>
                        </div>
                        <StarRating rating={r.rating} size={12} className="mt-1" />
                        {r.title && (
                          <p className="text-sm font-medium text-white mt-2">{r.title}</p>
                        )}
                        {r.body && (
                          <p className="text-sm text-neutral-400 mt-1">{r.body}</p>
                        )}
                        {r.photos.length > 0 && (
                          <div className="flex gap-2 mt-3">
                            {r.photos.map((ph, i) => (
                              <img
                                key={i}
                                src={ph}
                                alt=""
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right: contact + pricing */}
        <aside className="space-y-5">
          <div className="card sticky top-24 animate-fade-up">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <div className="text-xs text-neutral-500">Starting from</div>
                <div className="font-display text-3xl font-semibold text-gold-300">
                  {formatINR(vendor.pricing_from)}
                </div>
              </div>
              <StarRating rating={vendor.rating} showValue />
            </div>
            <div className="space-y-2">
              <button onClick={() => startBooking()} className="btn-gold w-full">
                <Calendar size={16} /> Book now
              </button>
              <button onClick={() => startBooking()} className="btn-ghost w-full">
                <MessageSquare size={16} /> Request custom quote
              </button>
            </div>

            <div className="mt-5 pt-5 border-t border-white/5 space-y-3 text-sm">
              {vendor.contact_phone && (
                <a href={`tel:${vendor.contact_phone}`} className="flex items-center gap-3 text-neutral-300 hover:text-gold-300">
                  <Phone size={15} className="text-gold-400" /> {vendor.contact_phone}
                </a>
              )}
              {vendor.contact_email && (
                <a href={`mailto:${vendor.contact_email}`} className="flex items-center gap-3 text-neutral-300 hover:text-gold-300">
                  <Mail size={15} className="text-gold-400" /> {vendor.contact_email}
                </a>
              )}
              {vendor.website && (
                <a href={vendor.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-neutral-300 hover:text-gold-300">
                  <Globe size={15} className="text-gold-400" /> Visit website
                </a>
              )}
            </div>

            <button
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
              className="mt-4 w-full flex items-center justify-center gap-2 text-xs text-neutral-500 hover:text-gold-300 transition-colors"
            >
              <Share2 size={13} /> Share this listing
            </button>
          </div>
        </aside>
      </div>

      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        vendor={vendor}
        packages={packages}
        preselectedPackage={preselectedPkg}
      />

      <ReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        vendor={vendor}
        onSubmitted={() => {
          // refresh reviews
          if (slug) {
            supabase
              .from('reviews')
              .select('*, customer:profiles!reviews_customer_id_fkey(id,full_name,avatar_url)')
              .eq('vendor_id', vendor.id)
              .order('created_at', { ascending: false })
              .then(({ data }) => setReviews((data as Review[]) ?? []));
          }
        }}
        canReview={!!profile}
      />
    </div>
  );
}

function ReviewModal({
  open,
  onClose,
  vendor,
  onSubmitted,
  canReview,
}: {
  open: boolean;
  onClose: () => void;
  vendor: VendorWithCategory;
  onSubmitted: () => void;
  canReview: boolean;
}) {
  const { profile } = useAuth();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!profile) return;
    setError('');
    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      customer_id: profile.id,
      vendor_id: vendor.id,
      rating,
      title: title || null,
      body: body || null,
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    onSubmitted();
    setTimeout(() => {
      setDone(false);
      setTitle('');
      setBody('');
      setRating(5);
      onClose();
    }, 1500);
  };

  return (
    <Modal open={open} onClose={onClose} title="Write a review" subtitle={vendor.business_name} size="md">
      {!canReview ? (
        <Alert variant="warning">You need to be signed in to leave a review.</Alert>
      ) : done ? (
        <div className="text-center py-6">
          <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
          <p className="text-white font-semibold">Review submitted!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2">Your rating</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={28}
                    className={n <= rating ? 'text-gold-400 fill-gold-400' : 'text-neutral-700 fill-neutral-800'}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Title (optional)</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Summarize your experience" />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Your review</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="input-field resize-none" placeholder="Share details about your experience…" />
          </div>
          <button onClick={submit} disabled={submitting} className="btn-gold w-full">
            {submitting ? <Spinner size={16} className="!text-black" /> : 'Submit review'}
          </button>
        </div>
      )}
    </Modal>
  );
}
