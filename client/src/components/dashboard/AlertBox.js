import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import './DashboardCard.css';

const AlertBox = ({ alerts = [] }) => {
  const hasAlerts = alerts && alerts.length > 0;

  return (
    <div className={`dashboard-card alert-box ${hasAlerts ? 'has-alerts' : ''}`}>
      <div className="alert-header">
        <FiAlertTriangle className="alert-icon" />
        <h3 className="card-title">Alert !!!</h3>
      </div>
      <div className="alert-content">
        {hasAlerts ? (
          <ul className="alert-list">
            {alerts.map((alert, i) => (
              <li key={i} className={alert.includes('CRITICAL') ? 'alert-message critical' : 'alert-message warning'}>
                {alert.includes('CRITICAL') && <span className="alert-triangle">▲</span>}
                {alert}
              </li>
            ))}
          </ul>
        ) : (
          <div className="alert-message normal">All systems normal</div>
        )}
      </div>
    </div>
  );
};

export default AlertBox;
