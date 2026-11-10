import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, loadEnv } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = loadEnv('production', root, '');
const mode = process.env.PORADNIK_RELEASE_MODE ?? env.PORADNIK_RELEASE_MODE ?? 'off';
const rawOrigin = process.env.VITE_SITE_URL ?? env.VITE_SITE_URL;
const vite = await createServer({ root, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
try {
  const { parseSiteOrigin, resolveReleaseMode, assertReleaseEnvironment } = await vite.ssrLoadModule('/src/seo/siteConfig.ts');
  const releaseMode = resolveReleaseMode(mode);
  assertReleaseEnvironment(releaseMode, process.env.VERCEL_ENV);
  const origin = parseSiteOrigin(rawOrigin);
  const { ARTICLES, validateRegistry } = await vite.ssrLoadModule('/src/content/poradnik/index.ts');
  const { generateSitemap } = await vite.ssrLoadModule('/src/seo/sitemap.ts');
  validateRegistry();
  const xml = generateSitemap(origin, releaseMode === 'public' ? ARTICLES : []);
  await writeFile(path.join(root, 'dist/sitemap.xml'), xml, 'utf8');
  await writeFile(path.join(root, 'dist/robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`, 'utf8');
  console.log(`[public SEO] Sitemap generated independently of Poradnik (${releaseMode}).`);
} finally {
  await vite.close();
}
