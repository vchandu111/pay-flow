import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { renderWithProviders } from '../test/renderWithProviders';
import { ProtectedRoute } from './ProtectedRoute';

describe('ProtectedRoute', () => {
  it('redirects to /login when the user is not authenticated', async () => {
    server.use(http.get('/api/users/me', () => new HttpResponse(null, { status: 401 })));

    renderWithProviders(
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>Secret dashboard</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>,
    );

    await waitFor(() => expect(screen.getByText('Login page')).toBeInTheDocument());
    expect(screen.queryByText('Secret dashboard')).not.toBeInTheDocument();
  });

  it('renders the protected content when authenticated', async () => {
    renderWithProviders(
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>Secret dashboard</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
    );

    await waitFor(() => expect(screen.getByText('Secret dashboard')).toBeInTheDocument());
  });
});
