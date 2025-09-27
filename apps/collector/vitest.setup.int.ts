import { beforeAll } from 'vitest';

// Por defecto a local; si quieres Railway, setea BASE_URL en CI ad-hoc
process.env.BASE_URL ||= 'http://localhost:8785'; // collector port

// Verificar que el servicio responda; si no, saltar
beforeAll(async () => {
  try {
    const r = await fetch(`${process.env.BASE_URL}/healthz`);
    if (!r.ok) throw new Error('health not ok');
  } catch {
    // Skip todo el suite si no hay servicio local
    throw new Error(
      `Service not available at ${process.env.BASE_URL}. Run locally (docker/dev) or set BASE_URL to a live endpoint`
    );
  }
});
