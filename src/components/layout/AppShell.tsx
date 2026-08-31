import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarCheck,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Store,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import type { Notification } from '@/lib/types';
import { cn } from '@/lib/utils';
import { relativeTime } from '@/lib/format';

const customerNav = [
  { to: '/app', label: 'Discover', end: true },
  { to: '/app/categories', label: 'Categories' },
  { to: '/app/events', label: 'My Events' },
  { to: '/app/bookings', label: 'Bookings' },
];

const vendorNav = [
  { to: '/vendor', label: 'Dashboard', end: true },
  { to: '/vendor/listings', label: 'Listings' },
  { to: '/vendor/bookings', label: 'Bookings' },
  { to: '/vendor/analytics', label: 'Analytics' },
];

const adminNav = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/vendors', label: 'Vendors' },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/banners', label: 'Banners' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const role = profile?.role ?? 'customer';
  const navItems =
    role === 'vendor' ? vendorNav : role === 'admin' ? adminNav : customerNav;
  const basePath = role === 'vendor' ? '/vendor' : role === 'admin' ? '/admin' : '/app';

  useEffect(() => {
    setMobileOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(8);
      if (active && data) setNotifications(data as Notification[]);
    })();
    return () => {
      active = false;
    };
  }, [profile]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    if (!profile || unreadCount === 0) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', profile.id)
      .eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-ink-800">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-ink-800/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link to={basePath} className="flex items-center gap-2.5 shrink-0">
              <div className="grid place-items-center w-9 h-9 rounded-lg bg-gold-gradient text-black font-display font-bold text-lg shadow-gold">
                V
              </div>
              <div className="hidden sm:block leading-tight">
                <div className="font-display text-lg font-semibold text-white">
                  Vivah <span className="gold-text">Connect</span>
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-gold-500/70">
                  {role === 'vendor' ? 'Vendor Studio' : role === 'admin' ? 'Admin Console' : 'Marketplace'}
                </div>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'text-gold-300 bg-gold-400/10'
                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => {
                    setNotifOpen((o) => !o);
                    if (!notifOpen) markAllRead();
                  }}
                  className="relative grid place-items-center w-10 h-10 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 grid place-items-center min-w-[16px] h-4 px-1 rounded-full bg-orange-500 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 glass-gold rounded-2xl shadow-card overflow-hidden animate-scale-in">
                    <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">Notifications</span>
                      {notifications.length === 0 && (
                        <span className="text-xs text-neutral-500">All caught up</span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-neutral-500">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className="px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-start gap-2">
                              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-gold-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                  {n.title}
                                </p>
                                {n.body && (
                                  <p className="text-xs text-neutral-400 mt-0.5 line-clamp-2">
                                    {n.body}
                                  </p>
                                )}
                                <p className="text-[10px] text-neutral-600 mt-1">
                                  {relativeTime(n.created_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-white/5 transition-colors"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover gold-border"
                    />
                  ) : (
                    <div className="grid place-items-center w-8 h-8 rounded-full bg-gold-400/15 text-gold-300">
                      <UserIcon size={16} />
                    </div>
                  )}
                  <ChevronDown size={14} className="text-neutral-500 hidden sm:block" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-60 glass-gold rounded-2xl shadow-card overflow-hidden animate-scale-in">
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-sm font-semibold text-white truncate">
                        {profile?.full_name ?? 'User'}
                      </p>
                      <p className="text-xs text-neutral-500 capitalize">{role}</p>
                    </div>
                    <div className="py-1">
                      {role === 'customer' && (
                        <>
                          <MenuItem icon={<UserIcon size={15} />} to="/app/profile" label="My Profile" />
                          <MenuItem icon={<CalendarCheck size={15} />} to="/app/bookings" label="My Bookings" />
                        </>
                      )}
                      {role === 'vendor' && (
                        <MenuItem icon={<Store size={15} />} to="/vendor/listings" label="My Listings" />
                      )}
                      {role === 'admin' && (
                        <MenuItem icon={<LayoutDashboard size={15} />} to="/admin" label="Dashboard" />
                      )}
                    </div>
                    <div className="py-1 border-t border-white/5">
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-300 hover:text-red-300 hover:bg-red-500/5 transition-colors"
                      >
                        <LogOut size={15} /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen((o) => !o)}
                className="md:hidden grid place-items-center w-10 h-10 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-white/5 bg-ink-800/95 backdrop-blur-xl animate-fade-in">
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'text-gold-300 bg-gold-400/10'
                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-red-300 hover:bg-red-500/5 transition-colors"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">{children}</main>
    </div>
  );
}

function MenuItem({
  icon,
  to,
  label,
}: {
  icon: React.ReactNode;
  to: string;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
    >
      {icon} {label}
    </Link>
  );
}
