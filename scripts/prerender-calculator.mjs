import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, loadEnv } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const env = loadEnv('production', root, '');
const mode = process.env.PORADNIK_RELEASE_MODE ?? env.PORADNIK_RELEASE_MODE ?? 'off';
const siteUrl = process.env.VITE_SITE_URL ?? env.VITE_SITE_URL;
const vercelEnv = process.env.VERCEL_ENV;

const vite = await createServer({
  root,
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
});

try {
  const { parseSiteOrigin, resolveReleaseMode, assertReleaseEnvironment } =
    await vite.ssrLoadModule('/src/seo/siteConfig.ts');
  const releaseMode = resolveReleaseMode(mode);
  assertReleaseEnvironment(releaseMode, vercelEnv);
  const origin = parseSiteOrigin(siteUrl);
  const { calculatorSeoPage, renderSeoHead } =
    await vite.ssrLoadModule('/src/seo/metadata.ts');

  // The original Vite HTML is the only calculator UI shell.
  // Never prerender a second section or change #root's contents.
  const base = await readFile(path.join(dist, 'index.html'), 'utf8');
  if (!/<div\s+id=["']root["']\s*>\s*<\/div>/i.test(base)) {
    throw new Error('Vite output must contain the original empty #root mount.');
  }
  if (!/<title>[^<]*<\/title>/.test(base)) {
    throw new Error('Vite output is missing its title tag.');
  }
  if (!base.includes('</head>')) {
    throw new Error('Vite output is missing </head>.');
  }

  const putInHead = (html, markup) =>
    html.replace('</head>', `  ${markup}\n  </head>`);

  // Keep private routes on a separate HTML shell with no calculator metadata.
  const appShell = putInHead(
    base.replace(/<title>[^<]*<\/title>/, '<title>VAZO — aplikacja</title>'),
    '<meta name="robots" content="noindex, follow">',
  );
  await writeFile(path.join(dist, 'app-shell.html'), appShell, 'utf8');

  const head = renderSeoHead(calculatorSeoPage(), origin, releaseMode, {
    isPreviewDeployment: vercelEnv === 'preview',
  });
  const calculatorHtml = putInHead(
    base.replace(/<title>[^<]*<\/title>/, ''),
    head,
  );

  // Both URLs use the same app HTML and the same canonical, without redirecting '/'.
  for (const filename of ['index.html', 'salary-calculator.html']) {
    await writeFile(path.join(dist, filename), calculatorHtml, 'utf8');
  }
  console.log('[calculator SEO] Metadata-only / + /salary-calculator; existing #root UI unchanged.');
} finally {
  await vite.close();
}
