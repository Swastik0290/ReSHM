import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
import axios from 'axios';
import { useRoom } from '../context/RoomContext';
import EnvironmentalOverview from '../components/dashboard/EnvironmentalOverview';
import AlertBox from '../components/dashboard/AlertBox';
import AirQualityBox from '../components/dashboard/AirQualityBox';
import OxygenBox from '../components/dashboard/OxygenBox';
import TimeBox from '../components/dashboard/TimeBox';
import QuickReadings from '../components/dashboard/QuickReadings';
import CurrentLocation from '../components/dashboard/CurrentLocation';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { state: navState } = useLocation();
  const settings = useSettings();
  const { setSelectedRoomId } = useRoom();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomId, setRoomId] = useState(navState?.roomId || null);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    fetchRoomsAndData();
  }, [user]);


  useEffect(() => {
    if (!roomId) return;
    const ms = (settings.refreshInterval || 30) * 1000;
    const interval = setInterval(() => fetchDashboardData(roomId), ms);
    return () => clearInterval(interval);
  }, [roomId, settings.refreshInterval]);

  const fetchRoomsAndData = async () => {
    try {
      const roomsResponse = await axios.get('/api/rooms');
      const roomList = Array.isArray(roomsResponse.data) ? roomsResponse.data : [];
      setRooms(roomList);
      if (roomList.length > 0) {
        const preferredId = user.role === 'admin' && navState?.roomId ? navState.roomId : null;
        const room = user.role === 'admin'
          ? (roomList.find(r => r._id === (preferredId || roomId)) || roomList[0])
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
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  if (error && !dashboardData) {
    return <div className="dashboard-error">{error}</div>;
  }

  if (rooms.length === 0) {
    return (
      <div className="dashboard-empty">
        <p>No devices yet. Add a device from <strong>Add Device</strong> to start viewing data.</p>
      </div>
    );
  }

  const latest = dashboardData?.latest;
  const trends = dashboardData?.trends || [];
  const hasReadings = !!latest;

  const safeNum = (v, def = 0) => (v != null ? Number(v) : def);
  const safeLoc = (loc) => (loc && typeof loc === 'object' ? loc : { latitude: 0, longitude: 0 });

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
      {user?.role === 'admin' && rooms.length > 1 && (
        <div className="dashboard-room-select">
          <label htmlFor="room-select">Device / Room:</label>
          <select id="room-select" value={roomId || ''} onChange={onRoomChange}>
            {rooms.map((r) => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
        </div>
      )}
      <div className="bento-grid">
        <EnvironmentalOverview
          temperature={hasReadings ? latest.temperature : null}
          humidity={hasReadings ? latest.humidity : null}
          trends={trends}
          roomId={roomId}
        />

        <AlertBox alerts={hasReadings && latest.alerts ? latest.alerts : []} />

        <AirQualityBox
          coSensor1={safeNum(latest?.coSensor1)}
          coSensor2={safeNum(latest?.coSensor2)}
          smokeDetected={latest?.smokeDetected ?? false}
          co2={safeNum(latest?.co2)}
        />

        <OxygenBox oxygen={hasReadings ? latest.oxygen : null} />

        <TimeBox />

        <QuickReadings roomId={roomId} />

        <CurrentLocation
          latitude={safeLoc(latest?.location).latitude}
          longitude={safeLoc(latest?.location).longitude}
        />
      </div>
    </div>
  );
};

export default Dashboard;
