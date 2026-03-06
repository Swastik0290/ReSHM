import React from 'react';
import { FiCloud, FiAlertCircle } from 'react-icons/fi';
import './DashboardCard.css';

const AirQualityBox = ({ coSensor1, coSensor2, smokeDetected, co2 }) => {
  const getStatus = (value, thresholds) => {
    if (value >= thresholds.critical) return { label: 'CRITICAL', color: '#ef4444' };
    if (value >= thresholds.warning) return { label: 'ELEVATED', color: '#f59e0b' };
    return { label: 'NORMAL', color: '#10b981' };
  };

  const co1Status = getStatus(coSensor1, { critical: 50, warning: 30 });
  const co2Status = getStatus(coSensor2, { critical: 50, warning: 30 });
  const co2LevelStatus = getStatus(co2, { critical: 1000, warning: 800 });
  const smokeStatus = smokeDetected 
    ? { label: 'DETECTED', badgeClass: 'critical' }
    : { label: 'Clear', badgeClass: 'normal' };

  const StatusBadge = ({ label, status }) => (
    <span className={`status-badge ${status === 'CRITICAL' ? 'critical' : status === 'ELEVATED' ? 'elevated' : 'normal'}`}>
      {label}
    </span>
  );

  return (
    <div className="dashboard-card air-quality">
      <h3 className="card-title">Air Quality</h3>
      <div className="air-quality-content">
        <div className="air-quality-item">
          <div className="air-quality-header">
            <FiCloud className="air-quality-icon" />
            <span className="air-quality-label">CO Sensor 2</span>
          </div>
          <div className="air-quality-value">
            {coSensor2?.toFixed(0)} ppm <StatusBadge label={co2Status.label} status={co2Status.label} />
          </div>
        </div>
        
        <div className="air-quality-item">
          <div className="air-quality-header">
            <FiCloud className="air-quality-icon" />
            <span className="air-quality-label">CO Sensor 1</span>
          </div>
          <div className="air-quality-value">
            {coSensor1?.toFixed(0)} ppm <StatusBadge label={co1Status.label} status={co1Status.label} />
          </div>
        </div>
        
        <div className="air-quality-item">
          <div className="air-quality-header">
            <FiAlertCircle className="air-quality-icon" />
            <span className="air-quality-label">Smoke Status</span>
          </div>
          <div className="air-quality-value">
            {smokeStatus.label} <span className={`status-badge ${smokeStatus.badgeClass}`}>{smokeStatus.label === 'Clear' ? 'NORMAL' : 'CRITICAL'}</span>
          </div>
        </div>
        
        <div className="air-quality-item">
          <div className="air-quality-header">
            <FiCloud className="air-quality-icon" />
            <span className="air-quality-label">Carbon Dioxide</span>
          </div>
          <div className="air-quality-value">
            {co2?.toFixed(0)} ppm <StatusBadge label={co2LevelStatus.label} status={co2LevelStatus.label} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AirQualityBox;
