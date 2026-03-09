/** .mega domain name resolver with in-memory cache */

const DOTMEGA_API = "https://api.dotmega.domains";

// Global cache: address (lowercase) → name | null (no name) | undefined (not fetched)
const cache = new Map<string, string | null>();
// Deduplicate in-flight requests
const inflight = new Map<string, Promise<string | null>>();

/** Resolve an address to its .mega name (or null). Results are cached. */
export async function resolveMegaName(address: string): Promise<string | null> {
  const key = address.toLowerCase();

  // Return cached result immediately
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  // Deduplicate concurrent requests for the same address
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await fetch(`${DOTMEGA_API}/resolve?address=${key}`);
      if (!res.ok) {
        cache.set(key, null);
        return null;
      }
      const data = await res.json();
      const name: string | null = data?.name || null;
      cache.set(key, name);
      return name;
    } catch {
      // Don't cache errors — allow retry
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}
