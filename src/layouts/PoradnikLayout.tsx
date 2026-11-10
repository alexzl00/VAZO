import type { ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { PUBLIC_PATHS } from '../seo/routes';

type Props = Readonly<{ children: ReactNode }>;

/** Public static layout deliberately does not load the authenticated SPA. */
export default function PoradnikLayout({ children }: Props) {
  const intl = useIntl();
  return (
    <div className="guide-shell">
      <a className="skip-link" href="#main-content">
        <FormattedMessage id="poradnik-skip-content" />
      </a>
      <header className="guide-header">
        <div className="guide-header-inner">
          <a className="guide-brand" href={PUBLIC_PATHS.calculator}
            aria-label={intl.formatMessage({ id: 'poradnik-brand-aria' })}>
            <img src="/poradnik/VAZO-logo.png" width="44" height="44" alt="" />
            <span>VAZO</span>
          </a>
          <nav className="guide-nav" aria-label={intl.formatMessage({ id: 'poradnik-main-navigation' })}>
            <a href={PUBLIC_PATHS.poradnik}><FormattedMessage id="poradnik-nav-guide" /></a>
            <a className="guide-nav-action" href={PUBLIC_PATHS.calculator}>
              <FormattedMessage id="poradnik-nav-calculator" />
            </a>
          </nav>
        </div>
      </header>
      <main id="main-content" className="guide-main">{children}</main>
      <footer className="guide-footer">
        <div className="guide-footer-inner">
          <span><FormattedMessage id="poradnik-footer-brand" /></span>
          <a href={PUBLIC_PATHS.calculator}><FormattedMessage id="poradnik-footer-calculator" /></a>
        </div>
      </footer>
    </div>
  );
}
