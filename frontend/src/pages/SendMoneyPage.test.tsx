import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../test/renderWithProviders';
import { SendMoneyPage } from './SendMoneyPage';
import { KNOWN_RECIPIENT } from '../mocks/handlers';

describe('SendMoneyPage', () => {
  it('completes the full recipient -> summary -> success flow', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SendMoneyPage />);

    await user.type(screen.getByLabelText('Recipient (email or phone)'), KNOWN_RECIPIENT.identifier);
    await user.type(screen.getByLabelText('Amount (₹)'), '250');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(screen.getByText('Transfer Summary')).toBeInTheDocument());
    expect(screen.getByText(`${KNOWN_RECIPIENT.name} (${KNOWN_RECIPIENT.identifier})`)).toBeInTheDocument();
    expect(screen.getByText('₹0.00')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirm Transfer' }));

    await waitFor(() => expect(screen.getByText(/sent successfully/)).toBeInTheDocument());
    expect(screen.getByText(/TXN-/)).toBeInTheDocument();
  });

  it('shows an inline error and stays on step 1 when the recipient is not found', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SendMoneyPage />);

    await user.type(screen.getByLabelText('Recipient (email or phone)'), 'nobody@example.com');
    await user.type(screen.getByLabelText('Amount (₹)'), '100');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(screen.getByText(/no payflow user found/i)).toBeInTheDocument());
    expect(screen.queryByText('Transfer Summary')).not.toBeInTheDocument();
  });

  it('shows an inline error at confirm time when the amount exceeds the balance', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SendMoneyPage />);

    await user.type(screen.getByLabelText('Recipient (email or phone)'), KNOWN_RECIPIENT.identifier);
    await user.type(screen.getByLabelText('Amount (₹)'), '5000');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(screen.getByText('Transfer Summary')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Confirm Transfer' }));

    await waitFor(() => expect(screen.getByText(/insufficient balance/i)).toBeInTheDocument());
    // Still on the summary step — entered data wasn't lost.
    expect(screen.getByText('Transfer Summary')).toBeInTheDocument();
  });
});
