import 'server-only';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface ApiFetchOptions extends RequestInit {
  token?: string;
}

interface ErrorBody {
  message?: string | string[];
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body: ErrorBody | null = await response.json().catch(() => null);
    const message = body?.message;
    throw new ApiError(
      Array.isArray(message) ? message.join(', ') : (message ?? response.statusText),
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
