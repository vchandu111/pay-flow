import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../test/renderWithProviders';
import { BeneficiariesPage } from './BeneficiariesPage';

async function addBeneficiary(user: ReturnType<typeof userEvent.setup>, name: string, identifier: string) {
  await user.click(screen.getByRole('button', { name: 'Add Beneficiary' }));
  await user.type(screen.getByLabelText('Name'), name);
  await user.type(screen.getByLabelText('Email / Phone'), identifier);
  await user.click(screen.getByRole('button', { name: 'Add' }));
}

describe('BeneficiariesPage', () => {
  it('shows an empty state, then adding a beneficiary appends it to the list', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BeneficiariesPage />);

    await waitFor(() => expect(screen.getByText('No beneficiaries yet.')).toBeInTheDocument());

    await addBeneficiary(user, 'Rahul', 'rahul@example.com');

    await waitFor(() => expect(screen.getByText('Rahul')).toBeInTheDocument());
    expect(screen.getByText('rahul@example.com')).toBeInTheDocument();
  });

  it('shows an inline error when adding a duplicate identifier', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BeneficiariesPage />);

    await waitFor(() => expect(screen.getByText('No beneficiaries yet.')).toBeInTheDocument());

    await addBeneficiary(user, 'Rahul', 'rahul@example.com');
    await waitFor(() => expect(screen.getByText('Rahul')).toBeInTheDocument());

    await addBeneficiary(user, 'Rahul Again', 'rahul@example.com');

    await waitFor(() => expect(screen.getByText(/already have a beneficiary/i)).toBeInTheDocument());
  });
});
