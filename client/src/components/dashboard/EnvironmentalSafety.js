import React from 'react';
import {
  FiWind, FiCloud, FiAlertCircle, FiShield, FiCheckCircle,
  FiAlertTriangle, FiXCircle, FiActivity, FiNavigation
} from 'react-icons/fi';
import { FaFire } from 'react-icons/fa';
import './EnvironmentalSafety.css';

/* ──────────────────────────────────────────────────────────
   Threshold config
────────────────────────────────────────────────────────── */
const CO_WARN = 30; const CO_CRIT = 50; const CO_MAX = 100;
const CO2_WARN = 800; const CO2_CRIT = 1000; const CO2_MAX = 2000;
// Altitude: values above 3500 m risk altitude sickness (general guideline)
const ALT_WARN = 2500; const ALT_CRIT = 3500; const ALT_MAX = 5000;

/* ──────────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────────── */
const getCoStatus = (v) => {
  if (v == null || isNaN(v)) return { level: 'unknown', label: 'NO DATA', display: '—' };
  if (v >= CO_CRIT) return { level: 'danger', label: 'DANGER', display: `${Number(v).toFixed(2)} ppm` };
  if (v >= CO_WARN) return { level: 'warning', label: 'WARNING', display: `${Number(v).toFixed(2)} ppm` };
  return { level: 'safe', label: 'SAFE', display: `${Number(v).toFixed(2)} ppm` };
};

const getCo2Status = (v) => {
  if (v == null || isNaN(v)) return { level: 'unknown', label: 'NO DATA', display: '—' };
  if (v >= CO2_CRIT) return { level: 'danger', label: 'DANGER', display: `${Number(v).toFixed(0)} ppm` };
  if (v >= CO2_WARN) return { level: 'warning', label: 'WARNING', display: `${Number(v).toFixed(0)} ppm` };
  return { level: 'safe', label: 'SAFE', display: `${Number(v).toFixed(0)} ppm` };
};

const getAltitudeStatus = (v) => {
  if (v == null || isNaN(v)) return { level: 'unknown', label: 'NO DATA', display: '—' };
  if (v >= ALT_CRIT) return { level: 'danger', label: 'HIGH ALT', display: `${Number(v).toFixed(1)} m` };
  if (v >= ALT_WARN) return { level: 'warning', label: 'ELEVATED', display: `${Number(v).toFixed(1)} m` };
  return { level: 'safe', label: 'NORMAL', display: `${Number(v).toFixed(1)} m` };
};

const clampPct = (v, max) => Math.min(100, Math.max(0, (v / max) * 100));

const LEVEL_COLORS = {
  safe: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  unknown: '#9ca3af',
};

const LEVEL_ICONS = {
  safe: <FiCheckCircle />,
  warning: <FiAlertTriangle />,
  danger: <FiXCircle />,
  unknown: <FiActivity />,
};

/* ──────────────────────────────────────────────────────────
   Sub-components
────────────────────────────────────────────────────────── */

/** Horizontal bar indicator */
const BarIndicator = ({ pct, level }) => (
  <div className="env-bar-track">
    <div
      className={`env-bar-fill env-bar-${level}`}
      style={{ width: `${pct}%` }}
    />
    {/* threshold markers */}
    <span className="env-bar-mark env-bar-mark-warn" title="Warning threshold" />
    <span className="env-bar-mark env-bar-mark-crit" title="Critical threshold" />
  </div>
);

/** Generic indicator card */
const IndicatorCard = ({ icon, title, subtitle, level, statusLabel, value, barPct, noData }) => (
  <div className={`env-indicator-card env-level-${level}`}>
    <div className="env-card-header">
      <div className="env-card-icon-wrap">{icon}</div>
      <div className="env-card-labels">
        <div className="env-card-title">{title}</div>
        <div className="env-card-subtitle">{subtitle}</div>
      </div>
      <div className={`env-level-chip env-chip-${level}`}>
        {level === 'danger' && <span className="env-chip-pulse" />}
        {LEVEL_ICONS[level]}
        {statusLabel}
      </div>
    </div>

    <div className="env-card-value">{value}</div>

    {!noData && barPct != null && (
      <BarIndicator pct={barPct} level={level} />
    )}
  </div>
);

/** Binary card (Generic) */
const BinaryCard = ({ icon, title, detected, noData, activeText, inactiveText }) => {
  const level = noData ? 'unknown' : detected ? 'danger' : 'safe';
  const label = noData ? 'NO DATA' : detected ? 'DETECTED' : 'CLEAR';
  const value = noData ? '—' : detected ? activeText : inactiveText;

  return (
    <div className={`env-indicator-card env-level-${level}`}>
      <div className="env-card-header">
        <div className="env-card-icon-wrap">{icon}</div>
        <div className="env-card-labels">
          <div className="env-card-title">{title}</div>
          <div className="env-card-subtitle">Binary sensor</div>
        </div>
        <div className={`env-level-chip env-chip-${level}`}>
          {level === 'danger' && <span className="env-chip-pulse" />}
          {LEVEL_ICONS[level]}
          {label}
        </div>
      </div>

      <div className="env-card-value">{value}</div>

      {!noData && (
        <div className="env-bar-track">
          <div
            className={`env-bar-fill env-bar-${level}`}
            style={{ width: detected ? '100%' : '0%' }}
          />
        </div>
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────
   Main Component
────────────────────────────────────────────────────────── */
const EnvironmentalSafety = ({ coSensor1, coSensor2, co2, smokeDetected, fireDetected, altitude, hasData }) => {
  const noData = !hasData;

  const co1 = getCoStatus(noData ? null : coSensor1);
  const co2s = getCoStatus(noData ? null : coSensor2);
  const co2v = getCo2Status(noData ? null : co2);

  const altv = getAltitudeStatus(altitude);
  const altPct = (noData || altitude == null) ? 0 : clampPct(altitude, ALT_MAX);

  const co1Pct = noData ? 0 : clampPct(coSensor1, CO_MAX);
  const co2sPct = noData ? 0 : clampPct(coSensor2, CO_MAX);
  const co2Pct = noData ? 0 : clampPct(co2, CO2_MAX);

  return (
    <div className="env-safety-panel">
      {/* Header */}
      <div className="env-panel-header">
        <FiShield className="env-panel-header-icon" />
        <div className="env-panel-header-text">
          <h2 className="env-panel-title">Room Stats</h2>
          <p className="env-panel-subtitle">Real-time localized metrics</p>
        </div>
        <div className="env-live-pill">
          <span className="env-live-dot" />
          LIVE
        </div>
      </div>

      {/* Cards */}
      <div className="env-cards-grid">
        <IndicatorCard
          icon={<FiWind />}
          title="Carbon Monoxide"
          subtitle="CO Sensor 1"
          level={co1.level}
          statusLabel={co1.label}
          value={co1.display}
          barPct={co1Pct}
          noData={noData}
        />
        <IndicatorCard
          icon={<FiWind />}
          title="Carbon Monoxide"
          subtitle="CO Sensor 2"
          level={co2s.level}
          statusLabel={co2s.label}
          value={co2s.display}
          barPct={co2sPct}
          noData={noData}
        />
        <IndicatorCard
          icon={<FiCloud />}
          title="Carbon Dioxide"
          subtitle="CO₂ Level"
          level={co2v.level}
          statusLabel={co2v.label}
          value={co2v.display}
          barPct={co2Pct}
          noData={noData}
        />
        <BinaryCard
          icon={<FiAlertCircle />}
          title="Smoke Detection"
          detected={smokeDetected}
          noData={noData}
          activeText="Smoke Present"
          inactiveText="No Smoke"
        />
        <BinaryCard
          icon={<FaFire />}
          title="Fire Detection"
          detected={fireDetected}
          noData={noData}
          activeText="Fire Detected"
          inactiveText="No Fire"
        />
        <IndicatorCard
          icon={<FiNavigation />}
          title="Altitude"
          subtitle="Metres above sea level"
          level={altv.level}
          statusLabel={altv.label}
          value={altv.display}
          barPct={altPct}
          noData={altitude == null ? true : noData}
        />
      </div>

      {/* Legend */}
      <div className="env-legend">
        <span className="env-legend-item env-legend-safe">Safe</span>
        <span className="env-legend-item env-legend-warning">Warning</span>
        <span className="env-legend-item env-legend-danger">Danger</span>
        <span className="env-legend-right">CO: warn 30 · crit 50 ppm &nbsp;|&nbsp; CO₂: warn 800 · crit 1000 ppm &nbsp;|&nbsp; Alt: warn 2500 · crit 3500 m</span>
      </div>
    </div>
  );
};

export default EnvironmentalSafety;
