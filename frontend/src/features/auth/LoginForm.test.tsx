import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('renders email and password fields', () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('shows a validation error for an invalid email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'somepassword');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => expect(screen.getByText('Invalid email address')).toBeInTheDocument());
  });
});
