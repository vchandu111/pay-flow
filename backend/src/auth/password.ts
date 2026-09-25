import crypto from 'node:crypto';

export function hashPassword(plainPassword: string): Promise<string> {
  return Promise.resolve(crypto.createHash('sha256').update(plainPassword).digest('hex'));
}

export function verifyPassword(hash: string, plainPassword: string): Promise<boolean> {
  const candidate = crypto.createHash('sha256').update(plainPassword).digest('hex');
  return Promise.resolve(candidate === hash);
}
