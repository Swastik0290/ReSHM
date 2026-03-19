import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiLogOut } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useGoogleLogin } from '@react-oauth/google';
import { sendEmailViaGmailAPI } from '../utils/gmail';
import './Settings.css';

const SETTINGS_KEY = 'reshm_settings';

const defaultSettings = {
  timezone: 'Asia/Kolkata',
  refreshInterval: 30,
  alertsEnabled: true,
  darkMode: false,
  senderEmail: '',
  googleAccessToken: '',
  emergencyEmails: []
};

const Settings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [verifyStatus, setVerifyStatus] = useState('idle');
  const [verifyMessage, setVerifyMessage] = useState('');

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

  const loginWithGoogle = useGoogleLogin({
    flow: 'implicit',
    scope: 'https://www.googleapis.com/auth/gmail.send email profile',
    onSuccess: (tokenResponse) => {
      setVerifyStatus('success');
      setVerifyMessage('Google OAuth Linked Successfully!');
      updateSetting('googleAccessToken', tokenResponse.access_token);
      setTimeout(() => setVerifyStatus('idle'), 4000);
    },
    onError: (errorResponse) => {
      setVerifyStatus('error');
      setVerifyMessage('Google auth failed or was cancelled');
      setTimeout(() => setVerifyStatus('idle'), 4000);
    }
  });

  const testEmailConnection = async () => {
    if (!settings.googleAccessToken) {
      setVerifyMessage('Please link your Google account first.');
      setVerifyStatus('error');
      setTimeout(() => setVerifyStatus('idle'), 4000);
      return;
    }

    setVerifyStatus('testing');
    try {
      // For verification, send an email to the first emergency contact, or prompt for an email.
      // We'll just send to the first logged string or a hardcoded target if needed.
      const targetEmail = settings.emergencyEmails?.[0] || 'admin@reshm.local';
      
      await sendEmailViaGmailAPI(
        settings.googleAccessToken,
        [targetEmail],
        "✅ ReSHM System - Email Verification Successful",
        "Verification Successful\n\nYour ReSHM Google OAuth configuration is working correctly from the frontend."
      );
      
      setVerifyStatus('success');
      setVerifyMessage('Verification email sent successfully! Please check the inbox of the first emergency contact.');
    } catch (err) {
      setVerifyStatus('error');
      setVerifyMessage('Failed: ' + err.message);
    }
    setTimeout(() => {
      setVerifyStatus('idle');
      setVerifyMessage('');
    }, 8000);
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
            Configure the email account that will <strong>send</strong> the SOS alerts. We use Google OAuth to securely send emails on your behalf without requiring an App Password.
          </p>

            <div className="setting-item">
            <label htmlFor="senderEmail">Sender Display Name/Identifier (Optional)</label>
            <input
              type="text"
              id="senderEmail"
              value={settings.senderEmail || ''}
              onChange={(e) => updateSetting('senderEmail', e.target.value)}
              placeholder="E.g. Main Dashboard"
            />
          </div>

          <div className="setting-item">
            <label>Authentication</label>
            
            {(settings.googleAccessToken) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', border: '1px solid #10b981', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 'bold' }}>
                        <FcGoogle size={20} />
                        Linked securely with Google OAuth (Frontend Mode)
                    </div>
                    <button 
                        onClick={() => updateSetting('googleAccessToken', '')}
                        style={{ alignSelf: 'flex-start', background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                        <FiLogOut /> Unlink Google Account
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        className="settings-save-btn" 
                        style={{ flex: 1, backgroundColor: '#ffffff', color: '#333', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        onClick={() => loginWithGoogle()}
                    >
                        <FcGoogle size={20} />
                        Sign in with Google to Link Inbox
                    </button>
                </div>
            )}
          </div>

          <div className="setting-item">
            <button 
              className="settings-save-btn" 
              style={{marginTop: '10px', backgroundColor: '#10b981'}}
              onClick={testEmailConnection}
              disabled={verifyStatus === 'testing' || !settings.googleAccessToken}
            >
              {verifyStatus === 'testing' ? 'Verifying...' : 'Verify Sender Config By Sending Test Email'}
            </button>
            {verifyMessage && (
              <p style={{marginTop: '10px', fontSize: '0.9rem', color: verifyStatus === 'success' ? '#10b981' : '#ef4444'}}>
                {verifyMessage}
              </p>
            )}
            {!settings.googleAccessToken && verifyStatus === 'idle' && (
              <p style={{marginTop: '10px', fontSize: '0.9rem', color: '#f59e0b'}}>
                ⚠️ You must sign in with Google above to enable sending.
              </p>
            )}
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
