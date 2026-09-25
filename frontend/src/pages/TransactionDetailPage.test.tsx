import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { apiClient } from '../services/apiClient';
import { renderWithProviders } from '../test/renderWithProviders';
import { TransactionDetailPage } from './TransactionDetailPage';

function renderAtId(id: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/transactions/:id" element={<TransactionDetailPage />} />
    </Routes>,
    { route: `/transactions/${id}` },
  );
}

describe('TransactionDetailPage', () => {
  it('renders full detail for a known transaction', async () => {
    const topupRes = await apiClient.post('/wallets/me/topups', { amount: 100, description: 'Seed' });
    const id = topupRes.data.transaction.id as string;

    renderAtId(id);

    await waitFor(() => expect(screen.getByText('Status')).toBeInTheDocument());
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('TOPUP')).toBeInTheDocument();
  });

  it('renders a not-found state for an unknown transaction', async () => {
    renderAtId('does-not-exist');

    await waitFor(() =>
      expect(screen.getByText("This transaction doesn't exist or isn't yours to view.")).toBeInTheDocument(),
    );
  });
});
