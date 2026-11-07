import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const env = loadEnv('production', root, '');
const mode = process.env.PORADNIK_RELEASE_MODE ?? env.PORADNIK_RELEASE_MODE ?? 'off';
const exists = async (file) => access(file).then(() => true, () => false);
const expect = (condition, message) => { if (!condition) throw new Error(`[public SEO validation] ${message}`); };
const slugs = [
  'jak-obliczyc-podstawe-l4',
  'ile-wynosi-wyplata-na-l4',
  'jak-obliczyc-wynagrodzenie-urlopowe',
];
const articleFile = (slug) => path.join(dist, 'poradnik', `${slug}.html`);
const index = path.join(dist, 'poradnik.html');
const sitemap = path.join(dist, 'sitemap.xml');

expect(await exists(path.join(dist, 'index.html')), 'SPA index.html is missing');
const config = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8'));
expect(config.cleanUrls === true, 'Vercel cleanUrls must be enabled');
expect(config.rewrites.some((route) => route.source === '/salary-calculator'), 'calculator rewrite missing');
expect(!config.rewrites.some((route) => route.source.includes('poradnik') || route.source.includes('(.*)') || route.source.includes(':path*')), 'unsafe broad guide rewrite');
expect(!await exists(articleFile('demo-architektury')), 'old technical article emitted');

if (mode === 'off') {
  expect(!await exists(index), 'off mode emitted /poradnik');
  expect(!await exists(sitemap), 'off mode emitted sitemap');
  for (const slug of slugs) expect(!await exists(articleFile(slug)), `off mode emitted ${slug}`);
} else if (mode === 'preview' || mode === 'public') {
  expect(await exists(index), 'guide index missing');
  const pages = [index, ...slugs.map(articleFile)];
  for (const file of pages) {
    expect(await exists(file), `missing guide page: ${file}`);
    const html = await readFile(file, 'utf8');
    expect(html.includes('<html lang="pl-PL">'), 'Polish HTML lang missing');
    expect(html.includes('<h1>'), 'H1 missing');
    expect(html.includes('class="guide-header"'), 'header missing');
    expect(html.includes('href="/salary-calculator"'), 'calculator link missing');
    expect(!html.includes('demo-architektury'), 'technical sample leaked');
    expect(!html.includes('Wersja testowa') && !html.includes('Podgląd techniczny'), 'visible preview/demo messaging leaked');
    expect(!html.includes('id="root"'), 'incorrect SPA rendering');
    expect(!html.includes('poradnik-card-read') && !html.includes('poradnik-nav-guide'), 'unresolved intl translation');
    if (mode === 'preview') {
      expect(html.includes('content="noindex, follow"'), 'preview noindex missing');
      expect(!html.includes('rel="canonical"'), 'draft canonical must not be emitted');
      expect(!html.includes('application/ld+json'), 'draft publishing schema must not be emitted');
    } else {
      expect(html.includes('content="index, follow"'), 'published indexing tag missing');
      expect(html.includes('rel="canonical"'), 'published canonical missing');
    }
  }
  const indexHtml = await readFile(index, 'utf8');
  for (const slug of slugs) expect(indexHtml.includes(`/poradnik/${slug}`), `index does not link to ${slug}`);
  expect(await exists(path.join(dist, 'poradnik/poradnik.css')), 'stylesheet missing');
  expect(await exists(path.join(dist, 'poradnik/VAZO-logo.png')), 'logo missing');
  if (mode === 'preview') {
    expect(!await exists(sitemap), 'preview drafts must not be in sitemap');
  } else {
    expect(await exists(sitemap), 'published sitemap missing');
    const xml = await readFile(sitemap, 'utf8');
    for (const slug of slugs) expect(xml.includes(`/poradnik/${slug}`), `sitemap missing ${slug}`);
    expect(!xml.includes('/salaries'), 'private route in sitemap');
  }
} else {
  throw new Error(`Unexpected release mode: ${mode}`);
}
console.log(`[public SEO validation] ${mode} output checks passed. HTTP statuses and visual layout still require Vercel/browser testing.`);
