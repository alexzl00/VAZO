import type { ArticleDefinition } from '../content/poradnik/types';
import { absoluteSiteUrl, guidePath, PUBLIC_PATHS } from './urls';

/** Escaping < and friends prevents embedded JSON-LD from terminating its script. */
export function jsonLdScript(data: object): string {
  const serialized = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
  return `<script type="application/ld+json">${serialized}</script>`;
}

export function breadcrumbSchema(origin: string, article?: ArticleDefinition): object {
  const items = [
    { '@type': 'ListItem', position: 1, name: 'Poradnik', item: absoluteSiteUrl(origin, PUBLIC_PATHS.poradnik) },
  ];
  if (article) {
    items.push({ '@type': 'ListItem', position: 2, name: article.title, item: absoluteSiteUrl(origin, guidePath(article.slug)) });
  }
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items };
}

export function articleSchema(origin: string, article: ArticleDefinition): object {
  if (article.status !== 'published' || !article.publishedAt || !article.reviewedAt) {
    throw new Error('Unpublished or unreviewed content must not have Article structured data.');
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription,
    inLanguage: 'pl-PL',
    mainEntityOfPage: absoluteSiteUrl(origin, guidePath(article.slug)),
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.reviewedAt,
    publisher: { '@type': 'Organization', name: 'VAZO' },
  };
}
