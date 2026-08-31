export type UserRole = 'customer' | 'vendor' | 'admin';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface Vendor {
  id: string;
  owner_id: string;
  category_id: string | null;
  business_name: string;
  slug: string | null;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  gallery: string[];
  city: string | null;
  service_areas: string[];
  contact_phone: string | null;
  contact_email: string | null;
  website: string | null;
  pricing_from: number;
  rating: number;
  review_count: number;
  is_verified: boolean;
  is_approved: boolean;
  is_featured: boolean;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VendorWithCategory extends Vendor {
  category?: Pick<Category, 'id' | 'name' | 'slug' | 'icon'> | null;
}

export interface VendorPackage {
  id: string;
  vendor_id: string;
  title: string;
  description: string | null;
  price: number;
  duration: string | null;
  includes: string[];
  is_popular: boolean;
  created_at: string;
}

export type EventType =
  | 'wedding'
  | 'engagement'
  | 'reception'
  | 'birthday'
  | 'corporate'
  | 'other';

export interface Event {
  id: string;
  customer_id: string;
  title: string;
  event_type: EventType;
  event_date: string | null;
  city: string | null;
  venue: string | null;
  budget: number;
  guest_count: number;
  notes: string | null;
  cover_url: string | null;
  created_at: string;
}

export interface EventTask {
  id: string;
  event_id: string;
  title: string;
  category: string | null;
  due_date: string | null;
  is_completed: boolean;
  created_at: string;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'rescheduled';

export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'paid' | 'refunded';

export interface Booking {
  id: string;
  customer_id: string;
  vendor_id: string;
  package_id: string | null;
  event_id: string | null;
  event_date: string | null;
  status: BookingStatus;
  package_title: string | null;
  amount: number;
  deposit: number;
  quoted_amount: number | null;
  customer_notes: string | null;
  vendor_notes: string | null;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
  vendor?: Pick<Vendor, 'id' | 'business_name' | 'logo_url' | 'city' | 'slug'> | null;
  package?: Pick<VendorPackage, 'id' | 'title' | 'price'> | null;
}

export interface Review {
  id: string;
  customer_id: string;
  vendor_id: string;
  booking_id: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  photos: string[];
  created_at: string;
  customer?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
}

export interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  position: string;
  is_active: boolean;
  sort_order: number;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
}
