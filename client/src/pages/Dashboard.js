import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
import axios from 'axios';
import { useRoom } from '../context/RoomContext';
import { FiAlertOctagon, FiBell, FiCheck, FiX } from 'react-icons/fi';
import EnvironmentalSafety from '../components/dashboard/EnvironmentalSafety';
import HealthMonitoring from '../components/dashboard/HealthMonitoring';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { state: navState } = useLocation();
  const settings = useSettings();
  const { selectedRoomId, setSelectedRoomId } = useRoom();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomId, setRoomId] = useState(navState?.roomId || null);
  const [rooms, setRooms] = useState([]);
  const [sosActive, setSosActive] = useState(false);
  const [sosConfirmed, setSosConfirmed] = useState(false);
  const [alertRooms, setAlertRooms] = useState([]);

  const sendSosAlert = async () => {
    setSosConfirmed(true);
    setSosActive(false);

    try {
      let emails = [];
      let senderEmail = '';
      let senderPassword = '';

      const stored = localStorage.getItem('reshm_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        emails = parsed.emergencyEmails || [];
        senderEmail = parsed.senderEmail || '';
        senderPassword = parsed.senderPassword || '';
      }

      if (emails.length === 0) {
        console.warn("No emergency emails configured in Settings. Only UI alert will show.");
        // Still returning since no recipients
        return;
      }

      await axios.post('/api/sos', {
        emails,
        senderEmail,
        senderPassword,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to trigger SOS email:', err);
    }
  };

  useEffect(() => {
    if (rooms.length === 0) {
      fetchRoomsAndData();
    } else if (selectedRoomId && selectedRoomId !== roomId) {
      setRoomId(selectedRoomId);
      fetchDashboardData(selectedRoomId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedRoomId]);

  // Handle setting up Server-Sent Events (SSE) when a roomId is selected
  useEffect(() => {
    if (!roomId) return;

    const eventSource = new EventSource(`/api/sensor/stream/${roomId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'connected') {
          console.log(`Connected to real-time stream for room ${roomId}`);
          return;
        }

        // It's a new reading. Update dashboardData if we have it or start fresh
        setDashboardData((prev) => {
          const prevTrends = prev?.trends || [];
          return {
            latest: data, // Replace latest with incoming reading
            trends: [data, ...prevTrends].slice(0, 100), // Push to start of trends, keep max 100
          };
        });

      } catch (err) {
        console.error('Failed to parse SSE event data', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
    };

    // Cleanup when roomId changes or component unmounts
    return () => {
      eventSource.close();
    };
  }, [roomId]);

  // Removed old polling interval (setInterval) from here

  const fetchRoomsAndData = async () => {
    try {
      const roomsResponse = await axios.get('/api/rooms');
      const roomList = Array.isArray(roomsResponse.data) ? roomsResponse.data : [];
      setRooms(roomList);
      if (roomList.length > 0) {
        const preferredId = user.role === 'admin' && navState?.roomId ? navState.roomId : null;
        const currentTargetId = selectedRoomId || preferredId || roomId;
        const room = user.role === 'admin'
          ? (roomList.find(r => r._id === currentTargetId) || roomList[0])
          : roomList.find(r => r._id === user.assignedRoom) || roomList[0];
        if (room) {
          setRoomId(room._id);
          setSelectedRoomId(room._id);
          await fetchDashboardData(room._id);
        }
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async (id = roomId) => {
    if (!id) return;
    try {
      const response = await axios.get(`/api/sensor/dashboard/${id}`);
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load sensor data');
    } finally {
      setLoading(false);
    }
  };

  const checkAllRoomsForAlerts = async (roomList) => {
    try {
      const promises = roomList.map(r => 
        axios.get(`/api/sensor/latest/${r._id}`)
             .then(res => ({ id: r._id, name: r.name, hasAlert: res.data?.alerts?.length > 0 }))
             .catch(() => ({ id: r._id, name: r.name, hasAlert: false }))
      );
      const results = await Promise.all(promises);
      const alerted = results.filter(res => res.hasAlert).map(res => ({ id: res.id, name: res.name }));
      setAlertRooms(alerted);
    } catch (err) {
      console.error('Error checking alerts for all rooms', err);
    }
  };

  useEffect(() => {
    let interval;
    if (rooms.length > 0) {
      checkAllRoomsForAlerts(rooms);
      interval = setInterval(() => {
        checkAllRoomsForAlerts(rooms);
      }, 3000); // Poll every 3 seconds for minimum latency
    }
    return () => clearInterval(interval);
  }, [rooms]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loading-spinner" />
        Loading dashboard...
      </div>
    );
  }

  if (error && !dashboardData) {
    return <div className="dashboard-error">{error}</div>;
  }

  // Handle case where we have rooms but latest reading might be null
  const latest = dashboardData?.latest;
  const hasReadings = !!latest;
  const safeNum = (v, def = 0) => (v != null ? Number(v) : def);

  const onRoomChange = (e) => {
    const id = e.target.value;
    if (id) {
      setRoomId(id);
      setSelectedRoomId(id);
      fetchDashboardData(id);
    }
  };

  return (
    <div className="dashboard">
      {/* ── SOS Top Bar ───────────────────────────────────── */}
      <div className="dashboard-sos-bar">
        <div className="dashboard-sos-info">
          <FiBell className="sos-label-icon" />
          <span className="dashboard-sos-label">Emergency Response</span>
        </div>
        <button
          className={`sos-btn ${sosConfirmed ? 'sos-btn-active' : ''}`}
          onClick={() => {
            if (!sosConfirmed) {
              setSosActive(true);
            } else {
              setSosConfirmed(false);
              setSosActive(false);
            }
          }}
        >
          <span className="sos-btn-ring" />
          <FiAlertOctagon className="sos-btn-icon" />
          {sosConfirmed ? 'CANCEL SOS' : 'SOS'}
        </button>
      </div>



      {/* ── SOS Confirmation Modal ─────────────────────── */}
      {sosActive && !sosConfirmed && (
        <div className="sos-modal-overlay" onClick={() => setSosActive(false)}>
          <div className="sos-modal" onClick={e => e.stopPropagation()}>
            <div className="sos-modal-icon-wrap">
              <FiAlertOctagon className="sos-modal-svg-icon" />
            </div>
            <h2 className="sos-modal-title">Send SOS Alert?</h2>
            <p className="sos-modal-text">
              This will immediately notify emergency contacts and authorities.
              Are you sure you want to proceed?
            </p>
            <div className="sos-modal-actions">
              <button className="sos-cancel-btn" onClick={() => setSosActive(false)}>
                <FiX /> Cancel
              </button>
              <button
                className="sos-confirm-btn"
                onClick={sendSosAlert}
              >
                <FiAlertOctagon /> SEND SOS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SOS Active Alert Banner ────────────────────── */}
      {sosConfirmed && (
        <div className="sos-active-banner">
          <FiAlertOctagon className="sos-banner-icon" />
          <strong>SOS ALERT ACTIVE</strong> — Emergency services have been notified.
          <button className="sos-dismiss-btn" onClick={() => setSosConfirmed(false)}>
            <FiCheck /> Dismiss
          </button>
        </div>
      )}

      {/* ── Settings Bar (Room Select / Source) ────────────── */}
      <div className="dashboard-settings-bar">
        {user?.role === 'admin' && rooms.length > 1 ? (
          <div className="dashboard-room-select">
            <label htmlFor="room-select">Device / Room:</label>
            <select id="room-select" value={roomId || ''} onChange={onRoomChange}>
              {rooms.map((r) => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="dashboard-room-select-placeholder" />
        )}

        <div className={`dashboard-alert-container ${alertRooms.length === 0 ? 'no-alerts' : 'has-alerts'}`}>
          {alertRooms.length > 0 ? (
            <>
              <FiAlertOctagon className="alert-indicator-icon" />
              <div className="alert-room-list">
                 {alertRooms.map((a) => (
                   <span 
                     key={a.id} 
                     className="alert-room-chip" 
                     onClick={() => onRoomChange({ target: { value: a.id } })}
                     title="Click to view room"
                   >
                     {a.name}
                   </span>
                 ))}
              </div>
            </>
          ) : (
            <span className="no-alert-text">All Systems Clear — No Active Alerts</span>
          )}
        </div>

        <div className="dashboard-source-indicator">
          Data connection: <span className="source-badge">{latest?.source || 'Unknown'}</span>
        </div>
      </div>

      {/* ── Two-column monitoring layout ────────────────── */}
      <div className="dashboard-columns">
        {/* LEFT — Environmental Safety */}
        <div className="dashboard-col dashboard-col-left">
          <EnvironmentalSafety
            coSensor1={hasReadings ? safeNum(latest.coSensor1) : null}
            coSensor2={hasReadings ? safeNum(latest.coSensor2) : null}
            co2={hasReadings ? safeNum(latest.co2) : null}
            smokeDetected={latest?.smokeDetected ?? false}
            fireDetected={latest?.fireDetected ?? false}
            altitude={hasReadings && latest.altitude != null ? safeNum(latest.altitude) : null}
            hasData={hasReadings}
          />
        </div>

        {/* RIGHT — Health Monitoring */}
        <div className="dashboard-col dashboard-col-right">
          <HealthMonitoring
            spo2={hasReadings ? latest.oxygen : null}
            pulse={hasReadings ? latest.pulse : null}
            hasData={hasReadings}
            roomId={roomId}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
