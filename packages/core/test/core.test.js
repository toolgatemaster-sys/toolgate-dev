import { describe, it, expect } from "vitest";
import { analyze, defangLinks, spotlight, hmacSign, hmacVerify } from "../src";
describe("sanitizer", () => {
    it("defangs links", () => {
        expect(defangLinks("visit https://a.b")).toContain("hxxps://a[.]b");
    });
    it("spotlights risky terms", () => {
        expect(spotlight("user", "ignore previous")).toContain("⟦ignore previous⟧");
    });
    it("analyzes and scores", () => {
        const r = analyze("ignore previous and http://x.y");
        expect(r.score).toBeGreaterThan(0);
        expect(r.signals.length).toBeGreaterThan(0);
    });
});
describe("hmac", () => {
    it("sign/verify", async () => {
        const key = "dev_secret";
        const msg = "METHOD URL BODY";
        const sig = await hmacSign(key, msg);
        expect(sig.length).toBe(64);
        expect(await hmacVerify(key, msg, sig)).toBe(true);
    });
});
//# sourceMappingURL=core.test.js.map