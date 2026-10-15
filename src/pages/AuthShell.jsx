import { Icon } from '../components/Icon';

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <aside className="auth-hero" aria-hidden="true">
        <div className="brand brand-light"><span className="brand-mark"><Icon name="check" size={18} /></span>TaskFlow</div>
        <h2>Plan sprints.<br />Track issues.<br />Ship faster.</h2>
        <ul>
          <li><Icon name="board" size={18} /> Drag-and-drop Kanban boards</li>
          <li><Icon name="chart" size={18} /> Burndown and workload reports</li>
          <li><Icon name="sprint" size={18} /> Sprint planning in a few clicks</li>
        </ul>
      </aside>
      <main className="auth-main">
        <div className="auth-card">
          <div className="brand only-mobile"><span className="brand-mark"><Icon name="check" size={18} /></span>TaskFlow</div>
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
          {children}
          {footer && <p className="auth-footer">{footer}</p>}
        </div>
      </main>
    </div>
  );
}
