import type { ThemeMode } from '../utils/config'
export type I18n = 'pl'

export type DefaultConfigProps = {
  i18n: I18n;
  mode: ThemeMode;
};

export type CustomizationProps = {
  i18n: I18n;
  mode: ThemeMode;
  onChangeLang: (lang: I18n) => void;
  onChangeMode: (mode: ThemeMode) => void;
};
