import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const env = loadEnv('production', root, '');
const mode = process.env.PORADNIK_RELEASE_MODE ?? env.PORADNIK_RELEASE_MODE ?? 'off';
const preview = mode === 'preview' || process.env.VERCEL_ENV === 'preview';
const siteOrigin = process.env.VITE_SITE_URL ?? env.VITE_SITE_URL;
const validOrigin = new URL(siteOrigin).origin;
const calculatorCanonical = `${validOrigin}/salary-calculator`;
const exists = async (filename) => access(filename).then(() => true, () => false);
const expect = (condition, message) => { if (!condition) throw new Error(`[public SEO validation] ${message}`); };
const occurrences = (source, pattern) => [...source.matchAll(pattern)].length;
const articleSlugs = ['jak-obliczyc-podstawe-l4', 'ile-wynosi-wyplata-na-l4', 'jak-obliczyc-wynagrodzenie-urlopowe'];
const articleFile = (slug) => path.join(dist, 'poradnik', `${slug}.html`);
const poradnikIndex = path.join(dist, 'poradnik.html');

const config = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8'));
expect(config.cleanUrls === true, 'Vercel cleanUrls must be enabled');
expect(!config.rewrites.some(({ source }) => source === '/salary-calculator'), 'calculator must be served from its own generated HTML');
expect(config.rewrites.every(({ destination }) => destination === '/app-shell'), 'private routes must use noindex app shell');
expect(!config.rewrites.some(({ source }) => source.startsWith('/poradnik') || source.includes('(.*)') || source.includes(':path*')), 'unsafe catch-all or guide rewrite');
for (const expected of ['/login', '/salaries', '/profile', '/work-relations', '/signup']) {
  expect(config.rewrites.some(({ source }) => source === expected), `missing app route rewrite ${expected}`);
}

for (const name of ['index.html', 'salary-calculator.html', 'app-shell.html']) {
  expect(await exists(path.join(dist, name)), `missing ${name}`);
}
const home = await readFile(path.join(dist, 'index.html'), 'utf8');
const calculator = await readFile(path.join(dist, 'salary-calculator.html'), 'utf8');
const app = await readFile(path.join(dist, 'app-shell.html'), 'utf8');

for (const [name, html] of [['/', home], ['/salary-calculator', calculator]]) {
  const head = html.split('</head>')[0];
  expect(html.includes('<html lang="pl-PL">'), `${name} has wrong language`);
  expect(occurrences(head, /rel="canonical"/g) === 1, `${name} must have exactly one canonical`);
  expect(head.includes(`rel="canonical" href="${calculatorCanonical}"`), `${name} has wrong canonical`);
  expect(head.includes('name="description"'), `${name} missing description`);
  expect(head.includes('property="og:title"'), `${name} missing Open Graph title`);
  expect(head.includes('property="og:url"'), `${name} missing Open Graph URL`);
  expect(head.includes(`content="${preview ? 'noindex' : 'index'}, follow"`), `${name} wrong robots mode`);
  expect(html.includes('id="root"'), `${name} missing existing app root`);
  // No SEO-only body elements are allowed. React renders the unchanged calculator.
  expect(/<div\s+id=["']root["']\s*>\s*<\/div>/i.test(html), `${name} must retain the empty React root`);
  expect(!html.includes('calculator-seo-heading') && !html.includes('data-calculator-seo'), `${name} contains removed visible SEO markup`);
  expect(!html.includes('class="calculator-seo"'), `${name} contains an unwanted SEO section`);
  expect(html.includes('type="module"'), `${name} lost SPA javascript`);
  for (const slug of articleSlugs) {
    if (mode !== 'public') expect(!html.includes(`/poradnik/${slug}`), `${name} leaks unpublished article ${slug}`);
  }
}
expect(app.includes('name="robots" content="noindex, follow"'), 'app shell noindex is missing');
expect(!app.includes('rel="canonical"'), 'private app shell leaked a canonical');
expect(!app.includes('calculator-seo-heading'), 'private app shell leaked removed SEO markup');
expect(!app.includes('application/ld+json'), 'private app shell leaked structured data');
expect(!app.includes('data-calculator-seo'), 'private app shell leaked removed SEO styles');
expect(app.split('</head>')[1] === calculator.split('</head>')[1], 'calculator body differs from original app shell');
expect(app.includes('type="module"') && app.includes('id="root"'), 'private app shell lost the SPA');

const sitemapFile = path.join(dist, 'sitemap.xml');
expect(await exists(sitemapFile), 'public sitemap missing even though calculator is public');
const xml = await readFile(sitemapFile, 'utf8');
expect(xml.includes(`<loc>${calculatorCanonical}</loc>`), 'calculator missing from sitemap');
expect(!xml.includes(`<loc>${validOrigin}/</loc>`), 'duplicate homepage in sitemap');
for (const privateRoute of ['/login', '/signup', '/salaries', '/profile', '/work-relations']) {
  expect(!xml.includes(`<loc>${validOrigin}${privateRoute}`), `private route leaked into sitemap: ${privateRoute}`);
}
expect(await exists(path.join(dist, 'robots.txt')), 'robots.txt missing');
const robots = await readFile(path.join(dist, 'robots.txt'), 'utf8');
expect(robots.includes(`Sitemap: ${validOrigin}/sitemap.xml`), 'robots.txt sitemap URL wrong');

expect(!await exists(articleFile('demo-architektury')), 'old technical article emitted');
if (mode === 'off') {
  expect(!await exists(poradnikIndex), 'off mode emitted Poradnik');
  for (const slug of articleSlugs) expect(!await exists(articleFile(slug)), `off mode emitted ${slug}`);
} else if (mode === 'preview' || mode === 'public') {
  expect(await exists(poradnikIndex), 'guide index missing');
  const pages = [poradnikIndex, ...articleSlugs.map(articleFile)];
  for (const filename of pages) {
    expect(await exists(filename), `missing guide page: ${filename}`);
    const html = await readFile(filename, 'utf8');
    expect(html.includes('<html lang="pl-PL">'), 'guide must have Polish HTML language');
    expect(html.includes('<h1>'), 'guide H1 missing');
    expect(html.includes('class="guide-header"'), 'guide header missing');
    expect(html.includes('href="/salary-calculator"'), 'guide calculator link missing');
    expect(!html.includes('demo-architektury'), 'technical sample leaked');
    expect(!html.includes('Wersja testowa') && !html.includes('Podgląd techniczny'), 'visible preview message leaked');
    expect(!html.includes('id="root"'), 'guide incorrectly rendered as SPA');
    expect(!html.includes('poradnik-card-read') && !html.includes('poradnik-nav-guide'), 'unresolved intl message');
    if (mode === 'preview') {
      expect(html.includes('content="noindex, follow"'), 'draft noindex missing');
      expect(!html.includes('rel="canonical"'), 'draft canonical leaked');
      expect(!html.includes('application/ld+json'), 'draft JSON-LD leaked');
    } else {
      expect(html.includes('content="index, follow"'), 'published indexing meta missing');
      expect(html.includes('rel="canonical"'), 'published canonical missing');
    }
  }
  const html = await readFile(poradnikIndex, 'utf8');
  for (const slug of articleSlugs) expect(html.includes(`/poradnik/${slug}`), `index missing ${slug}`);
  expect(await exists(path.join(dist, 'poradnik/poradnik.css')), 'guide CSS missing');
  expect(await exists(path.join(dist, 'poradnik/VAZO-logo.png')), 'guide logo missing');
  if (mode === 'public') {
    for (const slug of articleSlugs) expect(xml.includes(`/poradnik/${slug}`), `sitemap missing published ${slug}`);
  }
} else {
  throw new Error(`Unexpected release mode: ${mode}`);
}
if (mode !== 'public') {
  expect(!xml.includes('/poradnik'), 'draft Poradnik links leaked into public sitemap');
}
console.log(`[public SEO validation] Calculator + Poradnik ${mode} build checks passed. HTTP and UI behavior still need Vercel verification.`);
