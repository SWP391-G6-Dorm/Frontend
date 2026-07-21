import { ReactNode } from 'react';
import { useAuthStore } from '../../store/authStore';
import CustomerLayout from '../../layouts/CustomerLayout';
import ManagerLayout from '../../layouts/ManagerLayout';

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const role = useAuthStore((s) => s.role);
  if (role === 'MANAGER') {
    return <ManagerLayout>{children}</ManagerLayout>;
  }
  return <CustomerLayout>{children}</CustomerLayout>;
}
