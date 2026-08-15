/**
 * Local LLM bridge — optional, free, subscription-powered.
 *
 * `llm-bridge` (~/projects/llm-bridge) listens on loopback and proxies to the
 * CLIs already paid for (Claude Code, Codex, Gemini) plus ollama offline. Those
 * subscriptions license the clients, not the API, so this only ever works where
 * the bridge is actually running — a dev machine. On Vercel, 127.0.0.1 is
 * nothing, the probe fails fast, and every caller falls through to the
 * Anthropic API path.
 *
 * Every function here is best-effort. `bridgeComplete` returning null means
 * "use the cloud path" — it is not an error condition.
 */

const BRIDGE_URL = process.env.LLM_BRIDGE_URL ?? "http://127.0.0.1:4319";

// A positive probe is cheap to trust for a while; a negative one is not. The
// bridge spends much of its life mid-generation, and a health check that blips
// during one of those should not blackball it for a full 30 seconds.
const PROBE_OK_TTL_MS = 30_000;
const PROBE_FAIL_TTL_MS = 3_000;
const PROBE_TIMEOUT_MS = 1_200;

type Probe = { at: number; ok: boolean };
let probe: Probe = { at: 0, ok: false };

export function probeIsFresh(p: Probe, now = Date.now()): boolean {
  const age = now - (p?.at || 0);
  return p?.ok ? age < PROBE_OK_TTL_MS : age < PROBE_FAIL_TTL_MS;
}

/** Test seam: reset the cached probe between cases. */
export function resetBridgeProbe(): void {
  probe = { at: 0, ok: false };
}

/** On by default — the whole point is zero cost when it is available. */
export function bridgeEnabled(): boolean {
  return process.env.LLM_BRIDGE !== "off";
}

export async function bridgeAvailable(): Promise<boolean> {
  if (!bridgeEnabled()) return false;

  const now = Date.now();
  if (probeIsFresh(probe, now)) return probe.ok;

  try {
    const res = await fetch(`${BRIDGE_URL}/health`, {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    probe = { at: now, ok: res.ok };
  } catch {
    probe = { at: now, ok: false };
  }
  return probe.ok;
}

export interface BridgeRequest {
  system?: string;
  prompt: string;
  json?: boolean;
}

/** Model text, or null when the bridge is unavailable — null means "use cloud". */
export async function bridgeComplete(req: BridgeRequest): Promise<string | null> {
  if (!(await bridgeAvailable())) return null;

  try {
    const res = await fetch(`${BRIDGE_URL}/complete`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        system: req.system ?? "",
        prompt: req.prompt,
        json: Boolean(req.json),
      }),
    });
    if (!res.ok) throw new Error(`bridge ${res.status}`);

    const data = (await res.json()) as { text?: string; backend?: string };
    if (!data.text) throw new Error("bridge returned no text");

    // A completed call is better evidence of health than any health check, and
    // recording it lets the next call skip probing entirely.
    probe = { at: Date.now(), ok: true };
    console.log(`[llm-bridge] served by ${data.backend ?? "unknown"}`);
    return data.text;
  } catch (err) {
    console.warn(
      "[llm-bridge] unavailable, falling back to Anthropic API:",
      err instanceof Error ? err.message : err
    );
    probe = { at: Date.now(), ok: false };
    return null;
  }
}
