import { formatDate } from '../utils/format';

/** Responsive SVG line/area chart. points: [{ label, value }] */
export function LineChart({ points, ideal = true, height = 240 }) {
  if (!points?.length) return null;
  const W = 640;
  const H = height;
  const pad = { t: 16, r: 16, b: 32, l: 36 };
  const max = Math.max(1, ...points.map((p) => p.value));
  const x = (i) => pad.l + (points.length === 1 ? (W - pad.l - pad.r) / 2 : (i * (W - pad.l - pad.r)) / (points.length - 1));
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.value)}`).join(' ');
  const area = `${line} L${x(points.length - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z`;
  const ticks = [0, 0.5, 1].map((t) => Math.round(max * t));
  const labelEvery = Math.max(1, Math.ceil(points.length / 6));

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Burndown chart of remaining issues over time">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="chart-grid" />
          <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="chart-text">{t}</text>
        </g>
      ))}
      {ideal && points.length > 1 && (
        <line x1={x(0)} y1={y(points[0].value)} x2={x(points.length - 1)} y2={y(0)} className="chart-ideal" />
      )}
      <path d={area} className="chart-area" />
      <path d={line} className="chart-line" />
      {points.map((p, i) => (
        <g key={p.label}>
          <circle cx={x(i)} cy={y(p.value)} r="4" className="chart-dot"><title>{`${formatDate(p.label)}: ${p.value} remaining`}</title></circle>
          {i % labelEvery === 0 && (
            <text x={x(i)} y={H - 10} textAnchor="middle" className="chart-text">
              {new Date(p.label).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

export function DonutChart({ segments, centerLabel, centerValue }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const R = 52;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 140 140" className="donut" role="img" aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(', ')}>
        <circle cx="70" cy="70" r={R} className="donut-track" />
        {total > 0 && segments.map((s) => {
          const len = (s.value / total) * C;
          const el = (
            <circle
              key={s.label}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="16"
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 70 70)"
            />
          );
          offset += len;
          return el;
        })}
        <text x="70" y="68" textAnchor="middle" className="donut-value">{centerValue ?? total}</text>
        <text x="70" y="86" textAnchor="middle" className="donut-label">{centerLabel}</text>
      </svg>
      <ul className="legend">
        {segments.map((s) => (
          <li key={s.label}><span className="legend-dot" style={{ background: s.color }} />{s.label}<strong>{s.value}</strong></li>
        ))}
      </ul>
    </div>
  );
}

export function BarList({ items, tone = 'primary', emptyText = 'No data yet' }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) return <p className="muted">{emptyText}</p>;
  return (
    <ul className="bar-list">
      {items.map((i) => (
        <li key={i.label}>
          <div className="bar-meta"><span className="truncate" title={i.label}>{i.label}</span><strong>{i.value}</strong></div>
          <div className="bar-track"><span className={`bar-fill progress-${i.tone || tone}`} style={{ width: `${(i.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
