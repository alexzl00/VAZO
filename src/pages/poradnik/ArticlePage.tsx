import type { ArticleDefinition } from '../../content/poradnik/types';
import type { PoradnikReleaseMode } from '../../seo/siteConfig';
import ArticleLayout from '../../sections/poradnik/ArticleLayout';
import CalculatorCTA from '../../sections/poradnik/CalculatorCTA';
import ArticleSources from '../../sections/poradnik/ArticleSources';
import RelatedArticles from '../../sections/poradnik/RelatedArticles';

export default function ArticlePage({ article, mode }: { article: ArticleDefinition; mode: PoradnikReleaseMode }) {
  const Content = article.content;
  return (
    <>
      <ArticleLayout article={article}>
        <Content />
      </ArticleLayout>
      <div className="article-end-sections">
        <CalculatorCTA cta={article.cta} />
        <RelatedArticles article={article} mode={mode} />
        <ArticleSources sources={article.sources} />
      </div>
    </>
  );
}
