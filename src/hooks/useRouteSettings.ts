import { useLocalStorage } from './useLocalStorage';
import { DEFAULT_ROUTE_SETTINGS } from '../constants/depot';

export interface RouteSettings {
  stopTimeMinutes: number;
  startTime: string;
  averageSpeedKmh: number;
  returnToDepot: boolean;
  depotAddress?: string; // Custom depot address if different from default
}

export function useRouteSettings() {
  const [settings, setSettings] = useLocalStorage<RouteSettings>(
    'tournee-route-settings', 
    DEFAULT_ROUTE_SETTINGS
  );

  const updateSetting = <K extends keyof RouteSettings>(
    key: K, 
    value: RouteSettings[K]
  ) => {
    setSettings({ ...settings, [key]: value });
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_ROUTE_SETTINGS);
  };

  return {
    settings,
    updateSetting,
    resetToDefaults,
    setSettings,
  };
}