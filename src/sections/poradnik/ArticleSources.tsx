import { FormattedDate, FormattedMessage } from 'react-intl';
import type { OfficialSource } from '../../content/poradnik/types';

export default function ArticleSources({ sources }: { sources: readonly OfficialSource[] }) {
  if (!sources.length) return null;
  return (
    <section className="article-sources" aria-labelledby="sources-title">
      <h2 id="sources-title"><FormattedMessage id="poradnik-sources-heading" /></h2>
      <ul>
        {sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>
            <span>{' · '}<FormattedMessage id="poradnik-source-checked" />{' '}
              <time dateTime={source.reviewedAt}>
                <FormattedDate value={`${source.reviewedAt}T12:00:00Z`} day="numeric" month="long" year="numeric" timeZone="UTC" />
              </time>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
