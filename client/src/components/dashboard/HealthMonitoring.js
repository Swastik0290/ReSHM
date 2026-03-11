import React from 'react';
import { FiHeart, FiActivity, FiCheckCircle, FiAlertTriangle, FiXCircle } from 'react-icons/fi';
import './HealthMonitoring.css';

/* ──────────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────────── */
const getSpo2Status = (v) => {
    if (v == null || isNaN(v)) return { level: 'none', label: 'No Data' };
    if (v < 90) return { level: 'danger', label: 'CRITICAL LOW' };
    if (v < 95) return { level: 'warning', label: 'LOW' };
    return { level: 'safe', label: 'NORMAL' };
};

const getPulseStatus = (v) => {
    if (v == null || isNaN(v)) return { level: 'none', label: 'No Data' };
    if (v >= 120 || v <= 40) return { level: 'danger', label: 'CRITICAL' };
    if (v >= 100 || v <= 50) return { level: 'warning', label: 'ABNORMAL' };
    return { level: 'safe', label: 'NORMAL' };
};

const LEVEL_ICONS = {
    safe: <FiCheckCircle />,
    warning: <FiAlertTriangle />,
    danger: <FiXCircle />,
    none: <FiActivity />,
};

/* ──────────────────────────────────────────────────────────
   Arc gauge (SVG) — value rendered INSIDE the SVG so it
   can never overlap the arc stroke
────────────────────────────────────────────────────────── */
const ArcGauge = ({ value, level, hasValue }) => {
    const R = 52;
    const CX = 70;
    const CY = 68;          // circle center sits 68px from top
    const STROKE = 11;
    const FULL_ARC = 240;   // degrees swept (like a speedometer)
    const CIRCUMFERENCE = 2 * Math.PI * R;
    const arcLen = (FULL_ARC / 360) * CIRCUMFERENCE;

    // Range 0 – 100% (full SpO2 scale)
    const pct = hasValue
        ? Math.min(1, Math.max(0, value / 100))
        : 0;

    const colors = { safe: '#10b981', warning: '#f59e0b', danger: '#ef4444', none: '#9ca3af' };
    const color = colors[level] || colors.none;

    const startAngleDeg = 150;          // arc starts bottom-left
    const dashoffset = arcLen * (1 - pct);

    // Displayed value string
    const displayVal = hasValue ? Math.round(value).toString() : '—';
    const displayUnit = hasValue ? '%' : '';

    return (
        <svg
            viewBox="0 0 140 110"
            className="spo2-gauge-svg"
            aria-label={`SpO2: ${hasValue ? value + '%' : 'no data'}`}
        >
            {/* Track arc */}
            <circle
                cx={CX} cy={CY} r={R}
                fill="none"
                stroke="var(--border-color, #e5e7eb)"
                strokeWidth={STROKE}
                strokeDasharray={`${arcLen} ${CIRCUMFERENCE}`}
                strokeDashoffset={0}
                strokeLinecap="round"
                transform={`rotate(${startAngleDeg} ${CX} ${CY})`}
            />
            {/* Fill arc */}
            <circle
                cx={CX} cy={CY} r={R}
                fill="none"
                stroke={color}
                strokeWidth={STROKE}
                strokeDasharray={`${arcLen} ${CIRCUMFERENCE}`}
                strokeDashoffset={dashoffset}
                strokeLinecap="round"
                transform={`rotate(${startAngleDeg} ${CX} ${CY})`}
                style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
            />

            {/* Value — centred on circle, below arc top → no overlap */}
            <text
                x={CX}
                y={CY + 8}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={color}
                fontWeight="900"
                fontSize="42"
                fontFamily="inherit"
                style={{ transition: 'fill 0.4s ease' }}
            >
                {displayVal}
            </text>
            <text
                x={CX + (hasValue ? 30 : 0)}
                y={CY + 18}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--text-secondary, #6b7280)"
                fontWeight="800"
                fontSize="18"
                fontFamily="inherit"
            >
                {displayUnit}
            </text>
        </svg>
    );
};


/* ──────────────────────────────────────────────────────────
   Main Component
────────────────────────────────────────────────────────── */
const HealthMonitoring = ({ spo2, pulse, hasData, roomId: _roomId }) => {
    const spo2Status = getSpo2Status(spo2);
    const pulseStatus = getPulseStatus(pulse);

    const hasSpo2Value = spo2 != null && !isNaN(spo2);
    const hasPulseValue = pulse != null && !isNaN(pulse);

    return (
        <div className="health-panel">
            {/* Header */}
            <div className="health-panel-header">
                <FiHeart className="health-panel-header-icon" />
                <div className="health-panel-header-text">
                    <h2 className="health-panel-title">Health Monitoring</h2>
                    <p className="health-panel-subtitle">Event-based · Updates on receive</p>
                </div>
                <div className={`health-data-pill ${hasData ? 'health-pill-live' : 'health-pill-wait'}`}>
                    <span className="health-pill-dot" />
                    {hasData ? 'LIVE' : 'WAITING'}
                </div>
            </div>

            {/* Body */}
            {!hasData ? (
                /* ── Waiting state ── */
                <div className="health-waiting">
                    <div className="health-waiting-ring-wrap">
                        <span className="health-waiting-ring" />
                        <FiHeart className="health-waiting-heart" />
                    </div>
                    <p className="health-waiting-title">Waiting for Data</p>
                    <p className="health-waiting-sub">Connect device to start receiving health readings</p>
                </div>
            ) : (
                <div className="health-cards-container">
                    {/* ── SpO2 card ── */}
                    <div className="health-metric-card">
                        {/* Card header row */}
                        <div className="health-metric-card-header">
                            <FiActivity className="health-metric-icon" />
                            <span className="health-metric-label">SpO₂</span>
                            <div className={`health-metric-chip health-chip-${spo2Status.level}`}>
                                {spo2Status.level === 'danger' && <span className="health-chip-pulse" />}
                                {LEVEL_ICONS[spo2Status.level]}
                                {spo2Status.label}
                            </div>
                        </div>

                        {/* Gauge — value rendered inside SVG, no overlay */}
                        <div className="health-spo2-gauge-wrap">
                            <ArcGauge
                                value={hasSpo2Value ? Number(spo2) : null}
                                level={spo2Status.level}
                                hasValue={hasSpo2Value}
                            />
                        </div>

                        {/* Reference bands */}
                        <div className="health-metric-bands">
                            <span className="health-band health-band-safe">≥95%</span>
                            <span className="health-band health-band-warn">90–94%</span>
                            <span className="health-band health-band-danger">&lt;90%</span>
                        </div>
                    </div>

                    {/* ── Pulse card ── */}
                    <div className="health-metric-card">
                        <div className="health-metric-card-header">
                            <FiHeart className="health-metric-icon" />
                            <span className="health-metric-label">Pulse</span>
                            <div className={`health-metric-chip health-chip-${pulseStatus.level}`}>
                                {pulseStatus.level === 'danger' && <span className="health-chip-pulse" />}
                                {LEVEL_ICONS[pulseStatus.level]}
                                {pulseStatus.label}
                            </div>
                        </div>

                        <div className="health-pulse-value-wrap">
                            <div className={`pulse-value-display text-${pulseStatus.level}`}>
                                {hasPulseValue ? Math.round(pulse) : '—'}
                                <span className="pulse-unit">BPM</span>
                            </div>
                        </div>

                        <div className="health-metric-bands">
                            <span className="health-band health-band-safe">60-99</span>
                            <span className="health-band health-band-warn">50-59</span>
                            <span className="health-band health-band-danger">≥120</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HealthMonitoring;
