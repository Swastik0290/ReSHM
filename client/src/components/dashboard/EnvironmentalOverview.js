import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { FiThermometer, FiDroplet, FiZoomIn, FiRefreshCcw, FiLoader } from 'react-icons/fi';
import axios from 'axios';
import './DashboardCard.css';
import './EnvironmentalOverview.css';

/* ─── Helpers ────────────────────────────────────────────── */
const pad = (n) => String(n).padStart(2, '0');

function buildDomain(values, paddingFactor = 0.3, minSpan = 1.0) {
  if (!values.length) return ['auto', 'auto'];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = Math.max(hi - lo, minSpan);
  const p = span * paddingFactor;
  return [
    Math.floor((lo - p) * 10) / 10,
    Math.ceil((hi + p) * 10) / 10,
  ];
}

/* ─── Time periods ───────────────────────────────────────── */
const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: 'This Week' },
  { key: 'all', label: 'All' },
];

/* ─── Custom Tooltip ─────────────────────────────────────── */
const EnvTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="env-tooltip">
      {d?.fullTimestamp && <p className="env-tooltip-time">{d.fullTimestamp}</p>}
      {payload.map((entry) => (
        <div key={entry.dataKey} className="env-tooltip-row" style={{ color: entry.color }}>
          <span className="env-tooltip-dot" style={{ background: entry.color }} />
          <span>{entry.name}:</span>
          <strong>
            {entry.value != null ? Number(entry.value).toFixed(2) : '—'}
            {entry.dataKey === 'temp' ? '°C' : '%'}
          </strong>
        </div>
      ))}
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────── */
const EnvironmentalOverview = ({ temperature, humidity, roomId }) => {
  const [period, setPeriod] = useState('today');
  const [view, setView] = useState('both');
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(null);
  const wrapRef = useRef(null);

  /* ── Fetch trends from the new /api/sensor/trends endpoint ── */
  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      setZoom(null);
      try {
        const { data } = await axios.get(`/api/sensor/trends/${roomId}?period=${period}`);
        if (!cancelled) setTrends(data.readings || []);
      } catch {
        if (!cancelled) setTrends([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [roomId, period]);

  /* ── Build chart-ready data ──────────────────────────────── */
  const chartData = useMemo(() =>
    trends.map(t => {
      const d = new Date(t.timestamp);
      const timeLabel = d.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true
      });
      const fullLabel = `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${d.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      })}`;
      return {
        time: timeLabel,
        fullTimestamp: fullLabel,
        temp: t.temperature != null ? Number(t.temperature) : null,
        hum: t.humidity != null ? Number(t.humidity) : null,
      };
    }),
    [trends]
  );

  /* ── Apply zoom window ───────────────────────────────────── */
  const displayData = useMemo(() => {
    if (!zoom) return chartData;
    return chartData.slice(Math.max(0, zoom.s), Math.min(chartData.length, zoom.e));
  }, [chartData, zoom]);

  const isZoomed = !!zoom;

  /* ── Scroll-wheel zoom ───────────────────────────────────── */
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const total = chartData.length;
    if (total < 3) return;
    const cur = zoom ?? { s: 0, e: total };
    const span = cur.e - cur.s;
    const delta = e.deltaY < 0 ? -Math.ceil(span * 0.15) : Math.ceil(span * 0.15);
    const ns_ = Math.max(span + delta * 2, 3);
    const newSp = Math.min(total, ns_);
    const mid = Math.round((cur.s + cur.e) / 2);
    const ns = Math.max(0, mid - Math.floor(newSp / 2));
    const ne = Math.min(total, ns + newSp);
    if (ne - ns >= total) setZoom(null);
    else setZoom({ s: ns, e: ne });
  }, [chartData.length, zoom]);

  const wrapCallbackRef = useCallback((node) => {
    if (wrapRef.current) wrapRef.current.removeEventListener('wheel', handleWheel);
    wrapRef.current = node;
    if (node) node.addEventListener('wheel', handleWheel, { passive: false });
  }, [handleWheel]);

  /* ── Compute stats from REAL data — accurate avg/max/min ── */
  const temps = displayData.map(d => d.temp).filter(v => v != null);
  const hums = displayData.map(d => d.hum).filter(v => v != null);

  // Use precise arithmetic to avoid floating-point drift
  const avgTemp = temps.length
    ? temps.reduce((s, v) => s + v, 0) / temps.length
    : null;
  const maxTemp = temps.length ? Math.max(...temps) : null;
  const minTemp = temps.length ? Math.min(...temps) : null;
  const avgHum = hums.length
    ? hums.reduce((s, v) => s + v, 0) / hums.length
    : null;

  /* ── Dynamic Y-axis domains ──────────────────────────────── */
  const tempDomain = useMemo(() => buildDomain(temps, 0.3, 1.0), [temps]);
  const humDomain = useMemo(() => buildDomain(hums, 0.2, 5.0), [hums]);

  const hasData = displayData.length > 0;

  return (
    <div className="dashboard-card environmental-overview">

      {/* ── Title + view tabs ─────────────────────────────── */}
      <div className="env-header-row">
        <h3 className="card-title" style={{ margin: 0 }}>Environmental Overview</h3>
        <div className="env-view-tabs">
          {[
            { key: 'temp', label: 'Temp' },
            { key: 'hum', label: 'Humidity' },
            { key: 'both', label: 'Both' },
          ].map(({ key, label }) => (
            <button key={key} className={`env-tab ${view === key ? 'active' : ''}`} onClick={() => setView(key)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Period selector (Today / Yesterday / This Week / All) ── */}
      <div className="env-period-row">
        {PERIODS.map(p => (
          <button
            key={p.key}
            className={`env-period-btn ${period === p.key ? 'active' : ''}`}
            onClick={() => setPeriod(p.key)}
            disabled={loading}
          >
            {p.label}
          </button>
        ))}
        {loading && <FiLoader className="env-loader-spin" size={14} />}
      </div>

      {/* ── Live value pills ──────────────────────────────── */}
      <div className="env-live-row">
        {(view === 'temp' || view === 'both') && (
          <div className="env-live-pill env-live-temp">
            <FiThermometer />
            <span className="env-live-label">Live Temp</span>
            <span className="env-live-value">
              {temperature != null ? `${Number(temperature).toFixed(1)}°C` : '—'}
            </span>
          </div>
        )}
        {(view === 'hum' || view === 'both') && (
          <div className="env-live-pill env-live-hum">
            <FiDroplet />
            <span className="env-live-label">Live Humidity</span>
            <span className="env-live-value">
              {humidity != null ? `${Number(humidity).toFixed(1)}%` : '—'}
            </span>
          </div>
        )}
      </div>

      {/* ── Stats ─────────────────────────────────────────── */}
      {hasData && (view === 'temp' || view === 'both') && avgTemp != null && (
        <div className="env-stats-bar" style={{ marginBottom: 8 }}>
          <div className="env-stat">
            <span>Avg</span>
            <strong>{avgTemp.toFixed(2)}°C</strong>
          </div>
          <div className="env-stat">
            <span>Max</span>
            <strong style={{ color: '#ef4444' }}>{maxTemp.toFixed(2)}°C</strong>
          </div>
          <div className="env-stat">
            <span>Min</span>
            <strong style={{ color: '#3b82f6' }}>{minTemp.toFixed(2)}°C</strong>
          </div>
          {avgHum != null && (view === 'both') && (
            <div className="env-stat">
              <span>Avg Hum</span>
              <strong style={{ color: '#3b82f6' }}>{avgHum.toFixed(1)}%</strong>
            </div>
          )}
          <div className="env-stat">
            <span>Points</span>
            <strong>{displayData.length}</strong>
          </div>
        </div>
      )}

      {/* ── Chart ─────────────────────────────────────────── */}
      <div className="env-chart-wrap" ref={wrapCallbackRef}>
        {!hasData ? (
          <div className="env-no-data">
            {loading
              ? <><FiLoader size={20} className="env-loader-spin" /><span>Loading data…</span></>
              : <><FiThermometer size={20} /><span>No readings for this period.</span></>
            }
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={210}>
            <ComposedChart data={displayData} margin={{ top: 8, right: 14, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="temp"
                orientation="left"
                tick={{ fontSize: 10, fill: '#14b8a6' }}
                tickLine={false}
                axisLine={false}
                domain={tempDomain}
                tickCount={6}
                tickFormatter={v => Number(v).toFixed(1)}
                hide={view === 'hum'}
              />
              <YAxis
                yAxisId="hum"
                orientation="right"
                tick={{ fontSize: 10, fill: '#3b82f6' }}
                tickLine={false}
                axisLine={false}
                domain={humDomain}
                tickCount={6}
                tickFormatter={v => `${Number(v).toFixed(1)}%`}
                hide={view === 'temp'}
              />
              <Tooltip content={<EnvTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />

              {/* Avg temp reference — orange, clearly different from data lines */}
              {avgTemp != null && (view === 'temp' || view === 'both') && (
                <ReferenceLine
                  yAxisId="temp"
                  y={avgTemp}
                  stroke="#f59e0b"
                  strokeDasharray="5 3"
                  strokeWidth={1.5}
                  label={{ value: `avg ${avgTemp.toFixed(2)}°`, fontSize: 9, fill: '#f59e0b', position: 'insideTopLeft' }}
                />
              )}

              {(view === 'temp' || view === 'both') && (
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="temp"
                  name="Temp (°C)"
                  stroke="#14b8a6"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: '#14b8a6', strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#14b8a6' }}
                  connectNulls
                />
              )}

              {(view === 'hum' || view === 'both') && (
                <Line
                  yAxisId="hum"
                  type="monotone"
                  dataKey="hum"
                  name="Humidity (%)"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: '#3b82f6', strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#3b82f6' }}
                  connectNulls
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Zoom footer ────────────────────────────────────── */}
      <div className="env-zoom-footer">
        <div className="env-zoom-hint">
          <FiZoomIn size={12} />
          <span>Scroll to zoom</span>
          {isZoomed && (
            <button className="env-reset-zoom" onClick={() => setZoom(null)}>
              <FiRefreshCcw size={11} /> Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnvironmentalOverview;
