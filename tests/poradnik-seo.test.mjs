import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = (p) => path.join(root, p);
const exists = (p) => access(file(p)).then(() => true, () => false);
const config = JSON.parse(await readFile(file('vercel.json'), 'utf8'));
const pilots = ['jak-obliczyc-podstawe-l4', 'ile-wynosi-wyplata-na-l4', 'jak-obliczyc-wynagrodzenie-urlopowe'];

test('Vercel preserves explicit SPA routes without absorbing unknown guide URLs', () => {
  assert.equal(config.cleanUrls, true);
  assert.equal(config.trailingSlash, false);
  const routes = config.rewrites.map((entry) => entry.source);
  for (const route of ['/salaries', '/login', '/statistics', '/view-work-relation/:id']) {
    assert.ok(routes.includes(route), `missing ${route}`);
  }
  assert.ok(routes.every((route) => !route.startsWith('/poradnik') && !route.includes('(.*)') && !route.includes(':path*')));
  assert.ok(!routes.includes('/salary-calculator'), 'calculator uses its own HTML');
  assert.ok(config.rewrites.every((route) => route.destination === '/app-shell'));
});

test('SSG tree remains separate from authenticated payroll state', async () => {
  for (const p of ['src/poradnik/entry-server.tsx', 'src/content/poradnik/index.ts', 'src/layouts/PoradnikLayout.tsx', 'src/pages/poradnik/ArticlePage.tsx']) {
    const content = await readFile(file(p), 'utf8');
    assert.doesNotMatch(content, /^\s*import\s+(?:[^;\n]*\s+from\s+)?[^;\n]*(?:AuthContext|auth\/|supabase|CreateSalary|RouterProvider)/mi);
  }
});

test('UI strings reuse the original Polish react-intl catalog', async () => {
  const messages = JSON.parse(await readFile(file('src/utils/languages/pl.json'), 'utf8'));
  const files = ['src/layouts/PoradnikLayout.tsx', 'src/pages/poradnik/PoradnikPage.tsx',
    'src/sections/poradnik/ArticleCard.tsx', 'src/sections/poradnik/ArticleLayout.tsx',
    'src/sections/poradnik/ArticleSources.tsx', 'src/sections/poradnik/RelatedArticles.tsx',
    'src/sections/poradnik/CalculatorCTA.tsx', 'src/seo/metadata.ts'];
  for (const p of files) {
    const source = await readFile(file(p), 'utf8');
    for (const [, id] of source.matchAll(/id="(poradnik-[^" ]+)"/g)) {
      assert.ok(messages[id], `${p} requires missing translation ${id}`);
    }
  }
  assert.match(await readFile(file('src/poradnik/entry-server.tsx'), 'utf8'), /IntlProvider/);
  assert.match(await readFile(file('src/poradnik/intl.ts'), 'utf8'), /languages\/pl\.json/);
});

test('Scope 2 generated HTML respects release visibility and translation', async (t) => {
  if (!await exists('dist/index.html')) return t.skip('Run npm run build first');
  const mode = process.env.PORADNIK_RELEASE_MODE ?? 'off';
  assert.equal(await exists('dist/poradnik/demo-architektury.html'), false);
  if (mode === 'off') {
    assert.equal(await exists('dist/poradnik.html'), false);
    assert.equal(await exists('dist/sitemap.xml'), true);
    assert.match(await readFile(file('dist/sitemap.xml'), 'utf8'), /\/salary-calculator/);
    return;
  }
  const index = await readFile(file('dist/poradnik.html'), 'utf8');
  for (const slug of pilots) {
    assert.match(index, new RegExp(`/poradnik/${slug}`));
    const html = await readFile(file(`dist/poradnik/${slug}.html`), 'utf8');
    assert.match(html, /<h1>/);
    assert.match(html, /Źródła urzędowe/);
    assert.match(html, /href="\/salary-calculator"/);
    assert.doesNotMatch(html, /Wersja testowa|Podgląd techniczny|demo-architektury/);
    if (mode === 'preview') {
      assert.match(html, /name="robots" content="noindex, follow"/);
      assert.doesNotMatch(html, /rel="canonical"|application\/ld\+json/);
    } else {
      assert.match(html, /name="robots" content="index, follow"/);
      assert.match(html, /rel="canonical"/);
    }
  }
  assert.match(index, /Poradnik wynagrodzeń/);
  assert.equal(await exists('dist/sitemap.xml'), true);
  const sitemap = await readFile(file('dist/sitemap.xml'), 'utf8');
  assert.match(sitemap, /\/salary-calculator/);
  if (mode !== 'public') assert.doesNotMatch(sitemap, /\/poradnik/);
});

test('Registry, published-only sitemap, shared URLs, and example math', async (t) => {
  let createServer;
  try { ({ createServer } = await import('vite')); }
  catch { return t.skip('Install dependencies to run registry tests'); }
  const vite = await createServer({ root, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { parseSiteOrigin } = await vite.ssrLoadModule('/src/seo/siteConfig.ts');
    const { renderSeoHead, articleSeoPage } = await vite.ssrLoadModule('/src/seo/metadata.ts');
    const { guidePath } = await vite.ssrLoadModule('/src/seo/routes.ts');
    const { ARTICLES, validateRegistry, visibleArticles } = await vite.ssrLoadModule('/src/content/poradnik/index.ts');
    const { generateSitemap } = await vite.ssrLoadModule('/src/seo/sitemap.ts');
    validateRegistry();
    const origin = parseSiteOrigin('https://vazo.vercel.app/');
    for (const bad of ['http://vazo.vercel.app', 'https://vazo.vercel.app/path', 'https://user:secret@vazo.vercel.app', '']) {
      assert.throws(() => parseSiteOrigin(bad));
    }
    assert.equal(guidePath(pilots[0]), `/poradnik/${pilots[0]}`);
    assert.equal(visibleArticles('preview').length, 3);
    assert.equal(visibleArticles('public').length, 0);
    assert.equal(visibleArticles('off').length, 0);
    for (const article of ARTICLES) {
      assert.equal(article.status, 'draft');
      assert.match(renderSeoHead(articleSeoPage(article), origin, 'preview'), /noindex, follow/);
      assert.doesNotMatch(renderSeoHead(articleSeoPage(article), origin, 'preview'), /rel="canonical"/);
    }
    assert.doesNotMatch(generateSitemap(origin, ARTICLES), /jak-obliczyc-podstawe-l4/);
    // Plain illustrative cases, not engine alignment assertions.
    assert.equal(6000 * (1 - .1371), 5177.4);
    assert.equal(Math.round((5177.4 / 30) * .8 * 100) / 100 * 6, 828.36);
    assert.equal((600 + 480 + 360) / 480 * 16, 48);
  } finally {
    await vite.close();
  }
});
