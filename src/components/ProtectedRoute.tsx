import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  /** Role bắt buộc để truy cập route này */
  role: 'CUSTOMER' | 'MANAGER';
  children: React.ReactNode;
}

/**
 * ProtectedRoute — bảo vệ route theo role.
 *
 * Logic:
 * 1. Chưa đăng nhập → redirect /login?redirect=<currentPath>
 * 2. Đã đăng nhập nhưng sai role → redirect về dashboard của role đó
 * 3. Đúng role → render children
 */
export default function ProtectedRoute({ role, children }: ProtectedRouteProps) {
  const { isAuthenticated, role: userRole } = useAuthStore();
  const location = useLocation();

  // Chưa đăng nhập → redirect /login, giữ lại path để quay lại sau
  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  // Đã đăng nhập nhưng sai role
  if (userRole !== role) {
    // Manager vào trang customer → về manager dashboard (và ngược lại)
    const fallback = userRole === 'MANAGER' ? '/manager/dashboard' : '/customer/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
