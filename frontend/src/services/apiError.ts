import { isAxiosError } from 'axios';

export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (isAxiosError(err)) {
    const message = (err.response?.data as { error?: { message?: string } } | undefined)?.error?.message;
    if (message) return message;
  }
  return fallback;
}
