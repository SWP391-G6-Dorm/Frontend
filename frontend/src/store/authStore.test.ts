import { beforeEach, describe, expect, it } from 'vitest';
import { getRoleDashboardPath, useAuthStore } from './authStore';

describe('authStore', () => {
  beforeEach(() => {
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
  });

  it('maps role dashboards', () => {
    expect(getRoleDashboardPath('MANAGER')).toBe('/manager/dashboard');
    expect(getRoleDashboardPath('ADMIN')).toBe('/admin/dashboard');
    expect(getRoleDashboardPath('EMPLOYEE')).toBe('/employee/dashboard');
    expect(getRoleDashboardPath('CUSTOMER')).toBe('/customer/dashboard');
    expect(getRoleDashboardPath(null)).toBe('/customer/dashboard');
  });

  it('login persists session and state', () => {
    useAuthStore.getState().login({
      accessToken: 'a',
      refreshToken: 'r',
      user: {
        id: 'u1',
        fullName: 'Test User',
        email: 't@test.local',
        role: 'MANAGER',
        status: 'ACTIVE',
        phone: undefined,
        avatarUrl: undefined,
      },
    });

    expect(sessionStorage.getItem('accessToken')).toBe('a');
    expect(sessionStorage.getItem('userRole')).toBe('MANAGER');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().role).toBe('MANAGER');
  });

  it('logout clears session', () => {
    sessionStorage.setItem('accessToken', 'a');
    useAuthStore.setState({ isAuthenticated: true, role: 'CUSTOMER' });
    useAuthStore.getState().logout();
    expect(sessionStorage.getItem('accessToken')).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
