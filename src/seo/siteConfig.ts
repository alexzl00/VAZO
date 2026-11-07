/** Public SEO config. Pass the env value explicitly so Node and browser can share it. */
export type PoradnikReleaseMode = 'off' | 'preview' | 'public';

export function resolveReleaseMode(raw: string | undefined): PoradnikReleaseMode {
  if (raw === undefined || raw === '' || raw === 'off') return 'off';
  if (raw === 'preview' || raw === 'public') return raw;
  // The CLI must fail closed if someone accidentally enters a different value.
  throw new Error(`Unknown PORADNIK_RELEASE_MODE: ${raw}`);
}

export function assertReleaseEnvironment(
  releaseMode: PoradnikReleaseMode,
  vercelEnv: string | undefined
): void {
  if (releaseMode === 'preview' && vercelEnv === 'production') {
    throw new Error('Refusing to publish preview-only Poradnik pages on Vercel Production.');
  }
  if (releaseMode === 'public' && vercelEnv === 'preview') {
    throw new Error('Refusing to mark preview deployment Poradnik pages as publicly indexable.');
  }
}

/** Accept a strict HTTPS origin only, without path, query, credentials or fragment. */
export function parseSiteOrigin(raw: string | undefined): string {
  if (!raw || raw !== raw.trim()) {
    throw new Error('VITE_SITE_URL must be an absolute HTTPS origin (no whitespace).');
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`Invalid VITE_SITE_URL: ${raw}`);
  }
  if (
    url.protocol !== 'https:' || !url.hostname || url.username || url.password ||
    url.pathname !== '/' || url.search || url.hash || url.origin === 'null'
  ) {
    throw new Error('VITE_SITE_URL must be an HTTPS origin without path, query, fragment or login.');
  }
  return url.origin;
}
