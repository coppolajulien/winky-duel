const STORAGE_KEY = "blinkit-private-duels";

function getIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function save(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function addPrivateDuel(duelId: bigint) {
  const ids = getIds();
  ids.add(String(duelId));
  save(ids);
}

export function isPrivateDuel(duelId: bigint): boolean {
  return getIds().has(String(duelId));
}

export function getPrivateDuelIds(): Set<string> {
  return getIds();
}
