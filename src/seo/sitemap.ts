import type { ArticleDefinition } from '../content/poradnik/types';
import { absoluteSiteUrl, guidePath, PUBLIC_PATHS } from './urls';
import { escapeHtml } from './metadata';

/** Only actual published routes are included. Calculator joins here in Phase 3. */
export function sitemapRoutes(articles: readonly ArticleDefinition[]): Array<{ path: string; updatedAt?: string }> {
  const published = articles.filter((article) => article.status === 'published');
  if (!published.length) return [];
  return [
    { path: PUBLIC_PATHS.poradnik },
    ...published.map((article) => ({ path: guidePath(article.slug), updatedAt: article.updatedAt ?? article.reviewedAt })),
  ];
}

export function generateSitemap(origin: string, articles: readonly ArticleDefinition[]): string {
  const lines = sitemapRoutes(articles).map(({ path, updatedAt }) =>
    `  <url><loc>${escapeHtml(absoluteSiteUrl(origin, path))}</loc>${updatedAt ? `<lastmod>${escapeHtml(updatedAt)}</lastmod>` : ''}</url>`
  );
  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...lines, '</urlset>', ''].join('\n');
}
