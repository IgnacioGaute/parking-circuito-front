import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth-cookie';
import { logoutRequest } from '@/services/auth.service';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    // Best-effort: mark the operator off-duty on the backend, but don't
    // block clearing the local session if the backend call fails (e.g.
    // token already expired) — the user should still be logged out here.
    await logoutRequest(token).catch(() => undefined);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
