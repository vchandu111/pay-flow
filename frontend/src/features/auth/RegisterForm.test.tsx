import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import { RegisterForm } from './RegisterForm';

describe('RegisterForm', () => {
  it('renders all fields', () => {
    renderWithProviders(<RegisterForm />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
  });

  it('shows an error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText('Name'), 'Jordan Lee');
    await user.type(screen.getByLabelText('Email'), 'jordan@example.com');
    await user.type(screen.getByLabelText('Phone'), '+919812345678');
    await user.type(screen.getByLabelText('Password'), 'CorrectHorse9');
    await user.type(screen.getByLabelText('Confirm password'), 'SomethingElse9');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(screen.getByText('Passwords do not match')).toBeInTheDocument());
  });

  it('shows an error for a too-short password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText('Password'), 'short1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() =>
      expect(screen.getByText('Password must be at least 10 characters')).toBeInTheDocument(),
    );
  });
});
