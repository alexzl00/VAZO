import { mkdir, readFile, writeFile, copyFile, rm, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, loadEnv } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const modeEnv = process.env.PORADNIK_RELEASE_MODE ?? loadEnv('production', root, '').PORADNIK_RELEASE_MODE;
const releaseMode = modeEnv || 'off';
const vercelEnv = process.env.VERCEL_ENV;

if (!['off', 'preview', 'public'].includes(releaseMode)) {
  throw new Error(`Unexpected PORADNIK_RELEASE_MODE=${releaseMode} (valid: off, preview, public).`);
}
if (releaseMode === 'preview' && vercelEnv === 'production') {
  throw new Error('Safety stop: Poradnik preview cannot be built on Vercel Production.');
}
if (releaseMode === 'public' && vercelEnv === 'preview') {
  throw new Error('Safety stop: public/indexable Poradnik cannot be built on Vercel Preview.');
}

// Fail if the existing SPA build is missing. Never overwrite its HTML/assets.
await access(path.join(dist, 'index.html'));
await rm(path.join(dist, 'poradnik.html'), { force: true });
await rm(path.join(dist, 'poradnik'), { recursive: true, force: true });
await rm(path.join(dist, 'sitemap.xml'), { force: true });

if (releaseMode === 'off') {
  // robots.txt is intentionally not used to hide the calculator from search.
  console.log('[poradnik] off: no guide pages or sitemap emitted.');
  process.exit(0);
}

const rawOrigin = process.env.VITE_SITE_URL ?? loadEnv('production', root, '').VITE_SITE_URL;
const vite = await createServer({
  root,
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
});

try {
  const { renderIndex, renderArticle, ARTICLES, validateRegistry } = await vite.ssrLoadModule('/src/poradnik/entry-server.tsx');
  const { PILOT_ARTICLE_IDS, visibleArticles } = await vite.ssrLoadModule('/src/content/poradnik/index.ts');
  const { parseSiteOrigin, assertReleaseEnvironment } = await vite.ssrLoadModule('/src/seo/siteConfig.ts');
  const { indexSeoPage, articleSeoPage, renderSeoHead } = await vite.ssrLoadModule('/src/seo/metadata.ts');
  const { guidePath } = await vite.ssrLoadModule('/src/seo/routes.ts');
  const { generateSitemap } = await vite.ssrLoadModule('/src/seo/sitemap.ts');
  const origin = parseSiteOrigin(rawOrigin);
  assertReleaseEnvironment(releaseMode, vercelEnv);
  validateRegistry();

  const published = ARTICLES.filter((article) => article.status === 'published');
  if (releaseMode === 'public' && published.length === 0) {
    throw new Error('Public release requires at least one reviewed, published article. Phase 2 is not ready.');
  }
  const selected = visibleArticles(releaseMode);
  if (releaseMode === 'preview' && selected.length !== PILOT_ARTICLE_IDS.length) {
    throw new Error('Preview must contain exactly the three selected pilot articles.');
  }
  if (releaseMode === 'public' && PILOT_ARTICLE_IDS.some((id) => !published.some((article) => article.id === id))) {
    throw new Error('Publishing requires all three pilot articles to be explicitly approved as published.');
  }

  const stylesheet = '/poradnik/poradnik.css';
  const pageHtml = (seoPage, htmlContent) => [
    '<!doctype html>',
    '<html lang="pl-PL">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    `  <link rel="icon" type="image/png" href="/poradnik/VAZO-logo.png">`,
    `  <link rel="stylesheet" href="${stylesheet}">`,
    `  ${renderSeoHead(seoPage, origin, releaseMode)}`,
    '</head>',
    '<body>',
    htmlContent,
    '</body>',
    '</html>',
    '',
  ].join('\n');

  await mkdir(path.join(dist, 'poradnik'), { recursive: true });
  await copyFile(path.join(root, 'src/poradnik/poradnik.css'), path.join(dist, 'poradnik/poradnik.css'));
  await copyFile(path.join(root, 'src/assets/images/VAZO-logo.png'), path.join(dist, 'poradnik/VAZO-logo.png'));
  await writeFile(path.join(dist, 'poradnik.html'), pageHtml(indexSeoPage(), renderIndex(releaseMode)), 'utf8');

  for (const article of selected) {
    const pathname = guidePath(article.slug);
    const filename = path.join(dist, `${pathname.slice(1)}.html`);
    await writeFile(filename, pageHtml(articleSeoPage(article), renderArticle(article, releaseMode)), 'utf8');
  }

  if (releaseMode === 'public') {
    await writeFile(path.join(dist, 'sitemap.xml'), generateSitemap(origin, published), 'utf8');
    await writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`, 'utf8');
  } else {
    // In preview, no draft is listed in a sitemap. The HTML carries noindex.
    // Leave any existing public/robots.txt untouched: preview is not secret.
  }

  const indexHtml = await readFile(path.join(dist, 'poradnik.html'), 'utf8');
  if (!indexHtml.includes('name="robots" content="' + (releaseMode === 'public' ? 'index' : 'noindex'))) {
    throw new Error('Unexpected guide index meta robots configuration.');
  }
  console.log(`[poradnik] ${releaseMode}: generated /poradnik and ${selected.length} article HTML file(s).`);
} finally {
  await vite.close();
}
