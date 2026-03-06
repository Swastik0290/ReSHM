import { useState, useEffect } from 'react';
import { SETTINGS_KEY, defaultSettings } from '../pages/Settings';

export const useSettings = () => {
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(stored) }));
      } catch (e) {}
    }
  }, []);

  return settings;
};
