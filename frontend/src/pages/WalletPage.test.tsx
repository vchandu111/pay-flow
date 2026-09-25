import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../test/renderWithProviders';
import { WalletPage } from './WalletPage';

describe('WalletPage', () => {
  it('adding money updates the displayed balance', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WalletPage />);

    await waitFor(() => expect(screen.getByText('₹1000.00')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Add Money' }));

    const dialog = screen.getByRole('dialog', { name: 'Add Money' });
    await user.type(within(dialog).getByLabelText('Amount (₹)'), '250');
    await user.click(within(dialog).getByRole('button', { name: 'Add Money' }));

    await waitFor(() => expect(screen.getByText('₹1250.00')).toBeInTheDocument());
  });
});
