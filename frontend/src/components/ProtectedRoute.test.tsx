import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute';
import { clearAuthSession, renderWithProviders, seedAuthSession } from '../test/utils/renderWithProviders';

describe('ProtectedRoute', () => {
  beforeEach(() => clearAuthSession());

  it('redirects unauthenticated users to login', () => {
    renderWithProviders(
      <ProtectedRoute role="MANAGER">
        <div>Secret</div>
      </ProtectedRoute>,
      { route: '/manager/dashboard', role: null },
    );
    expect(screen.queryByText('Secret')).not.toBeInTheDocument();
  });

  it('redirects wrong role to their dashboard', () => {
    seedAuthSession('CUSTOMER');
    renderWithProviders(
      <ProtectedRoute role="MANAGER">
        <div>Manager Only</div>
      </ProtectedRoute>,
      { route: '/manager/dashboard', role: 'CUSTOMER' },
    );
    expect(screen.queryByText('Manager Only')).not.toBeInTheDocument();
  });

  it('renders children for matching role', () => {
    renderWithProviders(
      <ProtectedRoute role="MANAGER">
        <div>Manager Only</div>
      </ProtectedRoute>,
      { route: '/manager/dashboard', role: 'MANAGER' },
    );
    expect(screen.getByText('Manager Only')).toBeInTheDocument();
  });
});
