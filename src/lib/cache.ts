type CacheEntry<T> = {
  expiresAt: number
  value: T
}

const store = new Map<string, CacheEntry<unknown>>()

export async function readThroughTtlCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const cached = store.get(key) as CacheEntry<T> | undefined
  const now = Date.now()

  if (cached && cached.expiresAt > now) {
    return cached.value
  }

  const value = await loader()
  store.set(key, { value, expiresAt: now + ttlMs })
  return value
}

export function clearTtlCache(): void {
  store.clear()
}
