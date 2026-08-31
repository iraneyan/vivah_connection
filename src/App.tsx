import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';

// Customer
import { CustomerHome } from '@/pages/customer/CustomerHome';
import { CategoryBrowsePage } from '@/pages/customer/CategoryBrowsePage';
import { VendorBrowsePage } from '@/pages/customer/VendorBrowsePage';
import { VendorDetailPage } from '@/pages/customer/VendorDetailPage';
import { EventsPage } from '@/pages/customer/EventsPage';
import { EventDetailPage } from '@/pages/customer/EventDetailPage';
import { BookingsPage } from '@/pages/customer/BookingsPage';
import { BookingDetailPage } from '@/pages/customer/BookingDetailPage';
import { ProfilePage } from '@/pages/customer/ProfilePage';

// Vendor
import { VendorDashboard } from '@/pages/vendor/VendorDashboard';
import { VendorListingsPage } from '@/pages/vendor/VendorListingsPage';
import { VendorBookingsPage } from '@/pages/vendor/VendorBookingsPage';
import { VendorAnalyticsPage } from '@/pages/vendor/VendorAnalyticsPage';

// Admin
import { AdminOverview } from '@/pages/admin/AdminOverview';
import { AdminVendorsPage } from '@/pages/admin/AdminVendorsPage';
import { AdminBookingsPage } from '@/pages/admin/AdminBookingsPage';
import { AdminBannersPage } from '@/pages/admin/AdminBannersPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route path="/auth" element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route path="forgot" element={<ForgotPasswordPage />} />
          </Route>

          {/* Customer */}
          <Route
            path="/app"
            element={
              <ProtectedRoute roles={['customer']}>
                <AppShell>
                  <CustomerHome />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/categories"
            element={
              <ProtectedRoute roles={['customer']}>
                <AppShell>
                  <CategoryBrowsePage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/browse"
            element={
              <ProtectedRoute roles={['customer']}>
                <AppShell>
                  <VendorBrowsePage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/vendor/:slug"
            element={
              <ProtectedRoute roles={['customer']}>
                <AppShell>
                  <VendorDetailPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/events"
            element={
              <ProtectedRoute roles={['customer']}>
                <AppShell>
                  <EventsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/events/:id"
            element={
              <ProtectedRoute roles={['customer']}>
                <AppShell>
                  <EventDetailPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/bookings"
            element={
              <ProtectedRoute roles={['customer']}>
                <AppShell>
                  <BookingsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/bookings/:id"
            element={
              <ProtectedRoute roles={['customer']}>
                <AppShell>
                  <BookingDetailPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/profile"
            element={
              <ProtectedRoute roles={['customer']}>
                <AppShell>
                  <ProfilePage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Vendor */}
          <Route
            path="/vendor"
            element={
              <ProtectedRoute roles={['vendor']}>
                <AppShell>
                  <VendorDashboard />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/listings"
            element={
              <ProtectedRoute roles={['vendor']}>
                <AppShell>
                  <VendorListingsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/bookings"
            element={
              <ProtectedRoute roles={['vendor']}>
                <AppShell>
                  <VendorBookingsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/analytics"
            element={
              <ProtectedRoute roles={['vendor']}>
                <AppShell>
                  <VendorAnalyticsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AppShell>
                  <AdminOverview />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/vendors"
            element={
              <ProtectedRoute roles={['admin']}>
                <AppShell>
                  <AdminVendorsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute roles={['admin']}>
                <AppShell>
                  <AdminBookingsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/banners"
            element={
              <ProtectedRoute roles={['admin']}>
                <AppShell>
                  <AdminBannersPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
