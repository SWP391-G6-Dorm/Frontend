import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement, ReactNode } from 'react';
import { useAuthStore } from '../../store/authStore';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function seedAuthSession(role: 'CUSTOMER' | 'MANAGER' | 'ADMIN' | 'EMPLOYEE' = 'CUSTOMER') {
  sessionStorage.setItem('accessToken', 'test-access');
  sessionStorage.setItem('refreshToken', 'test-refresh');
  sessionStorage.setItem('userRole', role);
  sessionStorage.setItem('userId', '00000000-0000-0000-0000-000000000001');
  sessionStorage.setItem('fullName', `${role} Tester`);
  sessionStorage.setItem('userEmail', `${role.toLowerCase()}@test.local`);
  useAuthStore.setState({
    isAuthenticated: true,
    role,
    userId: '00000000-0000-0000-0000-000000000001',
    fullName: `${role} Tester`,
    email: `${role.toLowerCase()}@test.local`,
    phone: null,
    avatarUrl: null,
  });
}

export function clearAuthSession() {
  sessionStorage.clear();
  useAuthStore.setState({
    isAuthenticated: false,
    role: null,
    userId: null,
    fullName: null,
    email: null,
    phone: null,
    avatarUrl: null,
  });
}

interface Options extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  role?: 'CUSTOMER' | 'MANAGER' | 'ADMIN' | 'EMPLOYEE' | null;
}

export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const { route = '/', role = null, ...rest } = options;
  if (role) seedAuthSession(role);
  else clearAuthSession();

  const client = createTestQueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...rest });
}
