import 'server-only';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from './auth-cookie';

export async function getAuthToken(): Promise<string> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    throw new Error('No autenticado');
  }
  return token;
}
