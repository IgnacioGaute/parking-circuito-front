import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_NAME } from '@/lib/auth-cookie';
import { ApiError } from '@/services/api-client';
import { loginRequest } from '@/services/auth.service';
import type { LoginPayload } from '@/types';

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as LoginPayload;

  try {
    const result = await loginRequest(payload);

    const response = NextResponse.json({ operator: result.operator });
    response.cookies.set(AUTH_COOKIE_NAME, result.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: AUTH_COOKIE_MAX_AGE,
    });
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { message: 'No se pudo iniciar sesión' },
      { status: 500 },
    );
  }
}
