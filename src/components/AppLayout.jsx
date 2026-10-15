import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Icon } from './Icon';
import { Avatar, Button, IconButton } from './ui';
import { IssueFormModal } from './IssueFormModal';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { titleCase } from '../utils/format';

const NAV = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/issues', label: 'Issues', icon: 'issues' },
  { to: '/board', label: 'Board', icon: 'board' },
  { to: '/sprints', label: 'Sprints', icon: 'sprint' },
  { to: '/reports', label: 'Reports', icon: 'chart' },
  { to: '/team', label: 'Team', icon: 'team' },
  { to: '/workflows', label: 'Workflows', icon: 'flow' },
];

function isTyping(el) {
  return el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const [theme, toggleTheme] = useTheme();
  const [navOpen, setNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [create, setCreate] = useState({ open: false, options: {} });
  const [issuesVersion, setIssuesVersion] = useState(0);
  const menuRef = useRef(null);

  const openCreate = useCallback((options = {}) => setCreate({ open: true, options }), []);
  const closeCreate = useCallback(() => setCreate((c) => ({ ...c, open: false })), []);

  // Close the user menu on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // Keyboard shortcuts: "c" = create issue, "/" = focus search.
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(document.activeElement)) return;
      if (e.key === 'c') { e.preventDefault(); openCreate(); }
      if (e.key === '/') {
        const el = document.getElementById('page-search');
        if (el) { e.preventDefault(); el.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openCreate]);

  return (
    <div className="app">
      <a href="#main" className="skip-link">Skip to content</a>
      <aside className={`sidebar ${navOpen ? 'sidebar-open' : ''}`} aria-label="Primary">
        <div className="brand">
          <span className="brand-mark"><Icon name="check" size={18} /></span>
          TaskFlow
        </div>
        <nav>
          <ul>
            {NAV.map((n) => (
              <li key={n.to}>
                <NavLink to={n.to} end={n.end} onClick={() => setNavOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`}>
                  <Icon name={n.icon} size={20} />
                  {n.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <p className="sidebar-hint"><kbd>c</kbd> new issue · <kbd>/</kbd> search</p>
      </aside>
      {navOpen && <button type="button" className="scrim" aria-label="Close navigation" onClick={() => setNavOpen(false)} />}

      <div className="main-col">
        <header className="topbar">
          <IconButton icon="menu" label="Open navigation" className="only-mobile" onClick={() => setNavOpen(true)} />
          <div className="topbar-spacer" />
          <Button icon="plus" size="sm" onClick={() => openCreate()}>New issue</Button>
          <IconButton icon={theme === 'dark' ? 'sun' : 'moon'} label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onClick={toggleTheme} />
          <div className="user-menu" ref={menuRef}>
            <button type="button" className="user-btn" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
              <Avatar name={user.email} size={32} />
            </button>
            {menuOpen && (
              <div className="menu" role="menu">
                <div className="menu-head">
                  <strong className="truncate">{titleCase(user.email.split('@')[0])}</strong>
                  <span className="muted truncate">{user.email}</span>
                  <span className="badge badge-violet">{titleCase((user.role || '').toLowerCase())}</span>
                </div>
                <button type="button" role="menuitem" className="menu-item" onClick={logout}>
                  <Icon name="logout" size={18} /> Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <main id="main" className="content" tabIndex={-1}>
          <Outlet context={{ openCreate, issuesVersion }} />
        </main>
      </div>

      <IssueFormModal
        key={`${create.options.defaultStatus ?? ''}-${create.options.defaultSprintId ?? ''}`}
        open={create.open}
        onClose={closeCreate}
        onCreated={() => setIssuesVersion((v) => v + 1)}
        {...create.options}
      />
    </div>
  );
}
