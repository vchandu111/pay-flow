import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { renderWithProviders } from '../test/renderWithProviders';
import { TransactionsPage } from './TransactionsPage';

describe('TransactionsPage', () => {
  it('shows an empty state when there are no transactions', async () => {
    renderWithProviders(<TransactionsPage />);
    await waitFor(() => expect(screen.getByText('No transactions yet.')).toBeInTheDocument());
  });

  it('re-queries with the selected type filter', async () => {
    const user = userEvent.setup();
    let lastQuery: URLSearchParams | null = null;

    server.use(
      http.get('/api/transactions', ({ request }) => {
        lastQuery = new URL(request.url).searchParams;
        return HttpResponse.json({ transactions: [] }, { status: 200 });
      }),
    );

    renderWithProviders(<TransactionsPage />);
    await waitFor(() => expect(screen.getByText('No transactions yet.')).toBeInTheDocument());

    await user.selectOptions(screen.getByLabelText('Type'), 'TRANSFER');

    await waitFor(() => expect(lastQuery?.get('type')).toBe('TRANSFER'));
  });
});
