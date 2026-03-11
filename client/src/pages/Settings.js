import React, { useState, useEffect } from 'react';
import { FiX, FiPlus } from 'react-icons/fi';
import './Settings.css';

const SETTINGS_KEY = 'reshm_settings';

const defaultSettings = {
  timezone: 'Asia/Kolkata',
  refreshInterval: 30,
  refreshInterval: 30,
  alertsEnabled: true,
  darkMode: false,
  senderEmail: '',
  senderPassword: '',
  emergencyEmails: []
};

const Settings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [newEmail, setNewEmail] = useState('');

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

  const addEmail = () => {
    if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) return;
    const currentEmails = settings.emergencyEmails || [];
    if (currentEmails.includes(newEmail)) {
      setNewEmail('');
      return;
    }
    updateSetting('emergencyEmails', [...currentEmails, newEmail]);
    setNewEmail('');
  };

  const removeEmail = (email) => {
    updateSetting('emergencyEmails', (settings.emergencyEmails || []).filter(e => e !== email));
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

        <div className="settings-card">
          <h2 className="settings-section-title">Sender Email Configuration (SOS)</h2>
          <p className="settings-description" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>
            Configure the email account that will <strong>send</strong> the SOS alerts. If you use Gmail, you must use an <strong>App Password</strong>.
          </p>

          <div className="setting-item">
            <label htmlFor="senderEmail">Sender Email Address</label>
            <input
              type="email"
              id="senderEmail"
              value={settings.senderEmail || ''}
              onChange={(e) => updateSetting('senderEmail', e.target.value)}
              placeholder="your_email@gmail.com"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', width: '100%', marginBottom: '15px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="setting-item">
            <label htmlFor="senderPassword">Sender App Password</label>
            <input
              type="password"
              id="senderPassword"
              value={settings.senderPassword || ''}
              onChange={(e) => updateSetting('senderPassword', e.target.value)}
              placeholder="16-character app password"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <div className="settings-card">
          <h2 className="settings-section-title">Emergency Contacts (SOS)</h2>
          <p className="settings-description" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>
            Add the people who should <strong>receive</strong> the SOS alert.
          </p>

          <div className="setting-item email-input-group">
            <label htmlFor="newEmail">Add Email Address</label>
            <div className="email-input-row">
              <input
                type="email"
                id="newEmail"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="doctor@example.com"
                onKeyDown={(e) => e.key === 'Enter' && addEmail()}
              />
              <button className="email-add-btn" onClick={addEmail}>
                <FiPlus /> Add
              </button>
            </div>
          </div>

          {(settings.emergencyEmails && settings.emergencyEmails.length > 0) && (
            <div className="email-list">
              {settings.emergencyEmails.map(email => (
                <div key={email} className="email-chip">
                  <span>{email}</span>
                  <button onClick={() => removeEmail(email)} className="email-remove-btn" title="Remove Email"><FiX /></button>
                </div>
              ))}
            </div>
          )}
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
