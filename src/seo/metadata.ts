import type { ArticleDefinition } from '../content/poradnik/types';
import type { PoradnikReleaseMode } from './siteConfig';
import { absoluteSiteUrl, guidePath, PUBLIC_PATHS } from './urls';
import { articleSchema, breadcrumbSchema, calculatorSchema, jsonLdScript } from './structuredData';
import { CALCULATOR_SEO } from './calculatorPage';
import { poradnikIntl } from '../poradnik/intl';

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export type SeoPage = Readonly<{
  path: string;
  title: string;
  description: string;
  kind: 'website' | 'article' | 'calculator';
  article?: ArticleDefinition;
}>;

export function calculatorSeoPage(): SeoPage {
  return {
    path: PUBLIC_PATHS.calculator,
    title: CALCULATOR_SEO.title,
    description: CALCULATOR_SEO.description,
    kind: 'calculator',
  };
}

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
export function renderSeoHead(
  page: SeoPage,
  origin: string,
  mode: PoradnikReleaseMode,
  options: { isPreviewDeployment?: boolean } = {},
): string {
  // Calculator indexing is independent of article publication.
  const indexable = page.kind === 'calculator'
    ? !options.isPreviewDeployment && mode !== 'preview'
    : mode === 'public' && (!page.article || page.article.status === 'published');
  const canonicalAllowed = indexable || page.kind === 'calculator';
  const head = [
    `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}">`,
    `<meta name="robots" content="${indexable ? 'index, follow' : 'noindex, follow'}">`,
    '<meta property="og:site_name" content="VAZO">',
    '<meta property="og:locale" content="pl_PL">',
    `<meta property="og:type" content="${page.kind === 'calculator' ? 'website' : page.kind}">`,
    `<meta property="og:title" content="${escapeHtml(page.title)}">`,
    `<meta property="og:description" content="${escapeHtml(page.description)}">`,
  ];
  if (canonicalAllowed) {
    const url = absoluteSiteUrl(origin, page.path);
    head.push(`<link rel="canonical" href="${escapeHtml(url)}">`);
    head.push(`<meta property="og:url" content="${escapeHtml(url)}">`);
    if (page.kind === 'calculator' && indexable) {
      head.push(jsonLdScript(calculatorSchema(origin, page.description)));
    }
    if (page.article) {
      head.push(jsonLdScript(breadcrumbSchema(origin, page.article)));
      head.push(jsonLdScript(articleSchema(origin, page.article)));
    }
  }
  return head.join('\n    ');
}
