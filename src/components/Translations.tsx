import { useEffect, useState } from 'react';
import type { ReactNode } from 'react'

// third-party
import { IntlProvider } from 'react-intl';
import type { MessageFormatElement } from 'react-intl'

// project import
import useConfig from '../hooks/useConfig';

import type { I18n } from '../types/config';

// load locales files
const languages = (lang: I18n) => {
  switch (lang) {
    default:
      return import('../utils/languages/pl.json');
  }
};

interface Props {
  children: ReactNode;
}

export default function Translations({ children }: Props) {
  const { i18n } = useConfig();

  const [messages, setMessages] = useState<Record<string, string> | Record<string, MessageFormatElement[]> | undefined>();

  useEffect(() => {
    languages(i18n).then((d) => {
      setMessages(d.default as Record<string, string>);
    });
  }, [i18n]);

  return (
    <>
      {messages && (
        <IntlProvider locale={i18n} defaultLocale="pl" messages={messages}>
          {children}
        </IntlProvider>
      )}
    </>
  );
}