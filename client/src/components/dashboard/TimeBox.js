import React, { useState, useEffect } from 'react';
import './DashboardCard.css';
import './TimeBox.css';

const TimeBox = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatIST = (date) => {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  };

  const istDate = new Date(time.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const seconds = istDate.getSeconds();
  
  const hourAngle = (hours % 12) * 30 + minutes * 0.5;
  const minuteAngle = minutes * 6 + seconds * 0.1;
  const secondAngle = seconds * 6;

  const dateParts = formatIST(time).split(', ');
  const dayDate = dateParts[0];
  const year = dateParts[1];
  const timeStr = dateParts[2];

  return (
    <div className="dashboard-card time-box">
      <h3 className="card-title">Time</h3>
      <div className="time-content">
        <div className="analog-clock">
          <svg viewBox="0 0 200 200" className="clock-svg">
            <circle cx="100" cy="100" r="90" fill="none" stroke="#e0e0e0" strokeWidth="2" />
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180);
              const x1 = 100 + 75 * Math.cos(angle);
              const y1 = 100 + 75 * Math.sin(angle);
              const x2 = 100 + 85 * Math.cos(angle);
              const y2 = 100 + 85 * Math.sin(angle);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#666"
                  strokeWidth="2"
                />
              );
            })}
            <line
              x1="100"
              y1="100"
              x2={100 + 50 * Math.cos((hourAngle - 90) * (Math.PI / 180))}
              y2={100 + 50 * Math.sin((hourAngle - 90) * (Math.PI / 180))}
              stroke="#333"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <line
              x1="100"
              y1="100"
              x2={100 + 70 * Math.cos((minuteAngle - 90) * (Math.PI / 180))}
              y2={100 + 70 * Math.sin((minuteAngle - 90) * (Math.PI / 180))}
              stroke="#333"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1="100"
              y1="100"
              x2={100 + 75 * Math.cos((secondAngle - 90) * (Math.PI / 180))}
              y2={100 + 75 * Math.sin((secondAngle - 90) * (Math.PI / 180))}
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="100" cy="100" r="5" fill="#333" />
          </svg>
        </div>
        <div className="digital-time">
          <div className="time-label">IST Time</div>
          <div className="time-date">{dayDate}, {year}</div>
          <div className="time-clock">{timeStr}</div>
        </div>
      </div>
    </div>
  );
};

export default TimeBox;
