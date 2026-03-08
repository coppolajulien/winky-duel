const STORAGE_KEY = "blinkit-private-duels";

// In-memory cache (union of localStorage + server)
let cachedIds: Set<string> = new Set();

/** Read IDs from localStorage */
function getLocalIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

/** Save IDs to localStorage */
function saveLocal(ids: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

/** Fetch private duel IDs from the server + merge with localStorage */
export async function fetchPrivateDuelIds(): Promise<Set<string>> {
  const localIds = getLocalIds();
  try {
    const res = await fetch("/api/private-duels", { cache: "no-store" });
    const { ids } = (await res.json()) as { ids: string[] };
    // Merge server + local
    cachedIds = new Set([...ids, ...localIds]);
  } catch {
    // Server down — use localStorage only
    cachedIds = localIds;
  }
  return cachedIds;
}

/** Get the last-fetched private IDs (synchronous, for render) */
export function getPrivateDuelIds(): Set<string> {
  // On first render before any fetch, read from localStorage
  if (cachedIds.size === 0) {
    cachedIds = getLocalIds();
  }
  return cachedIds;
}

/** Mark a duel as private (save to both localStorage + server) */
export async function addPrivateDuel(duelId: bigint) {
  const idStr = String(duelId);
  cachedIds.add(idStr);

  // Save to localStorage (immediate, same browser)
  const localIds = getLocalIds();
  localIds.add(idStr);
  saveLocal(localIds);

  // Save to server (for other browsers)
  try {
    await fetch("/api/private-duels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duelId: idStr }),
    });
  } catch (err) {
    console.error("Failed to mark duel as private on server:", err);
  }
}

/** Check if a duel is private (from cache) */
export function isPrivateDuel(duelId: bigint): boolean {
  return cachedIds.has(String(duelId));
}
