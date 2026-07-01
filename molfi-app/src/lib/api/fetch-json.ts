export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchJson<T>(
  url: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const timeoutMs = init?.timeoutMs ?? 15_000;
  const { timeoutMs: _t, ...rest } = init ?? {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...rest, signal: controller.signal });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new ApiError(
        body.slice(0, 200) || res.statusText || `HTTP ${res.status}`,
        res.status,
        url,
      );
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
