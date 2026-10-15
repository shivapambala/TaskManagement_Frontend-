import { useCallback, useRef, useState } from 'react';
import { Drawer } from './Overlay';
import {
  Avatar, Button, EmptyState, PriorityBadge, TypeChip,
} from './ui';
import { Icon } from './Icon';
import { attachmentApi, issueApi } from '../api/endpoints';
import { useQuery } from '../hooks/useQuery';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { STATUSES, STATUS_LABEL } from '../utils/constants';
import {
  formatBytes, formatDate, formatDateTime, isOverdue, timeAgo,
} from '../utils/format';

function Attachments({ issueId }) {
  const { user } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const fetcher = useCallback(() => attachmentApi.list(issueId), [issueId]);
  const { data, error, loading, reload } = useQuery(fetcher);

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      await attachmentApi.upload(issueId, file, user.email);
      toast.success(`Uploaded ${file.name}`);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    try {
      await attachmentApi.remove(id);
      toast.success('Attachment deleted');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const files = Array.isArray(data) ? data : [];
  return (
    <section className="drawer-section">
      <div className="drawer-section-head">
        <h3>Attachments</h3>
        <input ref={fileRef} type="file" hidden onChange={onPick} aria-label="Choose file to upload" />
        <Button size="sm" variant="secondary" icon="upload" loading={busy} onClick={() => fileRef.current?.click()}>Upload</Button>
      </div>
      {loading && <p className="muted">Loading attachments…</p>}
      {error && <p className="muted">Attachments are unavailable right now. You can still upload files.</p>}
      {!loading && !error && files.length === 0 && <p className="muted">No files attached.</p>}
      <ul className="file-list">
        {files.map((f) => (
          <li key={f.id}>
            <Icon name="clip" size={16} />
            <a href={attachmentApi.downloadUrl(f.id)} target="_blank" rel="noreferrer" className="truncate">{f.fileName}</a>
            <span className="muted">{formatBytes(f.sizeBytes)}</span>
            <button type="button" className="icon-btn" aria-label={`Delete ${f.fileName}`} onClick={() => remove(f.id)}><Icon name="trash" size={16} /></button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Comments({ issueId }) {
  const { user } = useAuth();
  const toast = useToast();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState([]);

  const submit = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSaving(true);
    try {
      const saved = await issueApi.addComment(issueId, user.email, body);
      setComments((c) => [...c, { id: saved?.id ?? Date.now(), authorEmail: user.email, body, createdAt: saved?.createdAt ?? new Date().toISOString() }]);
      setText('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="drawer-section">
      <h3>Comments</h3>
      {comments.length === 0 && <p className="muted">Comments you add in this session appear here.</p>}
      <ul className="comments">
        {comments.map((c) => (
          <li key={c.id}>
            <Avatar name={c.authorEmail} size={28} />
            <div>
              <p className="comment-meta"><strong>{c.authorEmail}</strong> · {timeAgo(c.createdAt)}</p>
              <p className="comment-body">{c.body}</p>
            </div>
          </li>
        ))}
      </ul>
      <form onSubmit={submit} className="comment-form">
        <label className="sr-only" htmlFor={`comment-${issueId}`}>Add a comment</label>
        <textarea id={`comment-${issueId}`} rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a comment…" maxLength={5000} />
        <Button type="submit" size="sm" loading={saving} disabled={!text.trim()}>Comment</Button>
      </form>
    </section>
  );
}

export function IssueDrawer({ issue, onClose, onStatusChange }) {
  const toast = useToast();
  const [updating, setUpdating] = useState(false);

  const changeStatus = async (e) => {
    const next = e.target.value;
    setUpdating(true);
    try {
      const updated = await issueApi.updateStatus(issue.id, next);
      onStatusChange?.(updated ?? { ...issue, issueStatus: next });
      toast.success(`Moved to ${STATUS_LABEL[next]}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Drawer open={Boolean(issue)} onClose={onClose} title={issue ? issue.issueKey || `Issue #${issue.id}` : ''}>
      {issue ? (
        <div className="drawer-content">
          <div className="drawer-title">
            <TypeChip type={issue.issueType} />
            <h3>{issue.issueTitle}</h3>
          </div>
          <dl className="props">
            <dt>Status</dt>
            <dd>
              <select value={issue.issueStatus || 'OPEN'} onChange={changeStatus} disabled={updating} aria-label="Change status">
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </dd>
            <dt>Priority</dt><dd><PriorityBadge priority={issue.priority} /></dd>
            <dt>Assignee</dt><dd className="with-avatar"><Avatar name={issue.assigneeEmail} size={24} />{issue.assigneeEmail || 'Unassigned'}</dd>
            <dt>Reporter</dt><dd>{issue.reportEmail || '—'}</dd>
            <dt>Due</dt><dd className={isOverdue(issue) ? 'text-danger' : ''}>{formatDate(issue.dueDate)}{isOverdue(issue) && ' (overdue)'}</dd>
            <dt>Sprint</dt><dd>{issue.sprintId ? `#${issue.sprintId}` : 'Backlog'}</dd>
            {issue.epicId && (<><dt>Epic</dt><dd>#{issue.epicId}</dd></>)}
            <dt>Created</dt><dd>{formatDateTime(issue.createdAt)}</dd>
          </dl>
          <section className="drawer-section">
            <h3>Description</h3>
            {issue.issueDescription
              ? <p className="prewrap">{issue.issueDescription}</p>
              : <EmptyState icon="issues" title="No description">Add context to help your team.</EmptyState>}
          </section>
          <Attachments issueId={issue.id} />
          <Comments issueId={issue.id} />
        </div>
      ) : null}
    </Drawer>
  );
}
