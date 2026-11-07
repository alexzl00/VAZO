import { createIntl, createIntlCache } from 'react-intl';
import polishMessages from '../utils/languages/pl.json';

/** Synchronous message catalog shared by SSG React markup and head metadata. */
export const poradnikMessages: Record<string, string> = polishMessages;
export const poradnikIntl = createIntl(
  { locale: 'pl', defaultLocale: 'pl', messages: poradnikMessages },
  createIntlCache()
);
