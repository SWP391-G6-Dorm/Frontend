import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface GuestRouteProps {
  children: React.ReactNode;
}

/**
 * GuestRoute — bảo vệ các trang chỉ dành cho guest (chưa đăng nhập).
 * Dùng cho: /login, /register, /verify-email, /forgot-password, /reset-password
 *
 * Nếu đã đăng nhập → redirect về dashboard theo role.
 */
export default function GuestRoute({ children }: GuestRouteProps) {
  const { isAuthenticated, role } = useAuthStore();

  if (isAuthenticated) {
    const dashboard = role === 'MANAGER' ? '/manager/dashboard' : '/customer/dashboard';
    return <Navigate to={dashboard} replace />;
  }

  return <>{children}</>;
}
