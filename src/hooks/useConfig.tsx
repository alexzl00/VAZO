import { useContext } from 'react';
import { ConfigContext } from '../components/contexts/ConfigContext';

export default function useConfig() {
  return useContext(ConfigContext);
}