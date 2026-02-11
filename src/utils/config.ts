// types
import type { DefaultConfigProps } from '../types/config';


export const MAIN_FONT_SIZE = '1.0625rem';
export const SECONDARY_FONT_SIZE = '0.9375rem';

export type ThemeMode = 'light' | 'dark';

export const DEFAULT_LANG = 'pl';

const config: DefaultConfigProps = {
  i18n: DEFAULT_LANG,
  mode: 'light',
};

export default config;