'use server';

import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/auth-cookie';

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(AUTH_COOKIE_NAME);
}
