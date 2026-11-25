/**
 * Lightweight client/server fetch helpers:
 * - Timeout via AbortController (default 10s)
 * - In-flight GET request deduplication to prevent duplicate concurrent network calls
 */

const inFlightGets = new Map<string, Promise<unknown>>();

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 10_000, signal: externalSignal, ...rest } = init;
  const controller = new AbortController();

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
}

export async function dedupedGetJson<T>(
  url: string,
  options: { timeoutMs?: number; signal?: AbortSignal } = {}
): Promise<T> {
  const existing = inFlightGets.get(url);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = (async () => {
    const res = await fetchWithTimeout(url, { method: 'GET', ...options });
    if (!res.ok) {
      throw new Error(`Request failed (${res.status})`);
    }
    return (await res.json()) as T;
  })();

  inFlightGets.set(url, promise);
  try {
    return await promise;
  } finally {
    inFlightGets.delete(url);
  }
}
