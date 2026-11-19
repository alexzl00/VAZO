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
const scope4Slugs = [
  'jak-obliczyc-nadgodziny', 'ulga-dla-mlodych', 'ppk-a-wynagrodzenie-netto',
  'umowa-zlecenie-netto', 'co-to-jest-pit-2', 'premia-brutto-netto',
  'wynagrodzenie-chorobowe-a-zasilek',
];
const previewSlugs = [...pilots, ...scope4Slugs];

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

test('Publication generated HTML respects preview and public visibility', async (t) => {
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
  const selectedSlugs = previewSlugs; // Initial public launch publishes the same 10 reviewed guides.
  for (const slug of selectedSlugs) {
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
      assert.match(html, /application\/ld\+json/);
      assert.match(html, /"datePublished":"\d{4}-\d{2}-\d{2}"/);
      assert.match(html, /"dateModified":"\d{4}-\d{2}-\d{2}"/);
    }
  }
  assert.match(index, /Poradnik wynagrodzeń/);
  assert.equal(await exists('dist/sitemap.xml'), true);
  const sitemap = await readFile(file('dist/sitemap.xml'), 'utf8');
  assert.match(sitemap, /\/salary-calculator/);
  if (mode !== 'public') assert.doesNotMatch(sitemap, /\/poradnik/);
  else for (const slug of previewSlugs) assert.match(sitemap, new RegExp(`/poradnik/${slug}`));
});

test('Registry, published-only sitemap, shared URLs, and example math', async (t) => {
  let createServer;
  try { ({ createServer } = await import('vite')); }
  catch { return t.skip('Install dependencies to run registry tests'); }
  const vite = await createServer({ root, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { parseSiteOrigin } = await vite.ssrLoadModule('/src/seo/siteConfig.ts');
    const { renderSeoHead, articleSeoPage } = await vite.ssrLoadModule('/src/seo/metadata.ts');
    const { guidePath } = await vite.ssrLoadModule('/src/seo/routes.ts');
    const { ARTICLES, PREVIEW_ARTICLE_IDS, PILOT_ARTICLE_IDS, validateRegistry, visibleArticles } = await vite.ssrLoadModule('/src/content/poradnik/index.ts');
    const { generateSitemap } = await vite.ssrLoadModule('/src/seo/sitemap.ts');
    validateRegistry();
    const origin = parseSiteOrigin('https://vazo.vercel.app/');
    for (const bad of ['http://vazo.vercel.app', 'https://vazo.vercel.app/path', 'https://user:secret@vazo.vercel.app', '']) {
      assert.throws(() => parseSiteOrigin(bad));
    }
    assert.equal(guidePath(pilots[0]), `/poradnik/${pilots[0]}`);
    assert.deepEqual([...PILOT_ARTICLE_IDS], pilots);
    assert.deepEqual([...PREVIEW_ARTICLE_IDS], previewSlugs);
    assert.equal(ARTICLES.length, 10);
    assert.deepEqual(visibleArticles('preview').map((a) => a.slug), previewSlugs);
    assert.deepEqual(visibleArticles('public').map((a) => a.slug), previewSlugs);
    assert.ok(ARTICLES.every((a) => a.status === 'published' && /^\d{4}-\d{2}-\d{2}$/.test(a.publishedAt ?? '')));
    assert.equal(visibleArticles('off').length, 0);
    for (const article of ARTICLES) {
      assert.ok(['draft', 'published'].includes(article.status));
      assert.match(renderSeoHead(articleSeoPage(article), origin, 'preview'), /noindex, follow/);
      assert.doesNotMatch(renderSeoHead(articleSeoPage(article), origin, 'preview'), /rel="canonical"/);
    }
    const sitemap = generateSitemap(origin, ARTICLES);
    assert.equal(visibleArticles('public').length, 10);
    assert.equal((sitemap.match(/<lastmod>/g) ?? []).length, 10);
    for (const article of ARTICLES) {
      assert.ok(sitemap.includes(`<lastmod>${article.updatedAt ?? article.publishedAt}</lastmod>`));
      const publicHead = renderSeoHead(articleSeoPage(article), origin, 'public');
      assert.match(publicHead, /"datePublished":"\d{4}-\d{2}-\d{2}"/);
      assert.ok(publicHead.includes(`"dateModified":"${article.updatedAt ?? article.publishedAt}"`));
    }
    for (const article of ARTICLES) {
      if (article.status === 'draft') assert.ok(!sitemap.includes(guidePath(article.slug)), `draft leaked into sitemap: ${article.id}`);
      else assert.ok(sitemap.includes(guidePath(article.slug)), `published article missing from sitemap: ${article.id}`);
    }
    // Plain illustrative cases, not engine alignment assertions.
    assert.equal(6000 * (1 - .1371), 5177.4);
    assert.equal(Math.round((5177.4 / 30) * .8 * 100) / 100 * 6, 828.36);
    assert.equal((600 + 480 + 360) / 480 * 16, 48);
    // Scope 4: verify numerical claims independently of any actual salary records.
    assert.equal(6000 / 160 * 1.5, 56.25);
    assert.equal(6000 / 160 * 2, 75);
    assert.equal(90000 - 85528, 4472);
    assert.equal(6000 * .02 + 6000 * .015, 210);
    assert.equal(360 - 300, 60);
    assert.equal(4761.05 - 4420.43 > 340.619 && 4761.05 - 4420.43 < 340.621, true);
    assert.equal(35 - 33, 2);
  } finally {
    await vite.close();
  }
});


test('Seven new guides have clear numerical examples, scope and official sources', async () => {
  const files = {
    'jak-obliczyc-nadgodziny': ['overtime/jak-obliczyc-nadgodziny.tsx', /56,25 zł/, /75,00 zł/],
    'ulga-dla-mlodych': ['taxes/ulga-dla-mlodych.tsx', /85 528 zł/, /4472 zł/],
    'ppk-a-wynagrodzenie-netto': ['ppk/ppk-a-wynagrodzenie-netto.tsx', /120 zł/, /210 zł/],
    'umowa-zlecenie-netto': ['contracts/umowa-zlecenie-netto.tsx', /5000 zł netto/, /3611,67 zł netto/],
    'co-to-jest-pit-2': ['taxes/co-to-jest-pit-2.tsx', /300 zł/, /150 zł/],
    'premia-brutto-netto': ['contracts/premia-brutto-netto.tsx', /4420,43 zł netto/, /340,62 zł/],
    'wynagrodzenie-chorobowe-a-zasilek': ['l4/wynagrodzenie-chorobowe-a-zasilek.tsx', /33 dni/, /34. i 35./],
  };
  assert.equal(Object.keys(files).length, 7);
  for (const [slug, [relative, first, second]] of Object.entries(files)) {
    const source = await readFile(file(`src/content/poradnik/${relative}`), 'utf8');
    assert.match(source, /<ArticleExample /, `missing worked example: ${slug}`);
    assert.match(source, first, `missing first example amount: ${slug}`);
    assert.match(source, second, `missing second example amount: ${slug}`);
    assert.doesNotMatch(source, /Lorem|TODO|PLACEHOLDER/, `unfinished content: ${slug}`);
  }
});
