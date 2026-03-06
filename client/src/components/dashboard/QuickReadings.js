import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiArrowRight } from 'react-icons/fi';
import './DashboardCard.css';

const QuickReadings = ({ roomId }) => {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roomId) {
      fetchReadings();
      const interval = setInterval(fetchReadings, 30000);
      return () => clearInterval(interval);
    }
  }, [roomId]);

  const fetchReadings = async () => {
    try {
      const response = await axios.get(`/api/sensor/readings/${roomId}?limit=6`);
      setReadings(response.data.readings);
    } catch (error) {
      console.error('Error fetching readings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="dashboard-card quick-readings">
        <h3 className="card-title">Recent Readings</h3>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-card quick-readings">
      <div className="readings-header">
        <h3 className="card-title">Recent Readings</h3>
        <Link to="/tabular-view" className="view-more-link">
          View More <FiArrowRight />
        </Link>
      </div>
      <div className="readings-table-container">
        <table className="readings-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Lat</th>
              <th>Lon</th>
              <th>Temp</th>
              <th>Hum</th>
              <th>CO S1</th>
              <th>CO S2</th>
              <th>CO2</th>
              <th>SpO2</th>
            </tr>
          </thead>
          <tbody>
            {readings.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">No readings available</td>
              </tr>
            ) : (
              readings.map((reading) => (
                <tr key={reading._id}>
                  <td>{formatTime(reading.timestamp)}</td>
                  <td>{reading.location.latitude.toFixed(1)}°</td>
                  <td>{reading.location.longitude.toFixed(1)}°</td>
                  <td>{reading.temperature.toFixed(1)}°C</td>
                  <td>{reading.humidity.toFixed(0)}%</td>
                  <td>{reading.coSensor1.toFixed(0)} ppm</td>
                  <td>{reading.coSensor2.toFixed(0)} ppm</td>
                  <td>{reading.co2.toFixed(0)} ppm</td>
                  <td>{reading.oxygen.toFixed(0)}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuickReadings;
