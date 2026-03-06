import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './ConnectDevice.css';

const SEND_INTERVAL_MS = 5000;

const ConnectDevice = () => {
  const { user, token, isAdmin } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [deviceId, setDeviceId] = useState('');
  const [apiBase, setApiBase] = useState('');
  const [sending, setSending] = useState(false);
  const [lastSent, setLastSent] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [lastCoords, setLastCoords] = useState(null);
  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    setApiBase(window.location.origin);
  }, []);

  useEffect(() => {
    if (!isAdmin || !token) return;
    axios.get('/api/rooms', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setRooms(Array.isArray(res.data) ? res.data.filter((r) => r.deviceId) : []))
      .catch(() => setRooms([]));
  }, [isAdmin, token]);

  const sendReading = (latitude, longitude) => {
    const base = apiBase.replace(/\/$/, '');
    const url = `${base}/api/sensor/ingest`;
    axios.post(url, {
      deviceId: deviceId.trim(),
      latitude,
      longitude
    }, { timeout: 10000 })
      .then(() => {
        setLastSent(new Date());
        setLastError(null);
        setLastCoords({ lat: latitude, lon: longitude });
      })
      .catch((err) => {
        setLastError(err.response?.data?.message || err.message || 'Request failed');
      });
  };

  const startSending = () => {
    if (!deviceId.trim()) {
      setLastError('Enter a Device ID first (create a room in Devices and set its Device ID).');
      return;
    }
    setLastError(null);
    setSending(true);

    const onPosition = (pos) => {
      const { latitude, longitude } = pos.coords;
      sendReading(latitude, longitude);
    };

    const onError = (err) => {
      setLastError('GPS: ' + (err.message || 'Unavailable. Allow location access.'));
    };

    if (!navigator.geolocation) {
      setLastError('Geolocation is not supported by this browser.');
      setSending(false);
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(onPosition, onError, {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 10000
    });

    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendReading(pos.coords.latitude, pos.coords.longitude),
        (e) => setLastError('GPS: ' + (e.message || 'Unavailable'))
      );
    }, SEND_INTERVAL_MS);
  };

  const stopSending = () => {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSending(false);
  };

  useEffect(() => {
    return () => {
      stopSending();
    };
  }, []);

  const connectionUrl = deviceId.trim()
    ? `${window.location.origin}${window.location.pathname}?deviceId=${encodeURIComponent(deviceId.trim())}`
    : '';

  const qs = new URLSearchParams(window.location.search);
  const presetDeviceId = qs.get('deviceId') || '';

  useEffect(() => {
    if (presetDeviceId && !deviceId) setDeviceId(presetDeviceId);
  }, [presetDeviceId]);

  return (
    <div className="connect-device-page">
      <h1 className="connect-device-title">Connect Device (LAN / 4G)</h1>
      <p className="connect-device-subtitle">
        Use your phone as a sensor: send GPS (and optional sensor data) to the dashboard in real time.
      </p>

      <div className="connect-device-card">
        <h2 className="connect-device-card-title">1. Set Device ID</h2>
        <p className="connect-device-hint">
          Create a room in <strong>Devices</strong>, set its <strong>Device ID</strong>, then enter the same ID here.
        </p>
        {isAdmin && rooms.length > 0 && (
          <div className="connect-device-rooms">
            <label>Or pick a room:</label>
            <select
              value={rooms.find((r) => r.deviceId === deviceId) ? deviceId : ''}
              onChange={(e) => setDeviceId(e.target.value)}
            >
              <option value="">-- Select room --</option>
              {rooms.map((r) => (
                <option key={r._id} value={r.deviceId}>{r.name} ({r.deviceId})</option>
              ))}
            </select>
          </div>
        )}
        <div className="connect-device-field">
          <label>Device ID *</label>
          <input
            type="text"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            placeholder="e.g. phone-sensor-1"
          />
        </div>
        <div className="connect-device-field">
          <label>API base URL</label>
          <input
            type="text"
            value={apiBase}
            onChange={(e) => setApiBase(e.target.value)}
            placeholder="https://your-server.com"
          />
          <span className="connect-device-field-hint">Use your laptop’s public URL (e.g. ngrok) when testing from phone over 4G.</span>
        </div>
      </div>

      <div className="connect-device-card">
        <h2 className="connect-device-card-title">2. Send data</h2>
        <p className="connect-device-hint">On this device (e.g. phone), tap Start. GPS will be sent every 5 seconds.</p>
        <div className="connect-device-actions">
          {!sending ? (
            <button type="button" className="connect-device-btn start" onClick={startSending}>
              Start sending
            </button>
          ) : (
            <button type="button" className="connect-device-btn stop" onClick={stopSending}>
              Stop sending
            </button>
          )}
        </div>
        <div className="connect-device-status">
          {sending && <span className="status-badge sending">Sending every 5s</span>}
          {lastSent && <span className="status-time">Last sent: {lastSent.toLocaleTimeString()}</span>}
          {lastCoords && <span className="status-coords">Lat {lastCoords.lat.toFixed(5)}°, Lon {lastCoords.lon.toFixed(5)}°</span>}
          {lastError && <span className="status-error">{lastError}</span>}
        </div>
      </div>

      {connectionUrl && (
        <div className="connect-device-card">
          <h2 className="connect-device-card-title">Open on phone</h2>
          <p className="connect-device-hint">Open this link on your phone (same network or 4G if API is public):</p>
          <a href={connectionUrl} target="_blank" rel="noopener noreferrer" className="connect-device-link">
            {connectionUrl}
          </a>
        </div>
      )}
    </div>
  );
};

export default ConnectDevice;
