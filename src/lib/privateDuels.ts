// In-memory cache (refreshed periodically by useDuels)
let cachedIds: Set<string> = new Set();

/** Fetch private duel IDs from the server */
export async function fetchPrivateDuelIds(): Promise<Set<string>> {
  try {
    const res = await fetch("/api/private-duels", { cache: "no-store" });
    const { ids } = (await res.json()) as { ids: string[] };
    cachedIds = new Set(ids);
    return cachedIds;
  } catch {
    return cachedIds; // return last known cache on error
  }
}

/** Get the last-fetched private IDs (synchronous, for render) */
export function getPrivateDuelIds(): Set<string> {
  return cachedIds;
}

/** Mark a duel as private (POST to server + update local cache) */
export async function addPrivateDuel(duelId: bigint) {
  const idStr = String(duelId);
  cachedIds.add(idStr); // optimistic update
  try {
    await fetch("/api/private-duels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duelId: idStr }),
    });
  } catch (err) {
    console.error("Failed to mark duel as private:", err);
  }
}

/** Check if a duel is private (from cache) */
export function isPrivateDuel(duelId: bigint): boolean {
  return cachedIds.has(String(duelId));
}
