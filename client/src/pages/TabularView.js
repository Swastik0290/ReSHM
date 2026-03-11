import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRoom } from '../context/RoomContext';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';
import './TabularView.css';

const TabularView = () => {
  const { user } = useAuth();
  const { selectedRoomId } = useRoom();
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, limit: 50, skip: 0 });
  const getTodayRange = () => {
    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      timeRange: 'today'
    };
  };

  const [filters, setFilters] = useState(getTodayRange);

  useEffect(() => {
    // If a room is already selected in the Dashboard context, use it directly.
    // Otherwise fall back to fetching the first available room.
    if (selectedRoomId) {
      setRoomId(selectedRoomId);
    } else {
      fetchRooms();
    }
  }, [user, selectedRoomId]);

  useEffect(() => {
    if (roomId) {
      fetchReadings();
    }
  }, [roomId, filters.startDate, filters.endDate, pagination.skip]);

  // Handle setting up Server-Sent Events (SSE) when a roomId is selected
  useEffect(() => {
    if (!roomId) return;

    const eventSource = new EventSource(`/api/sensor/stream/${roomId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'connected') return;

        // Add new reading to table (unshifting so it appears at top)
        setReadings((prevReadings) => {
          // We only want to prepend if we are looking at page 1 so user view doesn't arbitrarily change otherwise
          if (pagination.skip !== 0) return prevReadings;

          // Verify it matches active time range (e.g. today)
          const readDate = new Date(data.timestamp);
          const filterStart = new Date(filters.startDate + 'T00:00:00');
          const filterEnd = new Date(filters.endDate + 'T23:59:59');

          if (readDate >= filterStart && readDate <= filterEnd) {
            const newArray = [data, ...prevReadings];
            return newArray.slice(0, pagination.limit); // limit displayed according to user settings
          }

          return prevReadings;
        });

      } catch (err) {
        console.error('Failed to parse SSE event data', err);
      }
    };

    return () => eventSource.close();
  }, [roomId, filters.startDate, filters.endDate, pagination]);

  const fetchRooms = async () => {
    try {
      const roomsResponse = await axios.get('/api/rooms');
      if (roomsResponse.data.length > 0) {
        const room = user.role === 'admin'
          ? roomsResponse.data[0]
          : roomsResponse.data.find(r => r._id === user.assignedRoom) || roomsResponse.data[0];
        setRoomId(room?._id);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchReadings = async () => {
    setLoading(true);
    try {
      const params = {
        limit: pagination.limit,
        skip: pagination.skip
      };

      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await axios.get(`/api/sensor/readings/${roomId}`, { params });
      setReadings(response.data.readings);
      setPagination(prev => ({ ...prev, total: response.data.pagination.total }));
    } catch (error) {
      console.error('Error fetching readings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRange = (range) => {
    const today = new Date();
    const startDate = new Date(today);
    const endDate = new Date(today);

    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        startDate.setDate(today.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(today.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last7days':
        startDate.setDate(today.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'last30days':
        startDate.setDate(today.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'lastmonth':
        startDate.setMonth(today.getMonth() - 1);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(today.getMonth());
        endDate.setDate(0);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        return;
    }

    setFilters({
      ...filters,
      timeRange: range,
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10)
    });
    setPagination(prev => ({ ...prev, skip: 0 }));
  };

  const handleExport = (format) => {
    if (readings.length === 0) return;
    const data = readings.map(reading => ({
      Timestamp: new Date(reading.timestamp).toLocaleString('en-IN'),
      'Lat (°)': reading.location?.latitude ?? '',
      'Lon (°)': reading.location?.longitude ?? '',
      'Altitude (m)': reading.altitude != null ? Number(reading.altitude.toFixed(1)) : '',
      'Temp (°C)': Number((reading.temperature ?? 0).toFixed(1)),
      'Hum (%)': Number((reading.humidity ?? 0).toFixed(0)),
      'CO S1 (ppm)': Number((reading.coSensor1 ?? 0).toFixed(2)),
      'CO S2 (ppm)': Number((reading.coSensor2 ?? 0).toFixed(2)),
      'CO₂ (ppm)': Number((reading.co2 ?? 0).toFixed(0)),
      'SpO2 (%)': Number((reading.oxygen ?? 0).toFixed(0)),
      'Pulse (bpm)': Number((reading.pulse ?? 0).toFixed(0)),
      'Smoke Detected': reading.smokeDetected ? 'Yes' : 'No',
      'Fire Detected': reading.fireDetected ? 'Yes' : 'No',
      Source: reading.source || 'Unknown',
      Alerts: (reading.alerts || []).join('; ')
    }));

    if (format === 'csv') {
      const csv = [
        Object.keys(data[0]).join(','),
        ...data.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sensor-readings-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } else if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sensor Readings');
      XLSX.writeFile(wb, `sensor-readings-${new Date().toISOString().split('T')[0]}.xlsx`);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="tabular-view">
      <h1 className="page-title">View All Readings</h1>

      <div className="filters-section">
        <div className="time-range-buttons">
          <button
            className={filters.timeRange === 'today' ? 'active' : ''}
            onClick={() => handleTimeRange('today')}
          >
            Today
          </button>
          <button
            className={filters.timeRange === 'yesterday' ? 'active' : ''}
            onClick={() => handleTimeRange('yesterday')}
          >
            Yesterday
          </button>
          <button
            className={filters.timeRange === 'last7days' ? 'active' : ''}
            onClick={() => handleTimeRange('last7days')}
          >
            Last 7 days
          </button>
          <button
            className={filters.timeRange === 'last30days' ? 'active' : ''}
            onClick={() => handleTimeRange('last30days')}
          >
            Last 30 days
          </button>
          <button
            className={filters.timeRange === 'lastmonth' ? 'active' : ''}
            onClick={() => handleTimeRange('lastmonth')}
          >
            Last month
          </button>
        </div>

        <div className="date-filters">
          <span className="date-filter-label">Custom:</span>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value, timeRange: 'custom' })}
            className="date-input"
            title="Start date"
          />
          <span className="date-separator">to</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value, timeRange: 'custom' })}
            className="date-input"
            title="End date"
          />
        </div>

        <div className="action-buttons">
          <button type="button" className="refresh-btn" onClick={() => roomId && fetchReadings()} disabled={!roomId || loading}>
            <FiRefreshCw /> Refresh
          </button>
          <button className="export-btn" onClick={() => handleExport('csv')}>
            <FiDownload /> Export CSV
          </button>
          <button className="export-btn" onClick={() => handleExport('excel')}>
            <FiDownload /> Export Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading readings...</div>
      ) : (
        <>
          <div className="table-container">
            <table className="readings-table-full">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Lat</th>
                  <th>Lon</th>
                  <th>Altitude</th>
                  <th>Temp</th>
                  <th>Hum</th>
                  <th>CO S1</th>
                  <th>CO S2</th>
                  <th>CO₂</th>
                  <th>SpO2</th>
                  <th>Pulse</th>
                  <th>Smoke</th>
                  <th>Fire</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {readings.length === 0 ? (
                  <tr>
                    <td colSpan="14" className="no-data">No readings available</td>
                  </tr>
                ) : (
                  readings.map((reading) => (
                    <tr key={reading._id}>
                      <td>{formatTime(reading.timestamp)}</td>
                      <td>{reading.location?.latitude?.toFixed(1) ?? '—'}°</td>
                      <td>{reading.location?.longitude?.toFixed(1) ?? '—'}°</td>
                      <td>{reading.altitude != null ? `${reading.altitude.toFixed(1)} m` : '—'}</td>
                      <td>{(reading.temperature ?? 0).toFixed(1)}°C</td>
                      <td>{(reading.humidity ?? 0).toFixed(0)}%</td>
                      <td>{(reading.coSensor1 ?? 0).toFixed(2)} ppm</td>
                      <td>{(reading.coSensor2 ?? 0).toFixed(2)} ppm</td>
                      <td>{(reading.co2 ?? 0).toFixed(0)} ppm</td>
                      <td>{(reading.oxygen ?? 0).toFixed(0)}%</td>
                      <td>{(reading.pulse ?? 0).toFixed(0)} bpm</td>
                      <td>{reading.smokeDetected ? '🔴 Yes' : '✅ No'}</td>
                      <td>{reading.fireDetected ? '🔴 Yes' : '✅ No'}</td>
                      <td>{reading.source || 'Unknown'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <div className="pagination-info">
              <span>
                {pagination.skip + 1}-{Math.min(pagination.skip + pagination.limit, pagination.total)} of {pagination.total}
              </span>
              <select
                value={pagination.limit}
                onChange={(e) => setPagination({ ...pagination, limit: parseInt(e.target.value), skip: 0 })}
                className="limit-select"
              >
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
                <option value="200">200 per page</option>
              </select>
            </div>
            <div className="pagination-buttons">
              <button
                onClick={() => setPagination({ ...pagination, skip: 0 })}
                disabled={pagination.skip === 0}
                className="page-btn"
              >
                ««
              </button>
              <button
                onClick={() => setPagination({ ...pagination, skip: Math.max(0, pagination.skip - pagination.limit) })}
                disabled={pagination.skip === 0}
                className="page-btn"
              >
                &lt; Back
              </button>
              {Array.from({ length: Math.min(5, Math.ceil(pagination.total / pagination.limit)) }, (_, i) => {
                const page = i + 1;
                const skip = (page - 1) * pagination.limit;
                return (
                  <button
                    key={page}
                    onClick={() => setPagination({ ...pagination, skip })}
                    className={`page-btn ${pagination.skip === skip ? 'active' : ''}`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setPagination({ ...pagination, skip: Math.min(pagination.total - pagination.limit, pagination.skip + pagination.limit) })}
                disabled={pagination.skip + pagination.limit >= pagination.total}
                className="page-btn"
              >
                Next &gt;
              </button>
              <button
                onClick={() => setPagination({ ...pagination, skip: Math.floor((pagination.total - 1) / pagination.limit) * pagination.limit })}
                disabled={pagination.skip + pagination.limit >= pagination.total}
                className="page-btn"
              >
                »»
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TabularView;
