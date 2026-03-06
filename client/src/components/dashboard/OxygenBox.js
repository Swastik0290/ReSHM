import React from 'react';
import { FiHeart } from 'react-icons/fi';
import './DashboardCard.css';

const OxygenBox = ({ oxygen }) => {
  return (
    <div className="dashboard-card oxygen-box">
      <div className="oxygen-header">
        <FiHeart className="oxygen-icon" />
        <h3 className="card-title">SpO2</h3>
      </div>
      <div className="oxygen-content">
        <div className="oxygen-value">{oxygen != null ? `${Number(oxygen).toFixed(0)}%` : '—'}</div>
        <div className="oxygen-label">Room Oxygen Saturation</div>
      </div>
    </div>
  );
};

export default OxygenBox;
