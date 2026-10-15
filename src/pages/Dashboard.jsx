import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Avatar, Button, Card, EmptyState, ErrorState, PageHeader, PriorityBadge, ProgressBar, Skeleton, StatusBadge, TypeChip,
} from '../components/ui';
import { BarList, DonutChart } from '../components/Charts';
import { useAuth } from '../hooks/useAuth';
import { useAppContext } from '../hooks/useAppContext';
import { useIssues } from '../hooks/useIssues';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PRIORITIES, STATUSES, STATUS_LABEL } from '../utils/constants';
import { isOverdue, timeAgo, titleCase } from '../utils/format';

const TONE_COLOR = {
  OPEN: '#94a3b8', TODO: '#3b82f6', IN_PROGRESS: '#f59e0b', IN_RIVIEW: '#8b5cf6',
  DONE: '#22c55e', REOPEN: '#f97316', CLOSED: '#64748b', BLOCKED: '#ef4444',
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function Stat({ label, value, hint, tone = '' }) {
  return (
    <div className={`stat ${tone}`}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const { openCreate, issuesVersion } = useAppContext();
  const { data: issues, loading, error, reload } = useIssues(issuesVersion);

  const stats = useMemo(() => {
    const list = issues || [];
    const done = list.filter((i) => ['DONE', 'CLOSED'].includes(i.issueStatus)).length;
    const mine = list.filter((i) => i.assigneeEmail?.toLowerCase() === user.email.toLowerCase());
    return {
      total: list.length,
      done,
      open: list.length - done,
      overdue: list.filter(isOverdue).length,
      mine,
      myOpen: mine.filter((i) => !['DONE', 'CLOSED'].includes(i.issueStatus)),
      pct: list.length ? (done / list.length) * 100 : 0,
      byStatus: STATUSES.map((s) => ({ label: STATUS_LABEL[s], value: list.filter((i) => i.issueStatus === s).length, color: TONE_COLOR[s] })).filter((s) => s.value > 0),
      byPriority: PRIORITIES.map((p) => ({ label: titleCase(p.toLowerCase()), value: list.filter((i) => i.priority === p).length, tone: { LOW: 'slate', MEDIUM: 'primary', HIGH: 'orange', CRITICAL: 'red' }[p] })),
      recent: [...list].sort((a, b) => new Date(b.updateAt || b.createdAt) - new Date(a.updateAt || a.createdAt)).slice(0, 6),
    };
  }, [issues, user.email]);

  const name = titleCase(user.email.split('@')[0]);

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${name.split(' ')[0]}`}
        subtitle="Here is where your work stands today."
        actions={<Button icon="plus" onClick={() => openCreate()}>New issue</Button>}
      />

      {error && <ErrorState error={error} onRetry={reload} title="Could not load your issues" />}

      {!error && (
        <>
          <div className="stats">
            {loading ? [0, 1, 2, 3].map((i) => <div key={i} className="stat"><Skeleton width="50%" height={14} /><Skeleton width="35%" height={30} /></div>) : (
              <>
                <Stat label="Total issues" value={stats.total} />
                <Stat label="Open" value={stats.open} hint={`${stats.myOpen.length} assigned to you`} />
                <Stat label="Completed" value={stats.done} hint={`${Math.round(stats.pct)}% of all issues`} tone="stat-good" />
                <Stat label="Overdue" value={stats.overdue} tone={stats.overdue ? 'stat-bad' : ''} hint={stats.overdue ? 'Needs attention' : 'All on track'} />
              </>
            )}
          </div>

          {!loading && stats.total === 0 ? (
            <Card>
              <EmptyState icon="issues" title="Your workspace is empty" action={<Button icon="plus" onClick={() => openCreate()}>Create your first issue</Button>}>
                Create an issue to start tracking work. Press <kbd>c</kbd> any time.
              </EmptyState>
            </Card>
          ) : (
            <div className="grid-2">
              <Card title="Progress" className="span-all-sm">
                {loading ? <Skeleton height={160} /> : (
                  <>
                    <ProgressBar value={stats.pct} tone="green" label="Overall completion" />
                    <p className="muted progress-caption">{stats.done} of {stats.total} issues done</p>
                    <DonutChart segments={stats.byStatus} centerValue={stats.total} centerLabel="issues" />
                  </>
                )}
              </Card>
              <Card title="By priority">
                {loading ? <Skeleton height={160} /> : <BarList items={stats.byPriority} />}
              </Card>
              <Card title="Assigned to you" actions={<Link to="/issues" className="link-sm">View all</Link>}>
                {loading ? <Skeleton height={120} /> : stats.myOpen.length === 0 ? (
                  <EmptyState icon="check" title="Nothing assigned">You are all caught up.</EmptyState>
                ) : (
                  <ul className="mini-list">
                    {stats.myOpen.slice(0, 6).map((i) => (
                      <li key={i.id}>
                        <TypeChip type={i.issueType} />
                        <span className="truncate">{i.issueTitle}</span>
                        <StatusBadge status={i.issueStatus} />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              <Card title="Recent activity">
                {loading ? <Skeleton height={120} /> : (
                  <ul className="mini-list">
                    {stats.recent.map((i) => (
                      <li key={i.id}>
                        <Avatar name={i.assigneeEmail} size={24} />
                        <span className="truncate">{i.issueKey} · {i.issueTitle}</span>
                        <span className="muted nowrap">{timeAgo(i.updateAt || i.createdAt)}</span>
                        <PriorityBadge priority={i.priority} />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          )}
        </>
      )}
    </>
  );
}
