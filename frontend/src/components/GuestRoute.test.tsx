import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import GuestRoute from './GuestRoute';
import { clearAuthSession, renderWithProviders } from '../test/utils/renderWithProviders';

describe('GuestRoute', () => {
  beforeEach(() => clearAuthSession());

  it('renders children for guests', () => {
    renderWithProviders(
      <GuestRoute>
        <div>Login Form</div>
      </GuestRoute>,
      { route: '/login', role: null },
    );
    expect(screen.getByText('Login Form')).toBeInTheDocument();
  });

  it('redirects authenticated users away from guest pages', () => {
    renderWithProviders(
      <GuestRoute>
        <div>Login Form</div>
      </GuestRoute>,
      { route: '/login', role: 'CUSTOMER' },
    );
    expect(screen.queryByText('Login Form')).not.toBeInTheDocument();
  });
});
