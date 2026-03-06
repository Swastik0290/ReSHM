import React, { useState, useEffect } from 'react';
import './Settings.css';

const SETTINGS_KEY = 'svasa_settings';

const defaultSettings = {
  timezone: 'Asia/Kolkata',
  refreshInterval: 30,
  alertsEnabled: true,
  darkMode: false
};

const Settings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch (e) {
        console.warn('Failed to parse settings');
      }
    }
  }, []);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const saveSettings = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-page">
      <h1 className="settings-title">Settings</h1>
      <div className="settings-content">
        <div className="settings-card">
          <h2 className="settings-section-title">General</h2>
          
          <div className="setting-item">
            <label htmlFor="timezone">Timezone</label>
            <select
              id="timezone"
              value={settings.timezone}
              onChange={(e) => updateSetting('timezone', e.target.value)}
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="America/New_York">America/New York (EST)</option>
              <option value="America/Los_Angeles">America/Los Angeles (PST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          <div className="setting-item">
            <label htmlFor="refreshInterval">Dashboard refresh interval (seconds)</label>
            <select
              id="refreshInterval"
              value={settings.refreshInterval}
              onChange={(e) => updateSetting('refreshInterval', parseInt(e.target.value))}
            >
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>60 seconds</option>
              <option value={120}>2 minutes</option>
            </select>
          </div>
        </div>

        <div className="settings-card">
          <h2 className="settings-section-title">Notifications</h2>
          
          <div className="setting-item setting-toggle">
            <label htmlFor="alertsEnabled">Show alert notifications</label>
            <input
              type="checkbox"
              id="alertsEnabled"
              checked={settings.alertsEnabled}
              onChange={(e) => updateSetting('alertsEnabled', e.target.checked)}
            />
          </div>
        </div>

        <div className="settings-card">
          <h2 className="settings-section-title">Appearance</h2>
          
          <div className="setting-item setting-toggle">
            <label htmlFor="darkMode">Dark mode</label>
            <input
              type="checkbox"
              id="darkMode"
              checked={settings.darkMode}
              onChange={(e) => updateSetting('darkMode', e.target.checked)}
            />
          </div>
        </div>

        <button className="settings-save-btn" onClick={saveSettings}>
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
export { SETTINGS_KEY, defaultSettings };
