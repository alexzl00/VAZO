import type { ArticleDefinition } from '../content/poradnik/types';
import type { PoradnikReleaseMode } from './siteConfig';
import { absoluteSiteUrl, guidePath, PUBLIC_PATHS } from './urls';
import { articleSchema, breadcrumbSchema, jsonLdScript } from './structuredData';
import { poradnikIntl } from '../poradnik/intl';

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export type SeoPage = Readonly<{
  path: string;
  title: string;
  description: string;
  kind: 'website' | 'article';
  article?: ArticleDefinition;
}>;

export function indexSeoPage(): SeoPage {
  return {
    path: PUBLIC_PATHS.poradnik,
    title: poradnikIntl.formatMessage({ id: 'poradnik-index-seo-title' }),
    description: poradnikIntl.formatMessage({ id: 'poradnik-index-seo-description' }),
    kind: 'website',
  };
}

export function articleSeoPage(article: ArticleDefinition): SeoPage {
  return {
    path: guidePath(article.slug),
    title: article.seoTitle,
    description: article.metaDescription,
    kind: 'article',
    article,
  };
}

/** Shared server-safe head builder; later reusable for calculator SEO. */
export function renderSeoHead(page: SeoPage, origin: string, mode: PoradnikReleaseMode): string {
  const published = mode === 'public' && (!page.article || page.article.status === 'published');
  const head = [
    `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}">`,
    `<meta name="robots" content="${published ? 'index, follow' : 'noindex, follow'}">`,
    '<meta property="og:site_name" content="VAZO">',
    '<meta property="og:locale" content="pl_PL">',
    `<meta property="og:type" content="${page.kind}">`,
    `<meta property="og:title" content="${escapeHtml(page.title)}">`,
    `<meta property="og:description" content="${escapeHtml(page.description)}">`,
  ];
  if (published) {
    const url = absoluteSiteUrl(origin, page.path);
    head.push(`<link rel="canonical" href="${escapeHtml(url)}">`);
    head.push(`<meta property="og:url" content="${escapeHtml(url)}">`);
    if (page.article) {
      head.push(jsonLdScript(breadcrumbSchema(origin, page.article)));
      head.push(jsonLdScript(articleSchema(origin, page.article)));
    }
  }
  return head.join('\n    ');
}
