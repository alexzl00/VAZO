import { FormattedMessage } from 'react-intl';
import type { ArticleDefinition } from '../../content/poradnik/types';
import type { PoradnikReleaseMode } from '../../seo/siteConfig';
import { visibleArticles } from '../../content/poradnik';
import { guidePath } from '../../seo/routes';

export default function RelatedArticles({ article, mode }: { article: ArticleDefinition; mode: PoradnikReleaseMode }) {
  const related = visibleArticles(mode).filter((item) => article.relatedArticleIds.includes(item.id));
  if (!related.length) return null;
  return (
    <section className="related-articles" aria-labelledby="related-title">
      <h2 id="related-title"><FormattedMessage id="poradnik-related-heading" /></h2>
      <ul>
        {related.map((item) => <li key={item.id}><a href={guidePath(item.slug)}>{item.title}</a></li>)}
      </ul>
    </section>
  );
}
