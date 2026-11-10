import type { ReactNode } from 'react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import type { ArticleDefinition } from '../../content/poradnik/types';
import { ARTICLE_CATEGORIES } from '../../content/poradnik';
import { PUBLIC_PATHS } from '../../seo/routes';

export default function ArticleLayout({ article, children }: { article: ArticleDefinition; children: ReactNode }) {
  const category = ARTICLE_CATEGORIES.find((item) => item.id === article.category);
  const intl = useIntl();
  return (
    <article className="article-page">
      <nav className="breadcrumbs" aria-label={intl.formatMessage({ id: 'poradnik-breadcrumbs-aria' })}>
        <a href={PUBLIC_PATHS.poradnik}><FormattedMessage id="poradnik-nav-guide" /></a>
        <span aria-hidden="true">/</span>
        {category && <span><FormattedMessage id={category.labelId} /></span>}
        <span aria-hidden="true">/</span>
        <span aria-current="page">{article.title}</span>
      </nav>
      <div className="article-label">{category && <FormattedMessage id={category.labelId} />}</div>
      <h1>{article.title}</h1>
      <p className="article-lead">{article.directAnswer}</p>
      {article.reviewedAt && (
        <p className="article-meta">
          <FormattedMessage id="poradnik-reviewed-at" />{' '}
          <time dateTime={article.reviewedAt}>
            <FormattedDate value={`${article.reviewedAt}T12:00:00Z`} day="numeric" month="long" year="numeric" timeZone="UTC" />
          </time>
          {article.effectiveDateScope && <>{' · '}<FormattedMessage id="poradnik-legal-scope" />: {article.effectiveDateScope}</>}
        </p>
      )}
      <div className="article-body">{children}</div>
    </article>
  );
}
