/**
 * Construye un validador de hosts a partir de ALLOW_HOSTS.
 * Formatos soportados (se ignora mayúsc/minúsc):
 *   - "example.com"
 *   - "api.example.com"
 *   - ".example.com" (permite cualquier subdominio de example.com)
 * Separador: coma. Espacios se trimean.
 */
export function makeHostAllowChecker(raw: string | undefined) {
  const items = (raw ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const exact = new Set<string>();
  const suffixes: string[] = []; // para ".example.com"

  for (const h of items) {
    if (h.startsWith(".")) suffixes.push(h); // guardo con el punto inicial
    else exact.add(h);
  }

  return function isAllowed(urlStr: string): boolean {
    let host: string;
    try {
      host = new URL(urlStr).hostname.toLowerCase();
    } catch {
      return false;
    }
    if (exact.has(host)) return true;
    for (const suf of suffixes) {
      if (host.endsWith(suf)) return true; // ej: foo.bar.example.com termina con ".example.com"
    }
    return false;
  };
}
