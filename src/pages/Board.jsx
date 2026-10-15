import { useMemo, useState } from 'react';
import {
  Avatar, Badge, Button, EmptyState, ErrorState, PageHeader, PriorityBadge, Skeleton, TypeChip,
} from '../components/ui';
import { Icon } from '../components/Icon';
import { IssueDrawer } from '../components/IssueDrawer';
import { issueApi } from '../api/endpoints';
import { useAuth } from '../hooks/useAuth';
import { useAppContext } from '../hooks/useAppContext';
import { useIssues } from '../hooks/useIssues';
import { useToast } from '../hooks/useToast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { BOARD_STATUSES, STATUSES, STATUS_LABEL } from '../utils/constants';
import { formatDate, isOverdue } from '../utils/format';

const EXTRA = ['REOPEN', 'BLOCKED', 'CLOSED'];

export default function Board() {
  useDocumentTitle('Board');
  const { user } = useAuth();
  const toast = useToast();
  const { openCreate, issuesVersion } = useAppContext();
  const { data: issues, loading, error, reload, setData } = useIssues(issuesVersion);
  const [sprint, setSprint] = useState('');
  const [mine, setMine] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const sprintIds = useMemo(() => [...new Set((issues || []).map((i) => i.sprintId).filter(Boolean))].sort((a, b) => b - a), [issues]);
  const columns = showAll ? STATUSES : BOARD_STATUSES;

  const cards = useMemo(() => (issues || [])
    .filter((i) => (sprint === '' ? true : sprint === 'backlog' ? !i.sprintId : String(i.sprintId) === sprint))
    .filter((i) => !mine || i.assigneeEmail?.toLowerCase() === user.email.toLowerCase()), [issues, sprint, mine, user.email]);

  const byStatus = (s) => cards.filter((i) => (i.issueStatus || 'OPEN') === s);
  const hiddenExtra = !showAll ? cards.filter((i) => EXTRA.includes(i.issueStatus)).length : 0;

  const move = async (issue, status) => {
    if (!issue || issue.issueStatus === status) return;
    const previous = issue.issueStatus;
    setData((list) => list.map((i) => (i.id === issue.id ? { ...i, issueStatus: status } : i))); // optimistic
    try {
      await issueApi.updateStatus(issue.id, status);
      toast.success(`${issue.issueKey} → ${STATUS_LABEL[status]}`);
    } catch (err) {
      setData((list) => list.map((i) => (i.id === issue.id ? { ...i, issueStatus: previous } : i)));
      toast.error(`Could not move ${issue.issueKey}: ${err.message}`);
    }
  };

  const onDrop = (status) => (e) => {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData('text/plain') || dragId);
    setDragId(null);
    setOverCol(null);
    move((issues || []).find((i) => i.id === id), status);
  };

  const selected = (issues || []).find((i) => i.id === selectedId) || null;

  return (
    <>
      <PageHeader
        title="Board"
        subtitle="Drag cards between columns, or use the Move menu on each card."
        actions={<Button icon="plus" onClick={() => openCreate()}>New issue</Button>}
      />

      <div className="toolbar toolbar-plain">
        <select aria-label="Filter by sprint" value={sprint} onChange={(e) => setSprint(e.target.value)}>
          <option value="">All issues</option>
          <option value="backlog">Backlog (no sprint)</option>
          {sprintIds.map((id) => <option key={id} value={id}>Sprint #{id}</option>)}
        </select>
        <label className="check"><input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> Only my issues</label>
        <label className="check">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> Show all statuses
          {hiddenExtra > 0 && <Badge tone="orange">{hiddenExtra} hidden</Badge>}
        </label>
      </div>

      {error && <ErrorState error={error} onRetry={reload} title="Could not load the board" />}
      {loading && (
        <div className="board">{BOARD_STATUSES.map((s) => <div key={s} className="column"><Skeleton height={20} width="50%" /><Skeleton height={80} /><Skeleton height={80} /></div>)}</div>
      )}

      {!loading && !error && (
        <div className="board">
          {columns.map((status) => {
            const list = byStatus(status);
            return (
              <section
                key={status}
                className={`column ${overCol === status ? 'column-over' : ''}`}
                aria-label={`${STATUS_LABEL[status]} column, ${list.length} issues`}
                onDragOver={(e) => { e.preventDefault(); setOverCol(status); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOverCol(null); }}
                onDrop={onDrop(status)}
              >
                <header className="column-head">
                  <h2>{STATUS_LABEL[status]}</h2>
                  <span className="count">{list.length}</span>
                  <button type="button" className="icon-btn" aria-label={`Add issue to ${STATUS_LABEL[status]}`} onClick={() => openCreate({ defaultStatus: status, defaultSprintId: /^\d+$/.test(sprint) ? sprint : '' })}>
                    <Icon name="plus" size={18} />
                  </button>
                </header>
                <ul className="cards">
                  {list.map((i) => (
                    <li
                      key={i.id}
                      className={`kcard ${dragId === i.id ? 'kcard-drag' : ''}`}
                      draggable
                      onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(i.id)); e.dataTransfer.effectAllowed = 'move'; setDragId(i.id); }}
                      onDragEnd={() => { setDragId(null); setOverCol(null); }}
                    >
                      <button type="button" className="kcard-title" onClick={() => setSelectedId(i.id)}>{i.issueTitle}</button>
                      <div className="kcard-meta">
                        <TypeChip type={i.issueType} />
                        <span className="issue-key">{i.issueKey}</span>
                        <PriorityBadge priority={i.priority} />
                        {isOverdue(i) && <Badge tone="red">Due {formatDate(i.dueDate)}</Badge>}
                      </div>
                      <div className="kcard-foot">
                        <Avatar name={i.assigneeEmail} size={24} />
                        <select className="move-select" aria-label={`Move ${i.issueKey}`} value="" onChange={(e) => move(i, e.target.value)}>
                          <option value="" disabled>Move to…</option>
                          {STATUSES.filter((s) => s !== i.issueStatus).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                        </select>
                      </div>
                    </li>
                  ))}
                </ul>
                {list.length === 0 && <EmptyState icon="board" title="No issues">Drop a card here.</EmptyState>}
              </section>
            );
          })}
        </div>
      )}

      <IssueDrawer
        issue={selected}
        onClose={() => setSelectedId(null)}
        onStatusChange={(u) => setData((list) => list.map((i) => (i.id === u.id ? { ...i, ...u } : i)))}
      />
    </>
  );
}
