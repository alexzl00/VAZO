import { FormattedMessage, useIntl } from 'react-intl';
import type { CalculatorCallToAction } from '../../content/poradnik/types';

export default function CalculatorCTA({ cta }: { cta: CalculatorCallToAction }) {
  const intl = useIntl();
  return (
    <aside className="calculator-cta" aria-label={intl.formatMessage({ id: 'poradnik-cta-aria' })}>
      <div>
        <h2><FormattedMessage id="poradnik-cta-heading" /></h2>
        <p>{cta.description}</p>
      </div>
      <a className="cta-button" href={cta.href}>
        <FormattedMessage id="poradnik-cta-button" /> <span aria-hidden="true">→</span>
      </a>
    </aside>
  );
}
