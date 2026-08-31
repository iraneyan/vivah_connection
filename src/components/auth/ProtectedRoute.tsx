import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/lib/types';
import { FullPageSpinner } from '@/components/ui/Spinner';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { session, profile, loading, profileLoading } = useAuth();
  const location = useLocation();

  if (loading || profileLoading) {
    return <FullPageSpinner label="Preparing your experience" />;
  }

  if (!session) {
    return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && profile && !roles.includes(profile.role)) {
    const home =
      profile.role === 'vendor'
        ? '/vendor'
        : profile.role === 'admin'
        ? '/admin'
        : '/app';
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}
