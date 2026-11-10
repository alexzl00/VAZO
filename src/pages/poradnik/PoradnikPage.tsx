import { FormattedMessage } from 'react-intl';
import { ARTICLE_CATEGORIES, visibleArticles } from '../../content/poradnik';
import type { PoradnikReleaseMode } from '../../seo/siteConfig';
import ArticleCard from '../../sections/poradnik/ArticleCard';

export default function PoradnikPage({ mode }: { mode: PoradnikReleaseMode }) {
  const articles = visibleArticles(mode);
  return (
    <div className="guide-index">
      <section className="guide-hero">
        <p className="eyebrow"><FormattedMessage id="poradnik-index-eyebrow" /></p>
        <h1><FormattedMessage id="poradnik-index-heading" /></h1>
        <p><FormattedMessage id="poradnik-index-introduction" /></p>
      </section>
      <div className="category-list">
        {ARTICLE_CATEGORIES.map((category) => {
          const items = articles.filter((article) => article.category === category.id);
          return items.length ? (
            <section key={category.id} className="category-section" aria-labelledby={`category-${category.id}`}>
              <h2 id={`category-${category.id}`}>
                <FormattedMessage id={category.labelId} />
              </h2>
              <div className="article-grid">
                {items.map((article) => <ArticleCard key={article.id} article={article} />)}
              </div>
            </section>
          ) : null;
        })}
      </div>
    </div>
  );
}
