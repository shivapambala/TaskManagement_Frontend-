import { useId } from 'react';
import { Icon } from './Icon';
import { initials, titleCase } from '../utils/format';
import {
  PRIORITY_TONE, STATUS_LABEL, STATUS_TONE, TYPE_ICON, TYPE_TONE,
} from '../utils/constants';

export function Button({
  variant = 'primary', size = 'md', loading = false, icon, children, className = '', disabled, type = 'button', ...rest
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="spinner spinner-sm" aria-hidden="true" /> : icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      {children}
    </button>
  );
}

export function IconButton({ icon, label, className = '', ...rest }) {
  return (
    <button type="button" className={`icon-btn ${className}`} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={20} />
    </button>
  );
}

export function Badge({ tone = 'slate', children, dot = false }) {
  return (
    <span className={`badge badge-${tone}`}>
      {dot && <span className="badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

export const StatusBadge = ({ status }) =>
  status ? <Badge tone={STATUS_TONE[status] || 'slate'} dot>{STATUS_LABEL[status] || titleCase(status)}</Badge> : null;

export const PriorityBadge = ({ priority }) =>
  priority ? <Badge tone={PRIORITY_TONE[priority] || 'slate'}>{titleCase(priority.toLowerCase())}</Badge> : null;

export const TypeChip = ({ type }) =>
  type ? (
    <span className={`type-chip type-${TYPE_TONE[type] || 'slate'}`} title={titleCase(type.toLowerCase())}>
      <span aria-hidden="true">{TYPE_ICON[type] || '•'}</span>
      <span className="sr-only">{type}</span>
    </span>
  ) : null;

export function Avatar({ name, size = 28 }) {
  if (!name) {
    return <span className="avatar avatar-empty" style={{ width: size, height: size }} title="Unassigned"><Icon name="user" size={size * 0.55} /></span>;
  }
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.4, background: `hsl(${hue} 55% 46%)` }}
      title={name}
      aria-label={name}
    >
      {initials(name)}
    </span>
  );
}

export function Spinner({ label = 'Loading' }) {
  return (
    <div className="center-fill" role="status">
      <span className="spinner" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function Skeleton({ height = 16, width = '100%', radius = 8, className = '' }) {
  return <span className={`skeleton ${className}`} style={{ height, width, borderRadius: radius }} aria-hidden="true" />;
}

export function SkeletonRows({ rows = 6 }) {
  return (
    <div className="skeleton-rows" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton-row">
          <Skeleton width={28} height={28} radius={14} />
          <Skeleton width="55%" />
          <Skeleton width={70} />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon = 'info', title, children, action }) {
  return (
    <div className="empty">
      <span className="empty-icon"><Icon name={icon} size={28} /></span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Something went wrong' }) {
  return (
    <div className="empty empty-error" role="alert">
      <span className="empty-icon"><Icon name="alert" size={28} /></span>
      <h3>{title}</h3>
      <p>{error?.message || 'Please try again.'}</p>
      {onRetry && <Button variant="secondary" icon="refresh" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function Card({ title, actions, children, className = '', padded = true }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <header className="card-head">
          {title && <h2>{title}</h2>}
          {actions && <div className="card-actions">{actions}</div>}
        </header>
      )}
      <div className={padded ? 'card-body' : ''}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function ProgressBar({ value, tone = 'primary', label }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <span className={`progress-fill progress-${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Field({ label, hint, error, children, required }) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className={`field ${error ? 'field-error' : ''}`}>
      <label htmlFor={id}>
        {label}
        {required && <span className="req" aria-hidden="true"> *</span>}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined, required })}
      {error ? <p className="field-msg" id={`${id}-err`}>{error}</p> : hint && <p className="field-hint" id={`${id}-hint`}>{hint}</p>}
    </div>
  );
}

export function Tabs({ tabs, value, onChange, label }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          className={`tab ${value === t.value ? 'tab-active' : ''}`}
          onClick={() => onChange(t.value)}
        >
          {t.label}
          {t.count !== undefined && <span className="tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
