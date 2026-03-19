import React, { useRef, useEffect, useState } from 'react';
import {
  FiWind, FiCloud, FiAlertCircle, FiShield, FiCheckCircle,
  FiAlertTriangle, FiXCircle, FiActivity,
  FiThermometer, FiDroplet
} from 'react-icons/fi';
import { FaFire } from 'react-icons/fa';
import './EnvironmentalSafety.css';

/* ──────────────────────────────────────────────────────────
   Threshold config
────────────────────────────────────────────────────────── */
const CO_WARN = 30; const CO_CRIT = 50;
const CO2_WARN = 800; const CO2_CRIT = 1000;
const HUM_WARN = 60; const HUM_CRIT = 80;

/* ──────────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────────── */
const getCoStatus = (v) => {
  if (v == null || isNaN(v)) return { level: 'unknown', label: 'NO DATA', display: '—' };
  if (v >= CO_CRIT) return { level: 'danger', label: 'DANGER', display: `${Number(v).toFixed(2)} ppm` };
  if (v >= CO_WARN) return { level: 'warning', label: 'WARNING', display: `${Number(v).toFixed(2)} ppm` };
  return { level: 'safe', label: 'NORMAL', display: `${Number(v).toFixed(2)} ppm` };
};

const getCo2Status = (v) => {
  if (v == null || isNaN(v)) return { level: 'unknown', label: 'NO DATA', display: '—' };
  if (v >= CO2_CRIT) return { level: 'danger', label: 'DANGER', display: `${Number(v).toFixed(0)} ppm` };
  if (v >= CO2_WARN) return { level: 'warning', label: 'WARNING', display: `${Number(v).toFixed(0)} ppm` };
  return { level: 'safe', label: 'NORMAL', display: `${Number(v).toFixed(0)} ppm` };
};

const getTempStatus = (v) => {
  if (v == null || isNaN(v)) return { level: 'unknown', label: 'NO DATA', display: '—' };
  return { level: 'safe', label: 'NORMAL', display: `${Number(v).toFixed(1)}°C` };
};

const getHumStatus = (v) => {
  if (v == null || isNaN(v)) return { level: 'unknown', label: 'NO DATA', display: '—' };
  if (v >= HUM_CRIT || v <= 20) return { level: 'danger', label: 'CRITICAL', display: `${Number(v).toFixed(1)}%` };
  if (v >= HUM_WARN || v <= 30) return { level: 'warning', label: 'WARNING', display: `${Number(v).toFixed(1)}%` };
  return { level: 'safe', label: 'NORMAL', display: `${Number(v).toFixed(1)}%` };
};

const LEVEL_ICONS = {
  safe: <FiCheckCircle />,
  warning: <FiAlertTriangle />,
  danger: <FiXCircle />,
  unknown: <FiActivity />,
};

/* ──────────────────────────────────────────────────────────
   Roll animation hook
────────────────────────────────────────────────────────── */
const useRollAnimation = (value) => {
  const [rolling, setRolling] = useState(false);
  const prevRef = useRef(undefined);
  useEffect(() => {
    if (prevRef.current !== undefined && prevRef.current !== value) {
      setRolling(false);
      const raf = requestAnimationFrame(() => setRolling(true));
      const timer = setTimeout(() => setRolling(false), 420);
      return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
    }
    prevRef.current = value;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return rolling;
};

const AnimatedValue = ({ value, className, spanClass }) => {
  const rolling = useRollAnimation(value);
  return (
    <div className={className}>
      <span className={`${spanClass}${rolling ? ' rolling' : ''}`}>{value}</span>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────
   Sub-components
────────────────────────────────────────────────────────── */

/** Combined CO Monitoring Card */
const CombinedCoCard = ({ co1, co2s }) => (
  <div className="env-indicator-card env-card-full-width env-combined-co-card">
    <div className="env-card-header">
      <div className="env-card-icon-wrap"><FiWind /></div>
      <div className="env-card-labels">
        <div className="env-card-title">CO Monitoring</div>
        <div className="env-card-subtitle">Dual Sensor Array</div>
      </div>
    </div>
    <div className="env-combined-sensors">
      <div className="env-combined-sensor">
        <div className="env-sensor-label">
          <span>Sensor 1</span>
          <div className={`env-level-chip env-chip-${co1.level}`}>
            {co1.level === 'danger' && <span className="env-chip-pulse" />}
            {LEVEL_ICONS[co1.level]} {co1.label}
          </div>
        </div>
        <AnimatedValue value={co1.display} className={`env-card-value text-${co1.level}`} spanClass="env-value-number" />
      </div>
      <div className="env-combined-sensor">
        <div className="env-sensor-label">
          <span>Sensor 2</span>
          <div className={`env-level-chip env-chip-${co2s.level}`}>
            {co2s.level === 'danger' && <span className="env-chip-pulse" />}
            {LEVEL_ICONS[co2s.level]} {co2s.label}
          </div>
        </div>
        <AnimatedValue value={co2s.display} className={`env-card-value text-${co2s.level}`} spanClass="env-value-number" />
      </div>
    </div>
  </div>
);

/** Generic indicator card */
const IndicatorCard = ({ icon, title, subtitle, level, statusLabel, value }) => (
  <div className="env-indicator-card">
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
    <AnimatedValue value={value} className={`env-card-value text-${level}`} spanClass="env-value-number" />
  </div>
);

/** Binary card (Generic) */
const BinaryCard = ({ icon, title, detected, noData, activeText, inactiveText, className = "" }) => {
  const level = noData ? 'unknown' : detected ? 'danger' : 'safe';
  const label = noData ? 'NO DATA' : detected ? 'DETECTED' : 'NORMAL';
  const value = noData ? '—' : detected ? activeText : inactiveText;

  return (
    <div className={`env-indicator-card ${className}`}>
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
      <AnimatedValue value={value} className={`env-card-value text-${level}`} spanClass="env-value-number" />
    </div>
  );
};

/* ──────────────────────────────────────────────────────────
   Main Component
────────────────────────────────────────────────────────── */
const EnvironmentalSafety = ({ coSensor1, coSensor2, co2, smokeDetected, fireDetected, temperature, humidity, hasData }) => {
  const noData = !hasData;

  const co1 = getCoStatus(noData ? null : coSensor1);
  const co2s = getCoStatus(noData ? null : coSensor2);
  const co2v = getCo2Status(noData ? null : co2);

  const tempv = getTempStatus(temperature);
  const humv = getHumStatus(humidity);

  return (
    <div className="env-safety-panel">
      {/* Header */}
      <div className="env-panel-header">
        <FiShield className="env-panel-header-icon" />
        <div className="env-panel-header-text">
          <h2 className="env-panel-title">Room Stats</h2>
          <p className="env-panel-subtitle">Environmental safety metrics</p>
        </div>
        <div className={`env-live-pill ${hasData ? 'env-pill-live' : 'env-pill-wait'}`}>
          <span className="env-live-dot" />
          {hasData ? 'LIVE' : 'WAIT'}
        </div>
      </div>

      {/* Cards */}
      <div className="env-cards-grid">
        <CombinedCoCard co1={co1} co2s={co2s} />
        
        <IndicatorCard
          icon={<FiCloud />}
          title="Carbon Dioxide"
          subtitle="CO₂ Level"
          level={co2v.level}
          statusLabel={co2v.label}
          value={co2v.display}
        />
        <IndicatorCard
          icon={<FiThermometer />}
          title="Temperature"
          subtitle="Ambient Room Temp"
          level={tempv.level}
          statusLabel={tempv.label}
          value={tempv.display}
        />
        <IndicatorCard
          icon={<FiDroplet />}
          title="Humidity"
          subtitle="Relative Humidity"
          level={humv.level}
          statusLabel={humv.label}
          value={humv.display}
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
      </div>
    </div>
  );
};

export default EnvironmentalSafety;
