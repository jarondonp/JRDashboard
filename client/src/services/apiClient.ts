const BASE_URL = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    const err = text || res.statusText || `HTTP ${res.status}`;
    throw new Error(err);
  }

  if (res.status === 204) {
    // No content
    return null as unknown as T;
  }

  const data = await res.json().catch(() => null);
  return data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

export async function apiPost<T>(path: string, body: any): Promise<T> {
  const payload = body instanceof FormData ? body : JSON.stringify(body);
  return request<T>(path, { method: 'POST', body: payload });
}

export async function apiPut<T>(path: string, body: any): Promise<T> {
  const payload = body instanceof FormData ? body : JSON.stringify(body);
  return request<T>(path, { method: 'PUT', body: payload });
}

export async function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}

export default { apiGet, apiPost, apiPut, apiDelete };
