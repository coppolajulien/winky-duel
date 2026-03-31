/**
 * Client-side API for server-attested game sessions.
 * The server validates blinks and signs scores with ECDSA.
 */

interface StartResponse {
  sessionId: string;
  nonce: number;
}

interface FinishResponse {
  score: number;
  nonce: number;
  signature: `0x${string}`;
  player: string;
}

/** Start a new game session. Requires wallet signature to prove ownership. */
export async function startGame(
  player: string,
  signMessage: (args: { message: string }) => Promise<`0x${string}`>
): Promise<StartResponse> {
  const timestamp = Date.now();
  const message = `Blinkit: start game session\n${timestamp}`;
  const signature = await signMessage({ message });

  const res = await fetch("/api/game/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player, signature, timestamp }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Start failed (${res.status})`);
  }
  return res.json();
}

/** Record a blink event. Fire-and-forget — don't await in the hot path. */
export function recordBlink(sessionId: string, timestamp: number): void {
  fetch("/api/game/blink", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, timestamp }),
  }).catch(() => {
    // Non-critical: server blink tracking is for validation, not scoring
  });
}

/** Finish the game and get the server-signed score. */
export async function finishGame(sessionId: string): Promise<FinishResponse> {
  const res = await fetch("/api/game/finish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Finish failed (${res.status})`);
  }
  return res.json();
}
