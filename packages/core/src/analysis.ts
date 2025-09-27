export function defangLinks(s: string): string {
    // http(s):// -> hxxp(s)://  and dots -> [.]
    return s
        .replace(/https?:\/\//gi, (m: string) => m.replace(/t/g, "x"))
        .replace(/\./g, "[.]");
}
export function spotlight(_source: string, s: string): string {
    const needles = [
        /ignore\s+previous/ig, /system\s+prompt/ig, /<script/ig,
        /base64,/ig, /file:\/\//ig, /ssh-rsa/ig, /aws[_-]?access[_-]?key/ig
    ];
    return needles.reduce((acc: string, rx: RegExp) => acc.replace(rx, (m: string) => `⟦${m}⟧`), s);
}

export interface AnalysisResult {
    score: number;
    signals: string[];
    clean: string;
}

export function analyze(s: string): AnalysisResult {
    const rules = [
        { rx: /ignore\s+previous/ig, sev: 4, label: "override-intent" },
        { rx: /system\s+prompt/ig, sev: 3, label: "system-ref" },
        { rx: /https?:\/\//ig, sev: 2, label: "egress-link" },
        { rx: /<script/ig, sev: 4, label: "html-script" },
        { rx: /file:\/\//ig, sev: 4, label: "local-file" },
    ];
    const signals: string[] = [];
    let score = 0;
    for (const r of rules) {
        if (r.rx.test(s)) {
            signals.push(r.label);
            score += r.sev * 10;
        }
    }
    if (score > 100)
        score = 100;
    const clean = defangLinks(s);
    return { score, signals, clean };
}
/** HMAC-SHA256 universal (Node 20 / Workers) */
export async function hmacSign(key: string, msg: string): Promise<string> {
    const enc = new TextEncoder();
    const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", k, enc.encode(msg));
    return Array.from(new Uint8Array(sig)).map((b: number) => b.toString(16).padStart(2, "0")).join("");
}
/** Constant-time string compare */
export function safeEqual(a: string, b: string): boolean {
    if (a.length !== b.length)
        return false;
    let r = 0;
    for (let i = 0; i < a.length; i++)
        r |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return r === 0;
}
export async function hmacVerify(key: string, msg: string, hex: string): Promise<boolean> {
    const calc = await hmacSign(key, msg);
    return safeEqual(calc, hex);
}
