import { useAuthStore } from '../store/authStore';

/** Base path for profile routes — CUSTOMER vs MANAGER (SCR-11–13). */
export function useProfilePaths() {
  const role = useAuthStore((s) => s.role);
  const base = role === 'MANAGER' ? '/manager' : '/customer';

  return {
    base,
    profile: `${base}/profile`,
    edit: `${base}/profile/edit`,
    changePassword: `${base}/profile/change-password`,
  };
}
