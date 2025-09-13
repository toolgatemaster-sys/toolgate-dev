export type AnalyzeResult = {
    score: number;
    signals: string[];
    clean: string;
};
export declare function defangLinks(s: string): string;
export declare function spotlight(_source: "user" | "tool" | "system", s: string): string;
export declare function analyze(s: string): AnalyzeResult;
/** HMAC-SHA256 universal (Node 20 / Workers) */
export declare function hmacSign(key: string, msg: string): Promise<string>;
/** Constant-time string compare */
export declare function safeEqual(a: string, b: string): boolean;
export declare function hmacVerify(key: string, msg: string, hex: string): Promise<boolean>;
