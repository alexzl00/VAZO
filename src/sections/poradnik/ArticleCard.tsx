import { FormattedMessage, useIntl } from 'react-intl';
import type { ArticleDefinition } from '../../content/poradnik/types';
import { guidePath } from '../../seo/routes';

export default function ArticleCard({ article }: { article: ArticleDefinition }) {
  const intl = useIntl();
  return (
    <article className="article-card">
      <h3><a href={guidePath(article.slug)}>{article.title}</a></h3>
      <p>{article.excerpt}</p>
      <a className="article-card-link" href={guidePath(article.slug)} aria-label={intl.formatMessage({ id: 'poradnik-card-aria' }, { title: article.title })}>
        <FormattedMessage id="poradnik-card-read" /> <span aria-hidden="true">→</span>
      </a>
    </article>
  );
}
