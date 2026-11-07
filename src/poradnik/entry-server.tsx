import { createElement } from 'react';
import type { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { renderToStaticMarkup } from 'react-dom/server';
import PoradnikLayout from '../layouts/PoradnikLayout';
import PoradnikPage from '../pages/poradnik/PoradnikPage';
import ArticlePage from '../pages/poradnik/ArticlePage';
import type { ArticleDefinition } from '../content/poradnik/types';
import { ARTICLES, validateRegistry } from '../content/poradnik';
import { poradnikMessages } from './intl';
import type { PoradnikReleaseMode } from '../seo/siteConfig';

export { ARTICLES, validateRegistry };

function renderPublicTree(content: ReactNode): string {
  return renderToStaticMarkup(createElement(IntlProvider, {
    locale: 'pl', defaultLocale: 'pl', messages: poradnikMessages,
    children: createElement(PoradnikLayout, { children: content }),
  }));
}

/** Static HTML rendering: independent of browser-only app providers. */
export function renderIndex(mode: PoradnikReleaseMode): string {
  return renderPublicTree(createElement(PoradnikPage, { mode }));
}

export function renderArticle(article: ArticleDefinition, mode: PoradnikReleaseMode): string {
  return renderPublicTree(createElement(ArticlePage, { article, mode }));
}
