import type { ToolgateEvent } from "./types.js";

/**
 * Emite eventos al Collector. No lanza; loguea y sigue.
 * Firma HMAC simple opcional: sha256(body + HMAC_KEY) en `x-toolgate-sig` (hex).
 */
export function makeEventEmitter(opts: { collectorURL?: string; hmacKey?: string; logger: (o: any, msg: string) => void }) {
  const { collectorURL, hmacKey, logger } = opts;

  async function sign(body: string): Promise<string | undefined> {
    if (!hmacKey) return undefined;
    const { createHash } = await awaitImportNodeCrypto();
    const h = createHash("sha256").update(body + hmacKey).digest("hex");
    return h;
  }

  async function emit(evt: ToolgateEvent) {
    if (!collectorURL) return;
    const url = `${collectorURL.replace(/\/+$/, "")}/v1/events`;
    const body = JSON.stringify(evt);
    const headers: Record<string, string> = { "content-type": "application/json" };
    const sig = await sign(body);
    if (sig) headers["x-toolgate-sig"] = sig;

    try {
      await fetch(url, { method: "POST", headers, body });
    } catch (e) {
      logger({ err: String(e) }, "emitEvent failed");
    }
  }

  return { emit };
}

function awaitImportNodeCrypto() {
  // helper porque estamos en ESM
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return import("node:crypto") as Promise<typeof import("node:crypto")>;
}
