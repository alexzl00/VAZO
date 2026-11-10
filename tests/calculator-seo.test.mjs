import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = (name) => readFile(path.join(root, name), 'utf8');
const exists = (name) => access(path.join(root, name)).then(() => true, () => false);
const mode = process.env.PORADNIK_RELEASE_MODE ?? 'off';
const isPreview = mode === 'preview' || process.env.VERCEL_ENV === 'preview';

const emptyRoot = /<div\s+id=["']root["']\s*>\s*<\/div>/i;
const canonical = /rel="canonical" href="https:\/\/[^" ]+\/salary-calculator"/;

const obsoleteUiFiles = [
  'src/pages/salaries/SalaryCalculatorLanding.tsx',
  'src/sections/calculator-seo/CalculatorSeoSection.tsx',
  'src/sections/calculator-seo/calculatorSeo.css',
  'src/calculator-seo/entry-server.tsx',
  'src/content/calculator/landing.ts',
  'src/content/calculator/relatedGuides.ts',
];

test('Both calculator routes use the original CreateSalary page without a wrapper', async () => {
  const routes = await source('src/routes/MainRoutes.tsx');
  assert.match(routes, /pages\/salaries\/CreateSalary/);
  assert.doesNotMatch(routes, /SalaryCalculatorLanding|CalculatorSeoSection/);
  for (const name of obsoleteUiFiles) {
    assert.equal(await exists(name), false, `${name} should be removed from Scope 3`);
  }
});

test('Calculator SEO is metadata-only; no standalone HTML or MUI elements are injected', async () => {
  const renderScript = await source('scripts/prerender-calculator.mjs');
  const metadata = await source('src/seo/calculatorPage.ts');
  assert.match(metadata, /title:|description:/);
  assert.doesNotMatch(metadata, /introduction:|examples:|scopeNote:|<section|<h1/);
  assert.match(renderScript, /const calculatorHtml = putInHead\(/);
  assert.match(renderScript, /base\.replace/);
  assert.doesNotMatch(renderScript, /renderCalculatorExplanation|renderToStaticMarkup|calculatorSeo\.css|data-calculator-seo/);
  const messages = JSON.parse(await source('src/utils/languages/pl.json'));
  for (const key of ['calculator-seo-possibilities', 'calculator-seo-scope-label', 'calculator-seo-related']) {
    assert.equal(messages[key], undefined, `Obsolete translation key remains: ${key}`);
  }
});

test('Vercel still uses dedicated calculator HTML and a private noindex shell', async () => {
  const config = JSON.parse(await source('vercel.json'));
  assert.ok(config.cleanUrls);
  assert.equal(config.rewrites.some(({ source }) => source === '/salary-calculator'), false);
  assert.ok(config.rewrites.every(({ destination }) => destination === '/app-shell'));
  assert.equal(config.rewrites.some(({ source }) => source.startsWith('/poradnik')), false);
});

test('Built calculator and homepage are identical to the SPA body, with isolated SEO heads', async (t) => {
  if (!await exists('dist/salary-calculator.html')) {
    return t.skip('Run full npm run build first');
  }
  const home = await source('dist/index.html');
  const calc = await source('dist/salary-calculator.html');
  const app = await source('dist/app-shell.html');
  const body = (html) => html.slice(html.indexOf('</head>') + '</head>'.length);
  for (const html of [home, calc]) {
    assert.match(html, emptyRoot);
    assert.equal(body(html), body(app), 'Calculator HTML must use the original app body, untouched');
    assert.match(html, canonical);
    assert.match(html, /name="description"/);
    assert.match(html, /property="og:title"/);
    assert.match(html, /type="module"/);
    assert.match(html, isPreview ? /content="noindex, follow"/ : /content="index, follow"/);
    assert.doesNotMatch(html, /calculator-seo-heading|data-calculator-seo|class="calculator-seo"/);
    if (mode !== 'public') {
      for (const slug of ['jak-obliczyc-podstawe-l4', 'ile-wynosi-wyplata-na-l4', 'jak-obliczyc-wynagrodzenie-urlopowe']) {
        assert.doesNotMatch(html, new RegExp(`/poradnik/${slug}`));
      }
    }
  }
  assert.match(app, /name="robots" content="noindex, follow"/);
  assert.doesNotMatch(app, /rel="canonical"|application\/ld\+json/);
  const sitemap = await source('dist/sitemap.xml');
  assert.match(sitemap, /\/salary-calculator<\/loc>/);
  assert.doesNotMatch(sitemap, /<loc>https:\/\/[^<]+\/login/);
  if (mode !== 'public') assert.doesNotMatch(sitemap, /\/poradnik/);
});

test('Shared head creates the canonical and application schema without altering UI', async (t) => {
  let createServer;
  try { ({ createServer } = await import('vite')); }
  catch { return t.skip('Vite dependencies not installed in isolated review'); }
  const vite = await createServer({ root, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { calculatorSeoPage, renderSeoHead } = await vite.ssrLoadModule('/src/seo/metadata.ts');
    const { generateSitemap } = await vite.ssrLoadModule('/src/seo/sitemap.ts');
    const page = calculatorSeoPage();
    const html = renderSeoHead(page, 'https://vazo.vercel.app', 'off');
    assert.match(html, /index, follow/);
    assert.match(html, /WebApplication/);
    assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1);
    assert.match(renderSeoHead(page, 'https://vazo.vercel.app', 'preview'), /noindex, follow/);
    const xml = generateSitemap('https://vazo.vercel.app', []);
    assert.match(xml, /\/salary-calculator/);
    assert.doesNotMatch(xml, /\/poradnik/);
  } finally {
    await vite.close();
  }
});
