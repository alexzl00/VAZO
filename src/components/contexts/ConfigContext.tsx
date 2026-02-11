import { createContext } from 'react';

import type { ReactElement } from 'react'

// project import
import config from '../../utils/config';
import type { ThemeMode } from '../../utils/config';
import { useLocalStorage } from '../../hooks/useLocalStorage';

import type { I18n } from '../../types/config';
import type { CustomizationProps } from '../../types/config'

// initial state
const initialState: CustomizationProps = {
  ...config,
  onChangeLang: () => {},
  onChangeMode: () => {},
};

// ==============================|| CONFIG CONTEXT & PROVIDER ||============================== //

const ConfigContext = createContext(initialState);

type ConfigProviderProps = {
  children: ReactElement;
};

function ConfigProvider({ children }: ConfigProviderProps) {
  const [config, setConfig] = useLocalStorage('mantis-react-ts-config', initialState);

  const onChangeLang = (lang: I18n) => {
    setConfig({
      ...config,
      i18n: lang
    });
  };

  const onChangeMode = (mode: ThemeMode) => {
    setConfig({
      ...config,
      mode
    });
  };

  return (
    <ConfigContext.Provider
      value={{
        ...config,
        onChangeLang,
        onChangeMode,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export { ConfigProvider, ConfigContext };