import { guidePath, PUBLIC_PATHS } from './routes';

export { guidePath, PUBLIC_PATHS };

/** Absolute links only for SEO; ordinary navigation uses paths from routes.ts. */
export function absoluteSiteUrl(siteOrigin: string, path: string): string {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\') || /[\r\n]/.test(path)) {
    throw new Error(`Expected a safe origin-relative URL path, got: ${path}`);
  }
  return new URL(path, `${siteOrigin}/`).href;
}
