import { API_BASE_URL } from '@/lib/constants';
import { getAccessToken } from '@/lib/auth';

type RequestInitAuth = RequestInit & { skipAuth?: boolean };

/**
 * Gọi fetch tới API backend, tự thêm base URL và header Authorization nếu có token.
 */
export async function fetchApi(
  path: string,
  options: RequestInitAuth = {}
): Promise<Response> {
  const { skipAuth, ...rest } = options;
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const token = skipAuth ? null : getAccessToken();
  const headers = new Headers(rest.headers as HeadersInit);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...rest, headers });
}

export { API_BASE_URL };
