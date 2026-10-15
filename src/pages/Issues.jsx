import { useMemo, useState } from 'react';
import {
  Avatar, Badge, Button, Card, EmptyState, ErrorState, PageHeader, PriorityBadge, SkeletonRows, StatusBadge, TypeChip,
} from '../components/ui';
import { Icon } from '../components/Icon';
import { IssueDrawer } from '../components/IssueDrawer';
import { useAuth } from '../hooks/useAuth';
import { useAppContext } from '../hooks/useAppContext';
import { useIssues } from '../hooks/useIssues';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  ISSUE_TYPES, PRIORITIES, STATUSES, STATUS_LABEL,
} from '../utils/constants';
import { formatDate, isOverdue, titleCase } from '../utils/format';

const PRIORITY_RANK = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
const SORTS = {
  updated: { label: 'Recently updated', fn: (a, b) => new Date(b.updateAt || b.createdAt) - new Date(a.updateAt || a.createdAt) },
  priority: { label: 'Priority', fn: (a, b) => (PRIORITY_RANK[b.priority] || 0) - (PRIORITY_RANK[a.priority] || 0) },
  due: { label: 'Due date', fn: (a, b) => (a.dueDate ? new Date(a.dueDate) : Infinity) - (b.dueDate ? new Date(b.dueDate) : Infinity) },
  key: { label: 'Key', fn: (a, b) => b.id - a.id },
};
const PAGE_SIZE = 20;

export default function Issues() {
  useDocumentTitle('Issues');
  const { user } = useAuth();
  const { openCreate, issuesVersion } = useAppContext();
  const { data: issues, loading, error, reload, setData } = useIssues(issuesVersion);
  const [filters, setFilters] = useState({ q: '', status: '', priority: '', type: '', mine: false, sort: 'updated' });
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  const update = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return (issues || [])
      .filter((i) => !filters.status || i.issueStatus === filters.status)
      .filter((i) => !filters.priority || i.priority === filters.priority)
      .filter((i) => !filters.type || i.issueType === filters.type)
      .filter((i) => !filters.mine || i.assigneeEmail?.toLowerCase() === user.email.toLowerCase())
      .filter((i) => !q || [i.issueKey, i.issueTitle, i.issueDescription, i.assigneeEmail].some((v) => v?.toLowerCase().includes(q)))
      .sort(SORTS[filters.sort].fn);
  }, [issues, filters, user.email]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = (issues || []).find((i) => i.id === selectedId) || null;
  const hasFilters = filters.q || filters.status || filters.priority || filters.type || filters.mine;

  const onStatusChange = (updated) => setData((list) => list.map((i) => (i.id === updated.id ? { ...i, ...updated } : i)));

  return (
    <>
      <PageHeader
        title="Issues"
        subtitle={loading ? 'Loading…' : `${filtered.length} of ${issues?.length ?? 0} issues`}
        actions={<Button icon="plus" onClick={() => openCreate()}>New issue</Button>}
      />

      <Card padded={false}>
        <div className="toolbar">
          <div className="search">
            <Icon name="search" size={18} />
            <input id="page-search" type="search" placeholder="Search issues…  ( / )" aria-label="Search issues" value={filters.q} onChange={(e) => update({ q: e.target.value })} />
          </div>
          <select aria-label="Filter by status" value={filters.status} onChange={(e) => update({ status: e.target.value })}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <select aria-label="Filter by priority" value={filters.priority} onChange={(e) => update({ priority: e.target.value })}>
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{titleCase(p.toLowerCase())}</option>)}
          </select>
          <select aria-label="Filter by type" value={filters.type} onChange={(e) => update({ type: e.target.value })}>
            <option value="">All types</option>
            {ISSUE_TYPES.map((t) => <option key={t} value={t}>{titleCase(t.toLowerCase())}</option>)}
          </select>
          <label className="check">
            <input type="checkbox" checked={filters.mine} onChange={(e) => update({ mine: e.target.checked })} /> Assigned to me
          </label>
          <select aria-label="Sort by" value={filters.sort} onChange={(e) => update({ sort: e.target.value })}>
            {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>Sort: {s.label}</option>)}
          </select>
          {hasFilters && <Button variant="ghost" size="sm" onClick={() => update({ q: '', status: '', priority: '', type: '', mine: false })}>Clear</Button>}
        </div>

        {loading && <SkeletonRows rows={8} />}
        {error && <ErrorState error={error} onRetry={reload} title="Could not load issues" />}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            icon={hasFilters ? 'filter' : 'issues'}
            title={hasFilters ? 'No issues match your filters' : 'No issues yet'}
            action={hasFilters
              ? <Button variant="secondary" onClick={() => update({ q: '', status: '', priority: '', type: '', mine: false })}>Clear filters</Button>
              : <Button icon="plus" onClick={() => openCreate()}>Create issue</Button>}
          >
            {hasFilters ? 'Try a different search or remove a filter.' : 'Create your first issue to get started.'}
          </EmptyState>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th scope="col">Issue</th><th scope="col">Status</th><th scope="col">Priority</th><th scope="col">Assignee</th><th scope="col">Due</th></tr>
              </thead>
              <tbody>
                {visible.map((i) => (
                  <tr key={i.id} className={selectedId === i.id ? 'row-selected' : ''}>
                    <td data-label="Issue">
                      <button type="button" className="row-link" onClick={() => setSelectedId(i.id)}>
                        <TypeChip type={i.issueType} />
                        <span className="issue-text">
                          <span className="issue-key">{i.issueKey}</span>
                          <span className="issue-title">{i.issueTitle}</span>
                        </span>
                      </button>
                    </td>
                    <td data-label="Status"><StatusBadge status={i.issueStatus} /></td>
                    <td data-label="Priority"><PriorityBadge priority={i.priority} /></td>
                    <td data-label="Assignee"><span className="with-avatar"><Avatar name={i.assigneeEmail} size={24} /><span className="truncate">{i.assigneeEmail || 'Unassigned'}</span></span></td>
                    <td data-label="Due">
                      {isOverdue(i) ? <Badge tone="red">{formatDate(i.dueDate)} · overdue</Badge> : formatDate(i.dueDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <nav className="pager" aria-label="Pagination">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="muted">Page {page} of {pages}</span>
            <Button variant="secondary" size="sm" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </nav>
        )}
      </Card>

      <IssueDrawer issue={selected} onClose={() => setSelectedId(null)} onStatusChange={onStatusChange} />
    </>
  );
}
